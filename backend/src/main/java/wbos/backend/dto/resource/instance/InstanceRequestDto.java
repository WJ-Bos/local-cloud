package wbos.backend.dto.resource.instance;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import wbos.backend.enums.InstanceType;
import wbos.backend.enums.MachineImage;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class InstanceRequestDto {

    @NotBlank(message = "Instance name is required")
    @Pattern(
        regexp = "^[a-z0-9-]+$",
        message = "Instance name must contain only lowercase letters, numbers, and hyphens"
    )
    private String name;

    @NotNull(message = "Machine image is required")
    private MachineImage image;

    @NotNull(message = "Instance type is required")
    private InstanceType instanceType;

    @Min(value = 1024, message = "SSH port must be at least 1024")
    @Max(value = 65535, message = "SSH port must be less than 65536")
    private Integer sshPort;

    @Size(max = 16384, message = "User data cannot exceed 16 KB")
    private String userData;
}
