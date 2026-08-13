package wbos.backend.service.resource.instance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wbos.backend.dto.resource.instance.CreateInstanceRequestDto;
import wbos.backend.dto.resource.instance.InstanceResponseDto;
import wbos.backend.enums.InstanceStatus;
import wbos.backend.enums.InstanceType;
import wbos.backend.enums.MachineImage;
import wbos.backend.model.resource.instance.Instance;
import wbos.backend.records.TerraformResult;
import wbos.backend.repository.resource.instance.InstanceRepository;
import wbos.backend.service.infrastructure.InstanceConfigProvider;
import wbos.backend.service.infrastructure.TerraformService;
import wbos.backend.service.security.PasswordEncryptionService;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstanceProvisionService {

    private final InstanceRepository instanceRepository;
    private final TerraformService terraformService;
    private final PasswordEncryptionService passwordEncryptionService;
    private final InstanceConfigProvider instanceConfigProvider;

    /**
     * Launches a new compute instance
     *
     * @param requestDto The instance launch request
     * @return ResponseEntity with instance details
     */
    @Transactional
    public ResponseEntity<InstanceResponseDto> launch(CreateInstanceRequestDto requestDto) {
        log.info("Starting instance launch for: {}", requestDto.getName());

        try {
            Integer assignedPort = requestDto.getSshPort() != null
                    ? requestDto.getSshPort()
                    : findNextAvailablePort();

            log.info("Assigned SSH port {} to instance {} (user-provided: {})",
                    assignedPort,
                    requestDto.getName(),
                    requestDto.getSshPort() != null);

            Instance instance = Instance.builder()
                    .name(requestDto.getName())
                    .image(requestDto.getImage())
                    .instanceType(requestDto.getInstanceType())
                    .userData(requestDto.getUserData())
                    .status(InstanceStatus.PENDING)
                    .sshPort(assignedPort)
                    .terraformStatePath(String.format("/tmp/terraform/instances/%s", requestDto.getName()))
                    .build();

            Instance savedInstance = instanceRepository.save(instance);
            log.info("Instance metadata saved with ID: {}", savedInstance.getId());

            InstanceResponseDto responseDto = convertToDto(savedInstance);

            final Long instanceId = savedInstance.getId();
            final String instanceName = savedInstance.getName();
            final MachineImage image = savedInstance.getImage();
            final InstanceType instanceType = savedInstance.getInstanceType();
            final Integer sshPort = savedInstance.getSshPort();
            final String userData = savedInstance.getUserData();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting async Terraform provisioning for instance: {} (image: {}, type: {})",
                            instanceName, image, instanceType.getApiName());

                    // Execute Terraform
                    TerraformResult result = terraformService.provisionInstance(
                            instanceName,
                            image,
                            instanceType,
                            sshPort,
                            userData
                    );

                    Instance inst = instanceRepository.findById(instanceId).orElse(null);
                    if (inst == null) {
                        log.error("Instance not found: {}", instanceId);
                        return;
                    }

                    if (result.success()) {
                        inst.setSshCommand(result.connectionString());
                        inst.setContainerId(result.containerId());
                        inst.setStatus(InstanceStatus.RUNNING);

                        String encryptedPassword = passwordEncryptionService.encrypt(result.password());
                        inst.setEncryptedPassword(encryptedPassword);

                        inst.setTerraformStatePath(
                                result.workingDirectory() != null
                                        ? result.workingDirectory().toString()
                                        : inst.getTerraformStatePath()
                        );

                        instanceRepository.save(inst);
                        log.info("Instance launched successfully: {} (container: {})",
                                inst.getName(),
                                result.containerId());

                    } else {
                        inst.setStatus(InstanceStatus.FAILED);
                        instanceRepository.save(inst);
                        log.error("Instance launch failed: {} - {}",
                                inst.getName(),
                                result.errorMessage());
                    }

                } catch (Exception e) {
                    log.error("Exception during instance launch: {}", instanceName, e);
                    instanceRepository.findById(instanceId).ifPresent(inst -> {
                        inst.setStatus(InstanceStatus.FAILED);
                        instanceRepository.save(inst);
                    });
                }
            });

            log.info("Instance launch initiated successfully: {}", instance.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);

        } catch (Exception e) {
            log.error("Failed to launch instance: {}", requestDto.getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Finds the next available SSH port for a new instance
     *
     * @return Next available port number
     */
    private Integer findNextAvailablePort() {
        Integer defaultPort = instanceConfigProvider.getDefaultStartPort();
        Integer maxPort = instanceRepository.findMaxSshPort();

        // If no instances exist, use the default port
        if (maxPort == null) {
            return defaultPort;
        }

        // If max port is less than default, use default
        if (maxPort < defaultPort) {
            return defaultPort;
        }

        // Otherwise, increment from max port
        return maxPort + 1;
    }

    /**
     * Converts Instance entity to InstanceResponseDto
     *
     * @param instance The instance entity
     * @return InstanceResponseDto
     */
    private InstanceResponseDto convertToDto(Instance instance) {
        // Decrypt password if present
        String decryptedPassword = null;
        if (instance.getEncryptedPassword() != null) {
            try {
                decryptedPassword = passwordEncryptionService.decrypt(instance.getEncryptedPassword());
            } catch (Exception e) {
                log.warn("Failed to decrypt password for instance: {}", instance.getId());
            }
        }

        return InstanceResponseDto.builder()
                .id(instance.getId())
                .name(instance.getName())
                .image(instance.getImage())
                .instanceType(instance.getInstanceType())
                .vcpus(instance.getInstanceType().getVcpus())
                .memoryMb(instance.getInstanceType().getMemoryMb())
                .containerId(instance.getContainerId())
                .status(instance.getStatus().name())
                .sshPort(instance.getSshPort())
                .sshCommand(instance.getSshCommand())
                .password(decryptedPassword)
                .userData(instance.getUserData())
                .terraformStatePath(instance.getTerraformStatePath())
                .createdAt(instance.getCreatedAt())
                .updatedAt(instance.getUpdatedAt())
                .build();
    }
}
