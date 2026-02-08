package wbos.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Web Security Configuration for Local Cloud Control Plane
 *
 * This configuration:
 * - Disables CSRF for stateless REST API
 * - Configures CORS to allow frontend access
 * - Permits all requests (authentication to be added in future phases)
 * - Uses stateless session management
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Slf4j
public class WebSecurityConfig {

    private final CorsProperties corsProperties;

    /**
     * Configure security filter chain
     *
     * Phase 1 MVP: All endpoints are public
     * Future phases will add authentication/authorization
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring security filter chain");

        http
            // CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // CSRF disabled for stateless REST API
            .csrf(csrf -> csrf.disable())

            // Session management - stateless for REST API
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Phase 1: Permit all requests (no authentication)
                .anyRequest().permitAll()

                // Future phases: Uncomment below for authentication
                // .requestMatchers("/api/v1/auth/**").permitAll()
                // .requestMatchers("/api/v1/health").permitAll()
                // .anyRequest().authenticated()
            );

        log.info("Security filter chain configured successfully");
        return http.build();
    }

    /**
     * Configure CORS to allow frontend access
     *
     * Configuration is managed via CorsProperties and can be customized in application.yml
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        log.info("Configuring CORS policy");

        CorsConfiguration configuration = new CorsConfiguration();

        // Load configuration from CorsProperties
        configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
        configuration.setAllowedMethods(corsProperties.getAllowedMethods());
        configuration.setAllowedHeaders(corsProperties.getAllowedHeaders());
        configuration.setExposedHeaders(corsProperties.getExposedHeaders());
        configuration.setAllowCredentials(corsProperties.isAllowCredentials());
        configuration.setMaxAge(corsProperties.getMaxAge());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        log.info("CORS policy configured - Allowed origins: {}", configuration.getAllowedOrigins());
        return source;
    }
}
