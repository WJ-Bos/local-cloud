package wbos.backend.controllers.resource.database;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wbos.backend.dto.resource.database.CreateDataBaseRequestDto;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.dto.resource.database.UpdateDatabaseRequestDto;
import wbos.backend.service.resource.database.DatabaseDetailsService;
import wbos.backend.service.resource.database.DatabaseProvisionService;
import wbos.backend.service.resource.database.DatabaseUpdateService;
import wbos.backend.service.utlis.validation.RequestValidationService;

import java.util.List;

@RestController
@RequestMapping("/databases")
@RequiredArgsConstructor
@Slf4j
public class DatabaseController {

    private final DatabaseProvisionService databaseProvisionService;
    private final RequestValidationService requestValidationService;
    private final DatabaseDetailsService databaseDetailsService;
    private final DatabaseUpdateService databaseUpdateService;

    /**
     * Creates a new PostgreSQL database instance
     *
     * @param dataBaseRequestDto The database creation request
     * @return ResponseEntity with created database details
     */
    @PostMapping
    public ResponseEntity<DatabaseResponseDto> provisionDatabase(
            @Valid @RequestBody CreateDataBaseRequestDto dataBaseRequestDto) {

        log.info("Received database creation request: {}", dataBaseRequestDto.getName());

        if (!requestValidationService.validateDbRequest("CREATE", dataBaseRequestDto)) {
            log.warn("Validation failed for database: {}", dataBaseRequestDto.getName());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return databaseProvisionService.provision(dataBaseRequestDto);
    }

    @GetMapping
    public ResponseEntity<List<DatabaseResponseDto>> resyncResources(){
        log.info("Resyncing and Refetching All Database instances");
        return databaseDetailsService.resync();
    }


    /**
     * Updates an existing database instance
     *
     * Currently supports:
     * - Name changes (via newName field in request body)
     * - Port changes (via port field in request body)
     *
     * The name in the path must match the name in the request body.
     * Use newName field to rename the database.
     *
     * @param name The current name of the database to update (from path)
     * @param updateRequestDto The update request containing newName and/or port
     * @return ResponseEntity with updated database details
     */
    @PutMapping("/{name}")
    public ResponseEntity<DatabaseResponseDto> updateDatabase(
            @PathVariable String name,
            @Valid @RequestBody UpdateDatabaseRequestDto updateRequestDto) {

        log.info("Received update request for database: {} (newName: {}, port: {})",
                name, updateRequestDto.getNewName(), updateRequestDto.getPort());

        // Ensure the name in the path matches the name in the request body
        if (!name.equals(updateRequestDto.getName())) {
            log.error("Path name '{}' does not match request body name '{}'", name, updateRequestDto.getName());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // Validate the update request
        if (!requestValidationService.validateDbRequest("UPDATE", updateRequestDto)) {
            log.warn("Validation failed for database update: {}", name);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return databaseUpdateService.update(updateRequestDto);
    }
}
