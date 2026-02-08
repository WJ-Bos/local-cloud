package wbos.backend.service.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.model.resource.database.Database;
import wbos.backend.repository.resource.database.DatabaseRepository;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseDetailsService {

    private final DatabaseRepository databaseRepository;

    /**
     * Resync and fetch all active database instances
     *
     * Returns all databases that are not in DESTROYED status.
     * This allows the frontend to display current database state.
     *
     * @return ResponseEntity containing list of active databases
     */
    public ResponseEntity<List<DatabaseResponseDto>> resync() {
        log.info("Fetching all active database instances");

        List<Database> activeDatabases = databaseRepository.findAllActiveDatabase();

        log.info("Found {} active database instance(s)", activeDatabases.size());

        List<DatabaseResponseDto> responseDtos = activeDatabases.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.OK).body(responseDtos);
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
