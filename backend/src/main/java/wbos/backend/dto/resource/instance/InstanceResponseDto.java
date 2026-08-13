package wbos.backend.dto.resource.instance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import wbos.backend.enums.InstanceType;
import wbos.backend.enums.MachineImage;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstanceResponseDto {

    private Long id;
    private String name;
    private MachineImage image;
    private InstanceType instanceType;
    private Integer vcpus;
    private Integer memoryMb;
    private String containerId;
    private String status;
    private Integer sshPort;
    private String sshCommand;
    private String password;
    private String userData;
    private String terraformStatePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
