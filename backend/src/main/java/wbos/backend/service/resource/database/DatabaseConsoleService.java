package wbos.backend.service.resource.database;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import wbos.backend.config.DockerClientFactory;
import wbos.backend.dto.resource.database.ConsoleLogsResponse;
import wbos.backend.enums.DatabaseStatus;
import wbos.backend.model.resource.database.Database;
import wbos.backend.repository.resource.database.DatabaseRepository;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseConsoleService {

    private final DatabaseRepository databaseRepository;
    private final DockerClientFactory dockerClientFactory;

    public ConsoleLogsResponse getLogs(Long databaseId, int tail, String filter) {
        Database database = requireRunning(databaseId);

        // Fetch more lines than requested when filtering so we can apply the limit after the filter
        int fetchLimit = (filter != null && !filter.isBlank()) ? Math.max(tail * 10, 1000) : tail;

        try (DockerClient docker = dockerClientFactory.createClient()) {
            List<String> allLines = new ArrayList<>();

            docker.logContainerCmd(database.getContainerId())
                    .withStdOut(true)
                    .withStdErr(true)
                    .withTail(fetchLimit)
                    .exec(new ResultCallback.Adapter<>() {
                        @Override
                        public void onNext(Frame frame) {
                            if (frame == null || frame.getPayload() == null) return;
                            String line = new String(frame.getPayload(), StandardCharsets.UTF_8).stripTrailing();
                            if (!line.isBlank()) {
                                allLines.add(line);
                            }
                        }
                    })
                    .awaitCompletion();

            List<String> filtered = (filter != null && !filter.isBlank())
                    ? allLines.stream().filter(l -> l.contains(filter)).toList()
                    : allLines;

            List<String> result = filtered.size() > tail
                    ? filtered.subList(filtered.size() - tail, filtered.size())
                    : filtered;

            log.info("Fetched {} log lines for database {} (filter={})", result.size(), databaseId, filter);
            return ConsoleLogsResponse.of(result);

        } catch (Exception e) {
            log.error("Failed to get logs for database {}: {}", databaseId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to retrieve logs: " + e.getMessage());
        }
    }

    public String getInspect(Long databaseId) {
        Database database = requireRunning(databaseId);

        try (DockerClient docker = dockerClientFactory.createClient()) {
            var inspect = docker.inspectContainerCmd(database.getContainerId()).exec();

            // InspectContainerResponse has Object-typed fields that vanilla Jackson can't handle;
            // disable FAIL_ON_EMPTY_BEANS so those serialise as {} instead of throwing.
            ObjectMapper mapper = new ObjectMapper()
                    .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(inspect);

        } catch (Exception e) {
            log.error("Failed to inspect database {}: {}", databaseId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to inspect container: " + e.getMessage());
        }
    }

    private Database requireRunning(Long databaseId) {
        Database database = databaseRepository.findById(databaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Database not found: " + databaseId));

        if (database.getStatus() != DatabaseStatus.RUNNING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Database is not running (status=" + database.getStatus() + ")");
        }

        if (database.getContainerId() == null || database.getContainerId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No container ID for database: " + database.getName());
        }

        return database;
    }
}
