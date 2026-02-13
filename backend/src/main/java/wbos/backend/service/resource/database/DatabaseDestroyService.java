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
import wbos.backend.service.infrastructure.TerraformService;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseDestroyService {

    private final DatabaseRepository databaseRepository;
    private final TerraformService terraformService;

    /**
     * Destroys a PostgreSQL database
     *
     * @param databaseId The ID of the database to destroy
     * @return ResponseEntity with destruction status
     */
    @Transactional
    public ResponseEntity<DatabaseResponseDto> destroy(Long databaseId) {
        log.info("Starting database destruction for ID: {}", databaseId);

        try {
            // Find database
            Database database = databaseRepository.findById(databaseId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Database not found: " + databaseId));

            // Update status to DESTROYING
            database.setStatus(DatabaseStatus.DESTROYING);
            database = databaseRepository.save(database);

            log.info("Database marked as DESTROYING: {}", database.getName());

            // Convert to DTO for immediate response
            DatabaseResponseDto responseDto = convertToDto(database);

            // Execute Terraform destroy asynchronously
            final Long dbId = database.getId();
            final String dbName = database.getName();
            final String terraformPath = database.getTerraformStatePath();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting async Terraform destroy for: {}", dbName);

                    // Get Terraform working directory
                    Path workingDir = Paths.get(terraformPath);

                    // Execute Terraform destroy
                    boolean success = terraformService.destroyPostgres(workingDir);

                    // Fetch database from repository
                    Database db = databaseRepository.findById(dbId).orElse(null);
                    if (db == null) {
                        log.error("Database not found: {}", dbId);
                        return;
                    }

                    if (success) {
                        // Mark as destroyed
                        db.setStatus(DatabaseStatus.DESTROYED);
                        databaseRepository.save(db);
                        log.info("Database destroyed successfully: {}", db.getName());

                    } else {
                        // Mark as failed (but keep in DB for troubleshooting)
                        db.setStatus(DatabaseStatus.FAILED);
                        databaseRepository.save(db);
                        log.error("Database destruction failed: {}", db.getName());
                    }

                } catch (Exception e) {
                    log.error("Exception during database destruction: {}", dbName, e);
                    databaseRepository.findById(dbId).ifPresent(db -> {
                        db.setStatus(DatabaseStatus.FAILED);
                        databaseRepository.save(db);
                    });
                }
            });

            log.info("Database destruction initiated successfully: {}", database.getName());
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(responseDto);

        } catch (IllegalArgumentException e) {
            log.error("Database not found: {}", databaseId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        } catch (Exception e) {
            log.error("Failed to initiate database destruction: {}", databaseId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Converts Database entity to DatabaseResponseDto
     */
    private DatabaseResponseDto convertToDto(Database database) {
        return DatabaseResponseDto.builder()
                .id(database.getId())
                .name(database.getName())
                .type(database.getType())
                .version(database.getVersion())
                .containerId(database.getContainerId())
                .status(database.getStatus().name())
                .port(database.getPort())
                .connectionString(database.getConnectionString())
                .terraformStatePath(database.getTerraformStatePath())
                .createdAt(database.getCreatedAt())
                .updatedAt(database.getUpdatedAt())
                .build();
    }
}
