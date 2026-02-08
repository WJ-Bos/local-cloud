package wbos.backend.controllers.resource.database;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wbos.backend.dto.resource.database.CreateDataBaseRequestDto;
import wbos.backend.dto.resource.database.DatabaseResponseDto;
import wbos.backend.service.resource.database.DatabaseProvisionService;
import wbos.backend.service.utlis.validation.RequestValidationService;

@RestController
@RequestMapping("/databases")
@RequiredArgsConstructor
@Slf4j
public class DatabaseController {

    private final DatabaseProvisionService databaseProvisionService;
    private final RequestValidationService requestValidationService;

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
}
