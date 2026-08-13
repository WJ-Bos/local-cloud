package wbos.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import wbos.backend.service.resource.instance.InstanceTerminalHandler;

/**
 * Registers the WebSocket endpoint for the instance web console.
 * Full handshake URL: ws://host:8080/api/v1/ws/instances/{id}/terminal
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketConfigurer {

    private final InstanceTerminalHandler instanceTerminalHandler;
    private final CorsProperties corsProperties;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = corsProperties.getAllowedOrigins().toArray(new String[0]);
        registry.addHandler(instanceTerminalHandler, "/ws/instances/*/terminal")
                .setAllowedOrigins(origins);
        log.info("Registered instance terminal WebSocket handler (origins: {})",
                corsProperties.getAllowedOrigins());
    }
}
