package wbos.backend.service.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wbos.backend.dto.resource.database.CreateDataBaseRequestDto;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.model.resource.database.Database;
import wbos.backend.repository.resource.database.DatabaseRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseProvisionService {

    private final DatabaseRepository databaseRepository;

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
                    : findNextAvailablePort();

            log.info("Assigned port {} to database {} (user-provided: {})",
                    assignedPort,
                    requestDto.getName(),
                    requestDto.getPort() != null);

            // Create database entity with PROVISIONING status
            Database database = Database.builder()
                    .name(requestDto.getName())
                    .status(Database.DatabaseStatus.PROVISIONING)
                    .port(assignedPort)
                    .terraformStatePath(String.format("/tmp/terraform/%s", requestDto.getName()))
                    .build();

            // Save to database
            database = databaseRepository.save(database);
            log.info("Database metadata saved with ID: {}", database.getId());

            // TODO: In Phase 1, implement Terraform execution here
            // 1. Generate Terraform configuration files
            // 2. Execute `terraform apply`
            // 3. Capture outputs (connection string)
            // 4. Update database status to RUNNING

            // Convert to DTO
            DatabaseResponseDto responseDto = convertToDto(database);

            log.info("Database provisioning initiated successfully: {}", database.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);

        } catch (Exception e) {
            log.error("Failed to provision database: {}", requestDto.getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Finds the next available port for a new database
     * Starts from 5433 (5432 is reserved for platform DB)
     *
     * @return Next available port number
     */
    private Integer findNextAvailablePort() {
        Integer maxPort = databaseRepository.findMaxPort();
        return (maxPort == null || maxPort == 5432) ? 5433 : maxPort + 1;
    }

    /**
     * Converts Database entity to DatabaseResponseDto
     *
     * @param database The database entity
     * @return DatabaseResponseDto
     */
    private DatabaseResponseDto convertToDto(Database database) {
        return DatabaseResponseDto.builder()
                .id(database.getId())
                .name(database.getName())
                .status(database.getStatus().name())
                .port(database.getPort())
                .connectionString(database.getConnectionString())
                .terraformStatePath(database.getTerraformStatePath())
                .createdAt(database.getCreatedAt())
                .updatedAt(database.getUpdatedAt())
                .build();
    }
}
