package wbos.backend.service.utlis.validation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.database.DatabaseRequestDto;
import wbos.backend.dto.resource.database.UpdateDatabaseRequestDto;
import wbos.backend.enums.DatabaseStatus;
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
    public boolean validateDbRequest(String operation, DatabaseRequestDto requestDto) {
        log.info("Validating {} request", operation);

        if (requestDto == null && !operation.equalsIgnoreCase("GET")) {
            log.error("Request DTO cannot be null for {} operation", operation);
            return false;
        }

        return switch (operation.toUpperCase()) {
            case "CREATE" -> validateCreateRequest(requestDto);
            case "DELETE" -> {
                String name = requestDto != null ? requestDto.getName() : null;
                yield validateDeleteRequest(name);
            }
            case "GET" -> {
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
    public boolean validateCreateRequest(DatabaseRequestDto requestDto) {
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

        Optional<Database> existingDb = databaseRepository.findByName(requestDto.getName());
        if (existingDb.isPresent() && existingDb.get().getStatus() != DatabaseStatus.DESTROYED) {
            log.error("Database with name '{}' already exists and is in '{}' state",
                    requestDto.getName(), existingDb.get().getStatus());
            return false;
        }

        if (existingDb.isPresent()) {
            log.info("Database name '{}' was previously used but is now DESTROYED - name can be reused",
                    requestDto.getName());
        }

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
        if (database.getStatus() == DatabaseStatus.DESTROYING) {
            log.error("Database '{}' (ID: {}) is already being destroyed",
                    database.getName(), database.getId());
            return false;
        }

        // Check if database is already destroyed
        if (database.getStatus() == DatabaseStatus.DESTROYED) {
            log.error("Database '{}' (ID: {}) is already destroyed",
                    database.getName(), database.getId());
            return false;
        }

        if (database.getStatus() != DatabaseStatus.PROVISIONING &&
            database.getStatus() != DatabaseStatus.RUNNING &&
            database.getStatus() != DatabaseStatus.FAILED) {
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
     * Checks:
     * - Database name is provided and valid format
     * - Database exists with given name
     * - Database is in STOPPED state (only stopped databases can be updated)
     * - If newName is provided, validate it's not already in use (unless DESTROYED)
     * - If port is being changed, validate the new port
     *
     * @param requestDto The database update request
     * @return true if validation passes, false otherwise
     */
    public boolean validateUpdateRequest(UpdateDatabaseRequestDto requestDto) {
        log.info("Validating UPDATE request for database: '{}'",
                requestDto != null ? requestDto.getName() : "null");

        if (requestDto == null) {
            log.error("Request DTO cannot be null");
            return false;
        }

        if (!validateNameNotBlank(requestDto.getName())) {
            return false;
        }

        Optional<Database> databaseOpt = findRequiredDatabase(requestDto.getName());
        if (databaseOpt.isEmpty()) {
            return false;
        }

        Database database = databaseOpt.get();

        if (database.getStatus() != DatabaseStatus.STOPPED) {
            log.error("Database '{}' (ID: {}) cannot be updated - must be in STOPPED state but is in '{}' state",
                    database.getName(), database.getId(), database.getStatus());
            return false;
        }

        if (requestDto.getNewName() != null && !requestDto.getNewName().equals(database.getName())) {
            if (!validateNameFormat(requestDto.getNewName())) {
                return false;
            }

            Optional<Database> existingDb = databaseRepository.findByName(requestDto.getNewName());
            if (existingDb.isPresent() && existingDb.get().getStatus() != DatabaseStatus.DESTROYED) {
                log.error("Database with name '{}' already exists and is in '{}' state",
                        requestDto.getNewName(), existingDb.get().getStatus());
                return false;
            }
        }

        if (requestDto.getPort() != null && !requestDto.getPort().equals(database.getPort())) {
            if (!validatePortForUpdate(requestDto.getPort(), database.getId())) {
                return false;
            }
        }

        log.info("UPDATE validation successful for database: '{}' (ID: {}, Status: {})",
                database.getName(), database.getId(), database.getStatus());
        return true;
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
     * Validates port number for database updates
     * Similar to validatePort but excludes the current database being updated
     *
     * @param port The port number to validate
     * @param currentDatabaseId The ID of the database being updated
     * @return true if port is valid and available, false otherwise
     */
    private boolean validatePortForUpdate(Integer port, Long currentDatabaseId) {
        // Check port range
        if (port < 5433 || port > 65535) {
            log.error("Port {} is out of valid range. Must be between 5433 and 65535 (5432 is reserved)", port);
            return false;
        }

        // Check if port is in use by a DIFFERENT database
        Optional<Database> dbOnPort = databaseRepository.findByPort(port);
        if (dbOnPort.isPresent() && !dbOnPort.get().getId().equals(currentDatabaseId)) {
            Database conflictingDb = dbOnPort.get();
            // Check if the conflicting database is in an active state
            if (conflictingDb.getStatus() == DatabaseStatus.PROVISIONING ||
                conflictingDb.getStatus() == DatabaseStatus.RUNNING ||
                conflictingDb.getStatus() == DatabaseStatus.STARTING ||
                conflictingDb.getStatus() == DatabaseStatus.UPDATING ||
                conflictingDb.getStatus() == DatabaseStatus.STOPPING) {
                log.error("Port {} is already in use by database '{}' (ID: {}) in '{}' state",
                        port, conflictingDb.getName(), conflictingDb.getId(), conflictingDb.getStatus());
                return false;
            }
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
