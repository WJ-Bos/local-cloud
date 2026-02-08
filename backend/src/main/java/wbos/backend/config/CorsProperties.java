package wbos.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * CORS Configuration Properties
 *
 * Allows CORS settings to be configured via application.yml
 */
@Configuration
@ConfigurationProperties(prefix = "app.cors")
@Data
public class CorsProperties {

    /**
     * List of allowed origins for CORS
     * Example: http://localhost:5173, http://localhost:3000
     */
    private List<String> allowedOrigins = List.of(
        "http://localhost:5173",
        "http://localhost:3000"
    );

    /**
     * List of allowed HTTP methods
     */
    private List<String> allowedMethods = List.of(
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
    );

    /**
     * List of allowed headers
     */
    private List<String> allowedHeaders = List.of(
        "Authorization", "Content-Type", "Accept", "X-Requested-With"
    );

    /**
     * List of exposed headers
     */
    private List<String> exposedHeaders = List.of(
        "X-Total-Count", "X-Page-Number", "X-Page-Size"
    );

    /**
     * Whether to allow credentials (cookies, authorization headers)
     */
    private boolean allowCredentials = true;

    /**
     * Max age for preflight requests in seconds
     */
    private long maxAge = 3600L;
}
