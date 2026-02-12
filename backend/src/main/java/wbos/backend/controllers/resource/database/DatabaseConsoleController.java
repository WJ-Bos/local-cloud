package wbos.backend.controllers.resource.database;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wbos.backend.dto.resource.database.ConsoleLogsResponse;
import wbos.backend.service.resource.database.DatabaseConsoleService;

@RestController
@RequestMapping("/databases")
@RequiredArgsConstructor
@Slf4j
public class DatabaseConsoleController {

    private final DatabaseConsoleService databaseConsoleService;

    @GetMapping("/{id}/logs")
    public ResponseEntity<ConsoleLogsResponse> getLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "100") int tail,
            @RequestParam(required = false) String filter) {

        log.info("Console logs: id={}, tail={}, filter={}", id, tail, filter);
        return ResponseEntity.ok(databaseConsoleService.getLogs(id, tail, filter));
    }

    @GetMapping(value = "/{id}/inspect", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getInspect(@PathVariable Long id) {
        log.info("Console inspect: id={}", id);
        return ResponseEntity.ok(databaseConsoleService.getInspect(id));
    }
}
