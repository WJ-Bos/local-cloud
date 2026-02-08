package wbos.backend.service.utlis.validation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.database.CreateDataBaseRequestDto;
import wbos.backend.model.resource.database.Database;
import wbos.backend.repository.resource.database.DatabaseRepository;

import java.util.Optional;

/**
 * Service for validating database operations
 * Handles validation logic for CREATE, DELETE, and UPDATE operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RequestValidationService {

    private final DatabaseRepository databaseRepository;

    /**
     * Main validation dispatcher - routes to appropriate validation method based on operation
     *
     * @param operation The operation type (CREATE, DELETE, UPDATE, GET)
     * @param requestDto The database request DTO (contains name for all operations)
     * @return true if validation passes, false otherwise
     */
    public boolean validateDbRequest(String operation, CreateDataBaseRequestDto requestDto) {
        log.info("Validating {} request", operation);

        // Validate requestDto is not null for operations that need it
        if (requestDto == null && !operation.equalsIgnoreCase("GET")) {
            log.error("Request DTO cannot be null for {} operation", operation);
            return false;
        }

        return switch (operation.toUpperCase()) {
            case "CREATE" -> validateCreateRequest(requestDto);
            case "DELETE" -> validateDeleteRequest(requestDto.getName());
            case "UPDATE" -> validateUpdateRequest(requestDto.getName());
            case "GET" -> {
                // GET can be for all databases (null name) or specific database
                String name = requestDto != null ? requestDto.getName() : null;
                yield validateGetRequest(name);
            }
            default -> {
                log.error("Unknown operation type: {}", operation);
                yield false;
            }
        };
    }

    /**
     * Validates database creation request
     *
     * Checks:
     * - Database name is provided and valid format
     * - Database name doesn't already exist
     * - Port is in valid range (if provided)
     * - Port is not already in use by RUNNING/PROVISIONING database
     *
     * @param requestDto The database creation request
     * @return true if validation passes, false otherwise
     */
    public boolean validateCreateRequest(CreateDataBaseRequestDto requestDto) {
        log.info("Validating CREATE request for database: {}", requestDto != null ? requestDto.getName() : "null");

        // Validate DTO is not null
        if (requestDto == null) {
            log.error("Request DTO cannot be null");
            return false;
        }

        // Validate name (blank check and format check)
        if (!validateBasicNameRules(requestDto.getName())) {
            return false;
        }

        // Check for duplicate database name (only active databases, not DESTROYED ones)
        Optional<Database> existingDb = databaseRepository.findByName(requestDto.getName());
        if (existingDb.isPresent() && existingDb.get().getStatus() != Database.DatabaseStatus.DESTROYED) {
            log.error("Database with name '{}' already exists and is in '{}' state",
                    requestDto.getName(), existingDb.get().getStatus());
            return false;
        }

        // If database exists but is DESTROYED, the name can be reused
        if (existingDb.isPresent()) {
            log.info("Database name '{}' was previously used but is now DESTROYED - name can be reused",
                    requestDto.getName());
        }

        // Validate port (if provided)
        if (requestDto.getPort() != null && !validatePort(requestDto.getPort())) {
            return false;
        }

        log.info("CREATE validation successful for database: '{}' on port: {}",
                requestDto.getName(),
                requestDto.getPort() != null ? requestDto.getPort() : "auto-assign");
        return true;
    }

    /**
     * Validates database deletion request
     *
     * Checks:
     * - Database name is provided
     * - Database exists with that name
     * - Database is not already in DESTROYING or DESTROYED state
     * - Database can be safely deleted (not in inconsistent state)
     *
     * Note: After deletion, the record is marked as DESTROYED, allowing the name to be reused
     *
     * @param databaseName The name of the database to delete
     * @return true if validation passes, false otherwise
     */
    public boolean validateDeleteRequest(String databaseName) {
        // Validate name is not blank
        if (!validateNameNotBlank(databaseName)) {
            return false;
        }

        // Find database by name
        Optional<Database> databaseOpt = findRequiredDatabase(databaseName);
        if (databaseOpt.isEmpty()) {
            return false;
        }

        Database database = databaseOpt.get();

        // Check if database is already being destroyed
        if (database.getStatus() == Database.DatabaseStatus.DESTROYING) {
            log.error("Database '{}' (ID: {}) is already being destroyed",
                    database.getName(), database.getId());
            return false;
        }

        // Check if database is already destroyed
        if (database.getStatus() == Database.DatabaseStatus.DESTROYED) {
            log.error("Database '{}' (ID: {}) is already destroyed",
                    database.getName(), database.getId());
            return false;
        }

        // Check if database is in a valid state to be deleted
        // For Phase 1: Allow deletion of PROVISIONING, RUNNING, and FAILED databases
        if (database.getStatus() != Database.DatabaseStatus.PROVISIONING &&
            database.getStatus() != Database.DatabaseStatus.RUNNING &&
            database.getStatus() != Database.DatabaseStatus.FAILED) {
            log.error("Database '{}' (ID: {}) is in invalid state '{}' for deletion",
                    database.getName(), database.getId(), database.getStatus());
            return false;
        }

        log.info("DELETE validation successful for database: '{}' (ID: {}, Status: {})",
                database.getName(), database.getId(), database.getStatus());
        return true;
    }

    /**
     * Validates database update request
     *
     * TODO: Phase 1 - Implement when update functionality is added
     * This will be used when implementing Terraform-based updates to:
     * - Modify database configuration
     * - Scale resources
     * - Update database settings
     *
     * Checks will include:
     * - Database exists with given name
     * - Database is in RUNNING state (only running databases can be updated)
     * - Update parameters are valid
     * - No conflicts with other resources
     * - Terraform state is consistent
     *
     * @param databaseName The name of the database to update
     * @return true if validation passes, false otherwise
     */
    public boolean validateUpdateRequest(String databaseName) {
        log.info("Validating UPDATE request for database: '{}'", databaseName);

        // Validate name is not blank
        if (!validateNameNotBlank(databaseName)) {
            return false;
        }

        // Find database by name
        Optional<Database> databaseOpt = findRequiredDatabase(databaseName);
        if (databaseOpt.isEmpty()) {
            return false;
        }

        Database database = databaseOpt.get();

        // TODO: Phase 1 - Implement update validation when Terraform integration is complete
        // For now, updates are not supported in Phase 1 MVP

        // Future validation logic:
        // - Check database is in RUNNING state
        // - Validate update parameters (when updateDto is added)
        // - Check Terraform state consistency
        // - Validate no conflicts with other resources

        log.warn("UPDATE operation is not yet implemented - reserved for future Terraform integration");
        log.info("Database '{}' exists (ID: {}, Status: {}) but updates are not yet supported",
                database.getName(), database.getId(), database.getStatus());
        return false;
    }

    /**
     * Validates database retrieval request
     *
     * For GET operations, validation is minimal as we're just reading data
     *
     * @param databaseName The name of the database to retrieve (optional - null for list all)
     * @return true if validation passes, false otherwise
     */
    public boolean validateGetRequest(String databaseName) {
        log.info("Validating GET request for database: '{}'", databaseName);

        // GET all databases - no validation needed
        if (databaseName == null || databaseName.isBlank()) {
            log.info("GET validation successful - retrieving all databases");
            return true;
        }

        // GET specific database - check if it exists
        Optional<Database> databaseOpt = findRequiredDatabase(databaseName);
        if (databaseOpt.isEmpty()) {
            return false;
        }

        Database database = databaseOpt.get();
        log.info("GET validation successful for database: '{}' (ID: {}, Status: {})",
                database.getName(), database.getId(), database.getStatus());
        return true;
    }

    // ========================================================================================
    // Private Helper Methods
    // ========================================================================================

    /**
     * Validates that database name is not null or blank
     *
     * @param name The database name to validate
     * @return true if name is valid (not null/blank), false otherwise
     */
    private boolean validateNameNotBlank(String name) {
        if (name == null || name.isBlank()) {
            log.error("Database name cannot be null or blank");
            return false;
        }
        return true;
    }

    /**
     * Validates database name format
     * Name must contain only lowercase letters, numbers, and hyphens
     *
     * @param name The database name to validate
     * @return true if name format is valid, false otherwise
     */
    private boolean validateNameFormat(String name) {
        if (!name.matches("^[a-z0-9-]+$")) {
            log.error("Database name '{}' must contain only lowercase letters, numbers, and hyphens", name);
            return false;
        }
        return true;
    }

    /**
     * Validates basic name rules: not blank and correct format
     * Combines validateNameNotBlank and validateNameFormat
     *
     * @param name The database name to validate
     * @return true if name passes all basic rules, false otherwise
     */
    private boolean validateBasicNameRules(String name) {
        return validateNameNotBlank(name) && validateNameFormat(name);
    }

    /**
     * Validates port number
     * Port must be between 5433 and 65535 (5432 is reserved for platform database)
     * Port must not be in use by another PROVISIONING or RUNNING database
     *
     * @param port The port number to validate
     * @return true if port is valid and available, false otherwise
     */
    private boolean validatePort(Integer port) {
        // Check port range
        if (port < 5433 || port > 65535) {
            log.error("Port {} is out of valid range. Must be between 5433 and 65535 (5432 is reserved)", port);
            return false;
        }

        // Check if port is in use
        if (databaseRepository.isPortInUse(port)) {
            log.error("Port {} is already in use by another database in PROVISIONING or RUNNING state", port);
            return false;
        }

        return true;
    }

    /**
     * Finds a database by name and logs error if not found
     * This is a convenience method for operations that require the database to exist
     *
     * @param name The database name to find
     * @return Optional containing the database if found, empty Optional otherwise
     */
    private Optional<Database> findRequiredDatabase(String name) {
        Optional<Database> databaseOpt = databaseRepository.findByName(name);
        if (databaseOpt.isEmpty()) {
            log.error("Database with name '{}' not found", name);
        }
        return databaseOpt;
    }
}
