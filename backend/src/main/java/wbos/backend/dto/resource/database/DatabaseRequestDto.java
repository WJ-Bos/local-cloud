package wbos.backend.dto.resource.database;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

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

    @Min(value = 5433, message = "Port must be at least 5433 (5432 is reserved for platform database)")
    @Max(value = 65535, message = "Port must be less than 65536")
    private Integer port;
}
