package wbos.backend.dto.resource.instance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import wbos.backend.enums.InstanceType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInstanceRequestDto {

    @NotBlank(message = "Instance name is required to identify which instance to update")
    @Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "Instance name must contain only lowercase letters, numbers, and hyphens"
    )
    private String name;

    @Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "New instance name must contain only lowercase letters, numbers, and hyphens"
    )
    private String newName;

    @Min(value = 1024, message = "SSH port must be at least 1024")
    @Max(value = 65535, message = "SSH port must be less than 65536")
    private Integer sshPort;

    private InstanceType instanceType;
}
