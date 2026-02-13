package wbos.backend.service.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wbos.backend.dto.resource.database.CreateDataBaseRequestDto;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.enums.DatabaseStatus;
import wbos.backend.enums.DatabaseType;
import wbos.backend.model.resource.database.Database;
import wbos.backend.records.TerraformResult;
import wbos.backend.repository.resource.database.DatabaseRepository;
import wbos.backend.service.infrastructure.DatabaseConfigProvider;
import wbos.backend.service.infrastructure.TerraformService;
import wbos.backend.service.security.PasswordEncryptionService;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseProvisionService {

    private final DatabaseRepository databaseRepository;
    private final TerraformService terraformService;
    private final PasswordEncryptionService passwordEncryptionService;
    private final DatabaseConfigProvider configProvider;

    /**
     * Provisions a new PostgreSQL database
     *
     * @param requestDto The database creation request
     * @return ResponseEntity with database details
     */
    @Transactional
    public ResponseEntity<DatabaseResponseDto> provision(CreateDataBaseRequestDto requestDto) {
        log.info("Starting database provisioning for: {}", requestDto.getName());

        try {
            // Use provided port or find next available port
            Integer assignedPort = requestDto.getPort() != null
                    ? requestDto.getPort()
                    : findNextAvailablePort(requestDto.getType());

            log.info("Assigned port {} to database {} (user-provided: {})",
                    assignedPort,
                    requestDto.getName(),
                    requestDto.getPort() != null);

            // Create database entity with PROVISIONING status
            Database database = Database.builder()
                    .name(requestDto.getName())
                    .type(requestDto.getType())
                    .version(requestDto.getVersion())
                    .memoryMb(requestDto.getMemoryMb())
                    .status(DatabaseStatus.PROVISIONING)
                    .port(assignedPort)
                    .terraformStatePath(String.format("/tmp/terraform/%s", requestDto.getName()))
                    .build();

            // Save to database
            Database savedDatabase = databaseRepository.save(database);
            log.info("Database metadata saved with ID: {}", savedDatabase.getId());

            // Convert to DTO for immediate response
            DatabaseResponseDto responseDto = convertToDto(savedDatabase);

            // Execute Terraform provisioning asynchronously
            final Long dbId = savedDatabase.getId();
            final String dbName = savedDatabase.getName();
            final DatabaseType dbType = savedDatabase.getType();
            final Integer dbPort = savedDatabase.getPort();
            final String dbVersion = savedDatabase.getVersion();
            final Integer dbMemoryMb = savedDatabase.getMemoryMb();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting async Terraform provisioning for: {} (type: {}, version: {}, memory: {}MB)",
                            dbName, dbType, dbVersion, dbMemoryMb != null ? dbMemoryMb : "unlimited");

                    // Execute Terraform
                    TerraformResult result = terraformService.provisionDatabase(
                            dbName,
                            dbType,
                            dbPort,
                            dbVersion,
                            dbMemoryMb
                    );

                    // Fetch database from repository
                    Database db = databaseRepository.findById(dbId).orElse(null);
                    if (db == null) {
                        log.error("Database not found: {}", dbId);
                        return;
                    }

                    if (result.success()) {
                        // Update database with connection details
                        db.setConnectionString(result.connectionString());
                        db.setContainerId(result.containerId());
                        db.setStatus(DatabaseStatus.RUNNING);

                        // Encrypt and store password
                        String encryptedPassword = passwordEncryptionService.encrypt(result.password());
                        db.setEncryptedPassword(encryptedPassword);

                        db.setTerraformStatePath(
                                result.workingDirectory() != null
                                        ? result.workingDirectory().toString()
                                        : db.getTerraformStatePath()
                        );

                        databaseRepository.save(db);
                        log.info("Database provisioned successfully: {} (container: {})",
                                db.getName(),
                                result.containerId());

                    } else {
                        db.setStatus(DatabaseStatus.FAILED);
                        databaseRepository.save(db);
                        log.error("Database provisioning failed: {} - {}",
                                db.getName(),
                                result.errorMessage());
                    }

                } catch (Exception e) {
                    log.error("Exception during database provisioning: {}", dbName, e);
                    databaseRepository.findById(dbId).ifPresent(db -> {
                        db.setStatus(DatabaseStatus.FAILED);
                        databaseRepository.save(db);
                    });
                }
            });

            log.info("Database provisioning initiated successfully: {}", database.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);

        } catch (Exception e) {
            log.error("Failed to provision database: {}", requestDto.getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Finds the next available port for a new database
     * Uses type-specific default port as starting point
     *
     * @param type The database type
     * @return Next available port number
     */
    private Integer findNextAvailablePort(DatabaseType type) {
        Integer defaultPort = configProvider.getDefaultStartPort(type);
        Integer maxPort = databaseRepository.findMaxPort();

        // If no databases exist, use the default port for this type
        if (maxPort == null) {
            return defaultPort;
        }

        // If max port is less than default, use default
        if (maxPort < defaultPort) {
            return defaultPort;
        }

        // Otherwise, increment from max port
        return maxPort + 1;
    }

    /**
     * Converts Database entity to DatabaseResponseDto
     *
     * @param database The database entity
     * @return DatabaseResponseDto
     */
    private DatabaseResponseDto convertToDto(Database database) {
        // Decrypt password if present
        String decryptedPassword = null;
        if (database.getEncryptedPassword() != null) {
            try {
                decryptedPassword = passwordEncryptionService.decrypt(database.getEncryptedPassword());
            } catch (Exception e) {
                log.warn("Failed to decrypt password for database: {}", database.getId());
            }
        }

        return DatabaseResponseDto.builder()
                .id(database.getId())
                .name(database.getName())
                .type(database.getType())
                .version(database.getVersion())
                .memoryMb(database.getMemoryMb())
                .containerId(database.getContainerId())
                .status(database.getStatus().name())
                .port(database.getPort())
                .connectionString(database.getConnectionString())
                .password(decryptedPassword)
                .terraformStatePath(database.getTerraformStatePath())
                .createdAt(database.getCreatedAt())
                .updatedAt(database.getUpdatedAt())
                .build();
    }
}
