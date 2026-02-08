package wbos.backend.service.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.dto.resource.database.UpdateDatabaseRequestDto;
import wbos.backend.enums.DatabaseStatus;
import wbos.backend.enums.DatabaseType;
import wbos.backend.model.resource.database.Database;
import wbos.backend.records.TerraformResult;
import wbos.backend.repository.resource.database.DatabaseRepository;
import wbos.backend.service.infrastructure.TerraformService;
import wbos.backend.service.security.PasswordEncryptionService;

import java.nio.file.Paths;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseUpdateService {

    private final DatabaseRepository databaseRepository;
    private final TerraformService terraformService;
    private final PasswordEncryptionService passwordEncryptionService;

    /**
     * Update an existing database instance
     *
     * Currently supports:
     * - Name changes (will trigger container recreation via Terraform)
     * - Port changes (will trigger container recreation via Terraform)
     *
     * The database MUST be in STOPPED status to be updated.
     *
     * @param requestDto The update request containing database name and new configuration
     * @return ResponseEntity with updated database details
     */
    @Transactional
    public ResponseEntity<DatabaseResponseDto> update(UpdateDatabaseRequestDto requestDto) {
        log.info("Starting database update for: {}", requestDto.getName());

        // Find the database
        Optional<Database> databaseOpt = databaseRepository.findByName(requestDto.getName());
        if (databaseOpt.isEmpty()) {
            log.error("Database not found: {}", requestDto.getName());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Database database = databaseOpt.get();

        // Verify database is STOPPED
        if (database.getStatus() != DatabaseStatus.STOPPED) {
            log.error("Database {} is not stopped (status: {}). Cannot update.",
                    database.getName(), database.getStatus());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(DatabaseResponseDto.builder()
                            .id(database.getId())
                            .name(database.getName())
                            .status(database.getStatus().name())
                            .build());
        }

        // Check for changes
        String newName = requestDto.getNewName() != null ? requestDto.getNewName() : database.getName();
        Integer newPort = requestDto.getPort() != null ? requestDto.getPort() : database.getPort();

        boolean hasNameChanged = !newName.equals(database.getName());
        boolean hasPortChanged = !newPort.equals(database.getPort());

        if (!hasNameChanged && !hasPortChanged) {
            log.info("No changes detected for database '{}' - all values are the same", database.getName());
            return ResponseEntity.status(HttpStatus.OK).body(mapToResponseDto(database));
        }

        StringBuilder changeLog = new StringBuilder();
        if (hasNameChanged) {
            changeLog.append(String.format("Name: '%s' -> '%s'; ", database.getName(), newName));
        }
        if (hasPortChanged) {
            changeLog.append(String.format("Port: %d -> %d; ", database.getPort(), newPort));
        }

        log.info("Updating database '{}': {}", database.getName(), changeLog);

        // Set status to UPDATING
        database.setStatus(DatabaseStatus.UPDATING);
        Database updatingDatabase = databaseRepository.save(database);

        // Return response immediately with UPDATING status
        DatabaseResponseDto responseDto = mapToResponseDto(updatingDatabase);

        // Execute Terraform update asynchronously
        final Long dbId = updatingDatabase.getId();
        final String oldName = updatingDatabase.getName();
        final DatabaseType dbType = updatingDatabase.getType();
        final String finalNewName = newName;
        final Integer finalNewPort = newPort;
        final String oldTerraformPath = updatingDatabase.getTerraformStatePath();

        CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting async Terraform update for: {} -> {} (type: {})", oldName, finalNewName, dbType);

                // Decrypt existing password to preserve it
                String existingPassword = null;
                try {
                    if (updatingDatabase.getEncryptedPassword() != null) {
                        existingPassword = passwordEncryptionService.decrypt(
                                updatingDatabase.getEncryptedPassword());
                        log.info("Retrieved existing password for database: {}", oldName);
                    }
                } catch (Exception e) {
                    log.error("Failed to decrypt existing password for database: {}", oldName, e);
                    // If we can't get the password, we can't update
                    Database db = databaseRepository.findById(dbId).orElse(null);
                    if (db != null) {
                        db.setStatus(DatabaseStatus.FAILED);
                        databaseRepository.save(db);
                    }
                    return;
                }

                // Execute Terraform update
                TerraformResult result = terraformService.updateDatabase(
                        oldName,
                        finalNewName,
                        dbType,
                        finalNewPort,
                        existingPassword,
                        Paths.get(oldTerraformPath)
                );

                // Fetch database from repository
                Database db = databaseRepository.findById(dbId).orElse(null);
                if (db == null) {
                    log.error("Database not found: {}", dbId);
                    return;
                }

                if (result.success()) {
                    // Update database with new configuration
                    db.setName(finalNewName);
                    db.setPort(finalNewPort);
                    db.setConnectionString(result.connectionString());
                    db.setContainerId(result.containerId());
                    db.setStatus(DatabaseStatus.RUNNING);
                    db.setTerraformStatePath(
                            result.workingDirectory() != null
                                    ? result.workingDirectory().toString()
                                    : String.format("/tmp/terraform/%s", finalNewName)
                    );

                    // Password remains the same (already encrypted in database)

                    databaseRepository.save(db);
                    log.info("Database updated successfully: {} -> {} (container: {})",
                            oldName,
                            finalNewName,
                            result.containerId());

                } else {
                    db.setStatus(DatabaseStatus.FAILED);
                    databaseRepository.save(db);
                    log.error("Database update failed: {} -> {} - {}",
                            oldName,
                            finalNewName,
                            result.errorMessage());
                }

            } catch (Exception e) {
                log.error("Exception during database update: {} -> {}", oldName, finalNewName, e);
                databaseRepository.findById(dbId).ifPresent(db -> {
                    db.setStatus(DatabaseStatus.FAILED);
                    databaseRepository.save(db);
                });
            }
        });

        log.info("Database update initiated successfully: {} -> {}", oldName, finalNewName);
        return ResponseEntity.status(HttpStatus.OK).body(responseDto);
    }

    private DatabaseResponseDto mapToResponseDto(Database database) {
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
