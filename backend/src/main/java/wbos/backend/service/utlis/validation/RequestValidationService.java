package wbos.backend.service.utlis.validation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.database.CreateDataBaseRequestDto;
import wbos.backend.repository.resource.database.DatabaseRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequestValidationService {

    private final DatabaseRepository databaseRepository;

    /**
     * Validates database creation request
     *
     * @param operation The operation type (CREATE, UPDATE, DELETE)
     * @param requestDto The database request DTO
     * @return true if validation passes, false otherwise
     */
    public boolean validateDbRequest(String operation, CreateDataBaseRequestDto requestDto) {
        log.info("Validating {} request for database: {}", operation, requestDto.getName());

        // Validate name
        if (requestDto == null || requestDto.getName() == null || requestDto.getName().isBlank()) {
            log.error("Database name is required");
            return false;
        }

        if (!requestDto.getName().matches("^[a-z0-9-]+$")) {
            log.error("Database name must contain only lowercase letters, numbers, and hyphens");
            return false;
        }

        if (databaseRepository.existsByName(requestDto.getName())) {
            log.error("Database with name '{}' already exists", requestDto.getName());
            return false;
        }

        // Validate port if provided
        if (requestDto.getPort() != null) {
            if (requestDto.getPort() < 5433 || requestDto.getPort() > 65535) {
                log.error("Port must be between 5433 and 65535 (5432 is reserved)");
                return false;
            }

            if (databaseRepository.isPortInUse(requestDto.getPort())) {
                log.error("Port {} is already in use by another database in PROVISIONING or RUNNING state",
                         requestDto.getPort());
                return false;
            }
        }

        log.info("Validation successful for database: {} on port: {}",
                requestDto.getName(),
                requestDto.getPort() != null ? requestDto.getPort() : "auto-assign");
        return true;
    }
}
