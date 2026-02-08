# Request Validation Service Usage Guide

## Overview

The `RequestValidationService` provides validation logic for all database operations. It uses a switch-based dispatcher pattern to route validation requests to operation-specific methods.

## Architecture

```
validateDbRequest(operation, dto)
        ↓
    [SWITCH]
        ↓
┌───────┴────────┬────────────┬─────────┐
│                │            │         │
CREATE         DELETE       UPDATE     GET
│                │            │         │
validateCreate  validateDelete validateUpdate validateGet
```

## Operation-Specific Validation Methods

### 1. CREATE Operation

**Method:** `validateCreateRequest(CreateDataBaseRequestDto requestDto)`

**Validations:**
- ✅ DTO is not null
- ✅ Database name is provided
- ✅ Name format: lowercase, alphanumeric, hyphens only (`^[a-z0-9-]+$`)
- ✅ Name is unique (doesn't already exist)
- ✅ Port range: 5433-65535 (if provided)
- ✅ Port is not in use by RUNNING/PROVISIONING database

**Usage Example:**
```java
@PostMapping
public ResponseEntity<DatabaseResponseDto> createDatabase(
        @Valid @RequestBody CreateDataBaseRequestDto requestDto) {

    // Validate using CREATE operation
    if (!validationService.validateCreateRequest(requestDto)) {
        return ResponseEntity.badRequest().build();
    }

    return databaseService.create(requestDto);
}
```

**Validation Flow:**
```
Request → validateCreateRequest
    ↓
Check DTO not null
    ↓
Check name present & valid format
    ↓
Check name doesn't exist
    ↓
Check port range (if provided)
    ↓
Check port not in use (if provided)
    ↓
Return true/false
```

---

### 2. DELETE Operation

**Method:** `validateDeleteRequest(UUID databaseId)`

**Validations:**
- ✅ Database ID is not null
- ✅ Database exists
- ✅ Database is not already DESTROYING
- ✅ Database is not already DESTROYED
- ✅ Database is in deletable state (PROVISIONING, RUNNING, or FAILED)

**Usage Example:**
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteDatabase(@PathVariable UUID id) {

    // Validate using DELETE operation
    if (!validationService.validateDeleteRequest(id)) {
        return ResponseEntity.badRequest().build();
    }

    return databaseService.delete(id);
}
```

**Valid States for Deletion:**
| Status | Can Delete? | Reason |
|--------|-------------|--------|
| PROVISIONING | ✅ Yes | Resource being created, safe to cancel |
| RUNNING | ✅ Yes | Active resource, can be terminated |
| FAILED | ✅ Yes | Failed resource, can be cleaned up |
| DESTROYING | ❌ No | Already being deleted |
| DESTROYED | ❌ No | Already deleted |

**Validation Flow:**
```
Request → validateDeleteRequest
    ↓
Check ID not null
    ↓
Check database exists
    ↓
Check not DESTROYING
    ↓
Check not DESTROYED
    ↓
Check in valid state (PROVISIONING/RUNNING/FAILED)
    ↓
Return true/false
```

---

### 3. UPDATE Operation

**Method:** `validateUpdateRequest(UUID databaseId, Object updateDto)`

**Status:** 🚧 Reserved for Future Implementation

**Planned Validations:**
- Database exists
- Database is in RUNNING state
- Update parameters are valid
- No resource conflicts
- Terraform state is consistent

**Usage Example (Future):**
```java
@PutMapping("/{id}")
public ResponseEntity<DatabaseResponseDto> updateDatabase(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateDatabaseDto updateDto) {

    // Validate using UPDATE operation
    if (!validationService.validateUpdateRequest(id, updateDto)) {
        return ResponseEntity.badRequest().build();
    }

    return databaseService.update(id, updateDto);
}
```

**Future Implementation Notes:**
```java
/**
 * TODO: Phase 2 - Implement when Terraform integration is complete
 *
 * Update operations will allow:
 * - Modifying database configuration
 * - Scaling resources (CPU, memory)
 * - Changing connection settings
 * - Updating security parameters
 *
 * Terraform will handle:
 * - Generating updated .tf files
 * - Executing `terraform plan` to preview changes
 * - Executing `terraform apply` to apply changes
 * - Rolling back on failure
 */
```

---

### 4. GET Operation

**Method:** `validateGetRequest(UUID databaseId)`

**Validations:**
- ✅ If getting all: No validation needed
- ✅ If getting specific: Database exists

**Usage Example:**
```java
@GetMapping
public ResponseEntity<List<DatabaseResponseDto>> getAllDatabases() {
    // No validation needed for GET all
    return databaseService.findAll();
}

@GetMapping("/{id}")
public ResponseEntity<DatabaseResponseDto> getDatabase(@PathVariable UUID id) {

    // Validate database exists
    if (!validationService.validateGetRequest(id)) {
        return ResponseEntity.notFound().build();
    }

    return databaseService.findById(id);
}
```

---

## Switch-Based Dispatcher

The main dispatcher method uses a switch statement to route to appropriate validators:

```java
public boolean validateDbRequest(String operation, CreateDataBaseRequestDto requestDto) {
    return switch (operation.toUpperCase()) {
        case "CREATE" -> validateCreateRequest(requestDto);
        case "DELETE" -> {
            log.warn("DELETE validation should use validateDeleteRequest(UUID)");
            yield false;
        }
        case "UPDATE" -> {
            log.warn("UPDATE validation should use validateUpdateRequest(UUID, UpdateDto)");
            yield false;
        }
        case "GET" -> {
            log.info("GET operation requires no validation");
            yield true;
        }
        default -> {
            log.error("Unknown operation type: {}", operation);
            yield false;
        }
    };
}
```

**⚠️ Important:**
- For CREATE operations: Use dispatcher or direct `validateCreateRequest()`
- For DELETE operations: Use direct `validateDeleteRequest(UUID)`
- For UPDATE operations: Use direct `validateUpdateRequest(UUID, updateDto)` (when implemented)
- For GET operations: Use direct `validateGetRequest(UUID)` or no validation

---

## Error Handling

All validation methods follow these patterns:

**On Success:**
```java
log.info("Validation successful for database: '{}'", databaseName);
return true;
```

**On Failure:**
```java
log.error("Validation failed: {}", reason);
return false;
```

**In Controller:**
```java
if (!validationService.validateXXX(...)) {
    log.warn("Validation failed for {} operation", operation);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
}
```

---

## Complete Controller Example

```java
@RestController
@RequestMapping("/databases")
@RequiredArgsConstructor
@Slf4j
public class DatabaseController {

    private final DatabaseProvisionService databaseService;
    private final RequestValidationService validationService;

    // CREATE
    @PostMapping
    public ResponseEntity<DatabaseResponseDto> createDatabase(
            @Valid @RequestBody CreateDataBaseRequestDto requestDto) {

        if (!validationService.validateCreateRequest(requestDto)) {
            return ResponseEntity.badRequest().build();
        }

        return databaseService.provision(requestDto);
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<DatabaseResponseDto>> getAllDatabases() {
        return databaseService.findAll();
    }

    // GET ONE
    @GetMapping("/{id}")
    public ResponseEntity<DatabaseResponseDto> getDatabase(@PathVariable UUID id) {

        if (!validationService.validateGetRequest(id)) {
            return ResponseEntity.notFound().build();
        }

        return databaseService.findById(id);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDatabase(@PathVariable UUID id) {

        if (!validationService.validateDeleteRequest(id)) {
            return ResponseEntity.badRequest().build();
        }

        return databaseService.delete(id);
    }

    // UPDATE (Future)
    @PutMapping("/{id}")
    public ResponseEntity<DatabaseResponseDto> updateDatabase(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDatabaseDto updateDto) {

        if (!validationService.validateUpdateRequest(id, updateDto)) {
            return ResponseEntity.badRequest().build();
        }

        return databaseService.update(id, updateDto);
    }
}
```

---

## Testing

### Unit Test Examples

```java
@SpringBootTest
class RequestValidationServiceTest {

    @Autowired
    private RequestValidationService validationService;

    @Test
    void testCreateValidation_Success() {
        CreateDataBaseRequestDto dto = CreateDataBaseRequestDto.builder()
            .name("test-db")
            .port(5433)
            .build();

        assertTrue(validationService.validateCreateRequest(dto));
    }

    @Test
    void testCreateValidation_DuplicateName() {
        // Create first database
        // ...

        CreateDataBaseRequestDto dto = CreateDataBaseRequestDto.builder()
            .name("existing-db")
            .build();

        assertFalse(validationService.validateCreateRequest(dto));
    }

    @Test
    void testDeleteValidation_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        assertFalse(validationService.validateDeleteRequest(nonExistentId));
    }
}
```

---

## Logging

All validation methods include comprehensive logging:

**Info Level:**
- Validation start
- Validation success

**Error Level:**
- Validation failures with reason
- Invalid states
- Missing resources

**Warn Level:**
- Deprecated method usage
- Unimplemented operations

**Example Logs:**
```
INFO  - Validating CREATE request for database: test-db
INFO  - CREATE validation successful for database: 'test-db' on port: auto-assign

ERROR - Database with name 'test-db' already exists
ERROR - Port 5433 is already in use by another database

WARN  - UPDATE operation is not yet implemented
```

---

## Best Practices

1. **Always validate before operations:** Call validation before any database modification
2. **Use operation-specific methods:** Prefer `validateCreateRequest()` over dispatcher for CREATE
3. **Handle validation failures:** Return appropriate HTTP status codes
4. **Log validation results:** Use provided logging for traceability
5. **Keep validation pure:** Validation methods should not modify state

---

## Future Enhancements

### Phase 2: UPDATE Operation
- Implement `validateUpdateRequest()` method
- Add Terraform plan validation
- Resource scaling validation
- Configuration change validation

### Phase 3: Advanced Validation
- Resource quota validation
- User permission validation
- Network isolation validation
- Backup/restore validation

---

## Summary

| Operation | Method | Parameters | Status |
|-----------|--------|------------|--------|
| CREATE | `validateCreateRequest()` | `CreateDataBaseRequestDto` | ✅ Implemented |
| DELETE | `validateDeleteRequest()` | `UUID` | ✅ Implemented |
| UPDATE | `validateUpdateRequest()` | `UUID, UpdateDto` | 🚧 Future |
| GET | `validateGetRequest()` | `UUID` (optional) | ✅ Implemented |

All validation methods return `boolean`:
- `true` = Validation passed
- `false` = Validation failed (check logs for reason)
