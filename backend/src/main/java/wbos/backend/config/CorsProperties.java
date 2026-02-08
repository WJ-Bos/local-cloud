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


    private List<String> allowedOrigins = List.of(
        "http://localhost:5173",
        "http://localhost:3000"
    );


    private List<String> allowedMethods = List.of(
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
    );


    private List<String> allowedHeaders = List.of(
        "Authorization", "Content-Type", "Accept", "X-Requested-With"
    );


    private List<String> exposedHeaders = List.of(
        "X-Total-Count", "X-Page-Number", "X-Page-Size"
    );


    private boolean allowCredentials = true;


    private long maxAge = 3600L;
}
