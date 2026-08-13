package wbos.backend.service.resource.instance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.model.Frame;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import wbos.backend.config.DockerClientFactory;
import wbos.backend.enums.InstanceStatus;
import wbos.backend.model.resource.instance.Instance;
import wbos.backend.repository.resource.instance.InstanceRepository;

import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler that bridges a browser terminal (xterm.js) to an
 * interactive shell inside the instance container via docker exec —
 * the EC2 Instance Connect equivalent.
 *
 * Protocol:
 *  - client -> server: JSON text messages {"type":"input","data":"..."} and
 *    {"type":"resize","cols":N,"rows":N}
 *  - server -> client: raw shell output as binary frames (xterm writes bytes directly)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InstanceTerminalHandler extends TextWebSocketHandler {

    private final InstanceRepository instanceRepository;
    private final DockerClientFactory dockerClientFactory;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, TerminalSession> sessions = new ConcurrentHashMap<>();

    private record TerminalSession(DockerClient dockerClient,
                                   String execId,
                                   PipedOutputStream stdin,
                                   ResultCallback.Adapter<Frame> callback) {
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long instanceId = extractInstanceId(session);
        if (instanceId == null) {
            session.close(CloseStatus.BAD_DATA.withReason("Invalid instance id in URL"));
            return;
        }

        Optional<Instance> instanceOpt = instanceRepository.findById(instanceId);
        if (instanceOpt.isEmpty()) {
            session.close(CloseStatus.BAD_DATA.withReason("Instance not found: " + instanceId));
            return;
        }

        Instance instance = instanceOpt.get();
        if (instance.getStatus() != InstanceStatus.RUNNING
                || instance.getContainerId() == null || instance.getContainerId().isBlank()) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason(
                    "Instance is not running (status=" + instance.getStatus() + ")"));
            return;
        }

        log.info("Opening terminal session {} for instance {} (container {})",
                session.getId(), instance.getName(), instance.getContainerId());

        DockerClient dockerClient = dockerClientFactory.createClient();
        PipedOutputStream stdinWriter = new PipedOutputStream();
        PipedInputStream stdinReader = new PipedInputStream(stdinWriter, 8192);

        try {
            ExecCreateCmdResponse exec = dockerClient.execCreateCmd(instance.getContainerId())
                    .withAttachStdin(true)
                    .withAttachStdout(true)
                    .withAttachStderr(true)
                    .withTty(true)
                    .withEnv(List.of("TERM=xterm-256color"))
                    .withCmd("/bin/sh", "-c", "if [ -x /bin/bash ]; then exec /bin/bash; else exec /bin/sh; fi")
                    .exec();

            ResultCallback.Adapter<Frame> callback = new ResultCallback.Adapter<>() {
                @Override
                public void onNext(Frame frame) {
                    if (frame == null || frame.getPayload() == null) return;
                    try {
                        synchronized (session) {
                            if (session.isOpen()) {
                                session.sendMessage(new BinaryMessage(frame.getPayload()));
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to forward terminal output for session {}: {}",
                                session.getId(), e.getMessage());
                    }
                }

                @Override
                public void onComplete() {
                    closeQuietly(session, CloseStatus.NORMAL.withReason("Shell exited"));
                }

                @Override
                public void onError(Throwable throwable) {
                    log.warn("Terminal exec stream error for session {}: {}",
                            session.getId(), throwable.getMessage());
                    closeQuietly(session, CloseStatus.SERVER_ERROR.withReason("Shell stream error"));
                }
            };

            dockerClient.execStartCmd(exec.getId())
                    .withTty(true)
                    .withStdIn(stdinReader)
                    .exec(callback);

            sessions.put(session.getId(), new TerminalSession(dockerClient, exec.getId(), stdinWriter, callback));

        } catch (Exception e) {
            log.error("Failed to open terminal for instance {}: {}", instance.getName(), e.getMessage());
            try { stdinWriter.close(); } catch (Exception ignored) { }
            try { dockerClient.close(); } catch (Exception ignored) { }
            session.close(CloseStatus.SERVER_ERROR.withReason("Failed to attach shell: " + e.getMessage()));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        TerminalSession terminal = sessions.get(session.getId());
        if (terminal == null) return;

        try {
            JsonNode node = objectMapper.readTree(message.getPayload());
            String type = node.path("type").asText();

            switch (type) {
                case "input" -> {
                    String data = node.path("data").asText();
                    terminal.stdin().write(data.getBytes(StandardCharsets.UTF_8));
                    terminal.stdin().flush();
                }
                case "resize" -> {
                    int cols = node.path("cols").asInt(80);
                    int rows = node.path("rows").asInt(24);
                    terminal.dockerClient().resizeExecCmd(terminal.execId())
                            .withSize(rows, cols)
                            .exec();
                }
                default -> log.debug("Ignoring unknown terminal message type: {}", type);
            }
        } catch (Exception e) {
            log.warn("Failed to handle terminal message for session {}: {}", session.getId(), e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        TerminalSession terminal = sessions.remove(session.getId());
        if (terminal == null) return;

        log.info("Closing terminal session {} ({})", session.getId(), status);
        try { terminal.stdin().close(); } catch (Exception ignored) { }
        try { terminal.callback().close(); } catch (Exception ignored) { }
        try { terminal.dockerClient().close(); } catch (Exception ignored) { }
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try {
            if (session.isOpen()) {
                session.close(status);
            }
        } catch (Exception ignored) {
        }
    }

    /**
     * Extracts the instance id from the handshake path: /ws/instances/{id}/terminal
     */
    private Long extractInstanceId(WebSocketSession session) {
        try {
            String path = session.getUri() != null ? session.getUri().getPath() : "";
            String[] segments = path.split("/");
            for (int i = 0; i < segments.length - 1; i++) {
                if ("instances".equals(segments[i]) && "terminal".equals(segments[i + 2])) {
                    return Long.parseLong(segments[i + 1]);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse instance id from terminal URL: {}", session.getUri());
        }
        return null;
    }
}
