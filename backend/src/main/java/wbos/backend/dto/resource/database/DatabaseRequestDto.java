package wbos.backend.dto.resource.database;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import wbos.backend.enums.DatabaseType;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class DatabaseRequestDto {

    @NotBlank(message = "Database name is required")
    @Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "Database name must contain only lowercase letters, numbers, and hyphens"
    )
    private String name;

    @NotNull(message = "Database type is required")
    private DatabaseType type;

    @Min(value = 1024, message = "Port must be at least 1024")
    @Max(value = 65535, message = "Port must be less than 65536")
    private Integer port;

    @Pattern(
        regexp = "^[0-9][0-9a-zA-Z.-]*$",
        message = "Version must be a valid tag (e.g. 15, 8.0, 7.2)"
    )
    private String version;

    @Min(value = 128, message = "Memory limit must be at least 128 MB")
    @Max(value = 2048, message = "Memory limit cannot exceed 2048 MB")
    private Integer memoryMb;
}
