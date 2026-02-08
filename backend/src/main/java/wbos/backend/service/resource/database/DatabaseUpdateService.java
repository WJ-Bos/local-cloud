package wbos.backend.service.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.dto.resource.database.UpdateDatabaseRequestDto;
import wbos.backend.model.resource.database.Database;
import wbos.backend.repository.resource.database.DatabaseRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseUpdateService {

    private final DatabaseRepository databaseRepository;

    /**
     * Update an existing database instance
     *
     * Currently supports:
     * - Name changes (will trigger container recreation via Terraform)
     * - Port changes (will trigger container recreation via Terraform)
     *
     * @param requestDto The update request containing database name and new configuration
     * @return ResponseEntity with updated database details
     */
    public ResponseEntity<DatabaseResponseDto> update(UpdateDatabaseRequestDto requestDto) {
        log.info("Starting database update for: {}", requestDto.getName());

        // Find the database
        Optional<Database> databaseOpt = databaseRepository.findByName(requestDto.getName());
        if (databaseOpt.isEmpty()) {
            log.error("Database not found: {}", requestDto.getName());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Database database = databaseOpt.get();
        boolean hasChanges = false;
        StringBuilder changeLog = new StringBuilder();

        // Check if name is being updated
        if (requestDto.getNewName() != null && !requestDto.getNewName().equals(database.getName())) {
            log.info("Updating name for database '{}': '{}' -> '{}'",
                    database.getName(), database.getName(), requestDto.getNewName());
            changeLog.append(String.format("Name: '%s' -> '%s'; ", database.getName(), requestDto.getNewName()));
            database.setName(requestDto.getNewName());
            hasChanges = true;

            //TODO: Trigger Terraform apply to recreate container with new name
            // For Phase 1, we'll just update the database record
            // Future: Call Terraform service to apply changes
            // Note: This will require updating Terraform state and Docker container name
        }

        // Check if port is being updated
        if (requestDto.getPort() != null && !requestDto.getPort().equals(database.getPort())) {
            log.info("Updating port for database '{}': {} -> {}",
                    database.getName(), database.getPort(), requestDto.getPort());
            changeLog.append(String.format("Port: %d -> %d; ", database.getPort(), requestDto.getPort()));
            database.setPort(requestDto.getPort());
            hasChanges = true;

            // TODO: Trigger Terraform apply to recreate container with new port
            // For Phase 1, we'll just update the database record
            // Future: Call Terraform service to apply changes
        }

        if (!hasChanges) {
            log.info("No changes detected for database '{}' - all values are the same", database.getName());
            return ResponseEntity.status(HttpStatus.OK).body(mapToResponseDto(database));
        }

        // Save the updated database
        Database updatedDatabase = databaseRepository.save(database);
        log.info("Database '{}' updated successfully. Changes: {}", updatedDatabase.getName(), changeLog.toString());

        // TODO: Phase 1 - Trigger Terraform to apply the changes
        // This would recreate the container with the new configuration
        // For now, we just update the metadata

        return ResponseEntity.status(HttpStatus.OK).body(mapToResponseDto(updatedDatabase));
    }

    private DatabaseResponseDto mapToResponseDto(Database database) {
        return DatabaseResponseDto.builder()
                .id(database.getId())
                .name(database.getName())
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
