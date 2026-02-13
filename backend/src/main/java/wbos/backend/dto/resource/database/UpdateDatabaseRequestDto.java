package wbos.backend.dto.resource.database;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDatabaseRequestDto {

    @NotBlank(message = "Database name is required to identify which database to update")
    @Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "Database name must contain only lowercase letters, numbers, and hyphens"
    )
    private String name;

    @Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "New database name must contain only lowercase letters, numbers, and hyphens"
    )
    private String newName;

    @Min(value = 5433, message = "Port must be at least 5433 (5432 is reserved for platform database)")
    @Max(value = 65535, message = "Port must be less than 65536")
    private Integer port;

    @Min(value = 128, message = "Memory limit must be at least 128 MB")
    @Max(value = 2048, message = "Memory limit cannot exceed 2048 MB")
    private Integer memoryMb;
}
