package wbos.backend.service.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.enums.DatabaseStatus;
import wbos.backend.model.resource.database.Database;
import wbos.backend.repository.resource.database.DatabaseRepository;
import wbos.backend.service.security.PasswordEncryptionService;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseControlService {

    private final DatabaseRepository databaseRepository;
    private final PasswordEncryptionService passwordEncryptionService;

    /**
     * Stops a running database container
     */
    @Transactional
    public ResponseEntity<DatabaseResponseDto> stopDatabase(Long databaseId) {
        log.info("Stopping database with ID: {}", databaseId);

        try {
            Database database = databaseRepository.findById(databaseId)
                    .orElseThrow(() -> new IllegalArgumentException("Database not found: " + databaseId));

            if (database.getStatus() != DatabaseStatus.RUNNING) {
                log.warn("Database {} is not in RUNNING state (current: {})",
                    database.getName(), database.getStatus());
                return ResponseEntity.badRequest().build();
            }

            if (database.getContainerId() == null) {
                log.error("Database {} has no container ID", database.getName());
                return ResponseEntity.badRequest().build();
            }

            // Update status to STOPPING
            database.setStatus(DatabaseStatus.STOPPING);
            database = databaseRepository.save(database);

            DatabaseResponseDto responseDto = convertToDto(database);

            // Execute docker stop asynchronously
            final Long dbId = database.getId();
            final String containerId = database.getContainerId();
            final String dbName = database.getName();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Executing docker stop for container: {}", containerId);
                    boolean success = executeDockerCommand("stop", containerId);

                    Database db = databaseRepository.findById(dbId).orElse(null);
                    if (db == null) {
                        log.error("Database not found: {}", dbId);
                        return;
                    }

                    if (success) {
                        db.setStatus(DatabaseStatus.STOPPED);
                        databaseRepository.save(db);
                        log.info("Database stopped successfully: {}", dbName);
                    } else {
                        db.setStatus(DatabaseStatus.RUNNING);
                        databaseRepository.save(db);
                        log.error("Failed to stop database: {}", dbName);
                    }
                } catch (Exception e) {
                    log.error("Exception during database stop: {}", dbName, e);
                    databaseRepository.findById(dbId).ifPresent(db -> {
                        db.setStatus(DatabaseStatus.RUNNING);
                        databaseRepository.save(db);
                    });
                }
            });

            return ResponseEntity.ok(responseDto);

        } catch (IllegalArgumentException e) {
            log.error("Database not found: {}", databaseId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Failed to stop database: {}", databaseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Starts a stopped database container
     */
    @Transactional
    public ResponseEntity<DatabaseResponseDto> startDatabase(Long databaseId) {
        log.info("Starting database with ID: {}", databaseId);

        try {
            Database database = databaseRepository.findById(databaseId)
                    .orElseThrow(() -> new IllegalArgumentException("Database not found: " + databaseId));

            if (database.getStatus() != DatabaseStatus.STOPPED) {
                log.warn("Database {} is not in STOPPED state (current: {})",
                    database.getName(), database.getStatus());
                return ResponseEntity.badRequest().build();
            }

            if (database.getContainerId() == null) {
                log.error("Database {} has no container ID", database.getName());
                return ResponseEntity.badRequest().build();
            }

            // Update status to STARTING
            database.setStatus(DatabaseStatus.STARTING);
            database = databaseRepository.save(database);

            DatabaseResponseDto responseDto = convertToDto(database);

            // Execute docker start asynchronously
            final Long dbId = database.getId();
            final String containerId = database.getContainerId();
            final String dbName = database.getName();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Executing docker start for container: {}", containerId);
                    boolean success = executeDockerCommand("start", containerId);

                    Database db = databaseRepository.findById(dbId).orElse(null);
                    if (db == null) {
                        log.error("Database not found: {}", dbId);
                        return;
                    }

                    if (success) {
                        db.setStatus(DatabaseStatus.RUNNING);
                        databaseRepository.save(db);
                        log.info("Database started successfully: {}", dbName);
                    } else {
                        db.setStatus(DatabaseStatus.STOPPED);
                        databaseRepository.save(db);
                        log.error("Failed to start database: {}", dbName);
                    }
                } catch (Exception e) {
                    log.error("Exception during database start: {}", dbName, e);
                    databaseRepository.findById(dbId).ifPresent(db -> {
                        db.setStatus(DatabaseStatus.STOPPED);
                        databaseRepository.save(db);
                    });
                }
            });

            return ResponseEntity.ok(responseDto);

        } catch (IllegalArgumentException e) {
            log.error("Database not found: {}", databaseId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Failed to start database: {}", databaseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Executes a docker command
     */
    private boolean executeDockerCommand(String command, String containerId) {
        try {
            ProcessBuilder pb = new ProcessBuilder("docker", command, containerId);
            pb.redirectErrorStream(true);

            log.info("Executing: docker {} {}", command, containerId);

            Process process = pb.start();

            // Read output
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("Docker: {}", line);
                }
            }

            int exitCode = process.waitFor();
            log.info("Docker {} command completed with exit code: {}", command, exitCode);

            return exitCode == 0;

        } catch (Exception e) {
            log.error("Failed to execute docker {} command", command, e);
            return false;
        }
    }

    /**
     * Converts Database entity to DatabaseResponseDto
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
