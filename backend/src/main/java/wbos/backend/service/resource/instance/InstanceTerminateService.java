package wbos.backend.service.resource.instance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wbos.backend.dto.resource.instance.InstanceResponseDto;
import wbos.backend.enums.InstanceStatus;
import wbos.backend.model.resource.instance.Instance;
import wbos.backend.repository.resource.instance.InstanceRepository;
import wbos.backend.service.infrastructure.TerraformService;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstanceTerminateService {

    private final InstanceRepository instanceRepository;
    private final TerraformService terraformService;

    /**
     * Terminates a compute instance (the EC2 terminate equivalent)
     *
     * @param instanceId The ID of the instance to terminate
     * @return ResponseEntity with termination status
     */
    @Transactional
    public ResponseEntity<InstanceResponseDto> terminate(Long instanceId) {
        log.info("Starting instance termination for ID: {}", instanceId);

        try {
            // Find instance
            Instance instance = instanceRepository.findById(instanceId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Instance not found: " + instanceId));

            // Update status to TERMINATING
            instance.setStatus(InstanceStatus.TERMINATING);
            instance = instanceRepository.save(instance);

            log.info("Instance marked as TERMINATING: {}", instance.getName());

            // Convert to DTO for immediate response
            InstanceResponseDto responseDto = convertToDto(instance);

            // Execute Terraform destroy asynchronously
            final Long instId = instance.getId();
            final String instanceName = instance.getName();
            final String terraformPath = instance.getTerraformStatePath();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Starting async Terraform destroy for instance: {}", instanceName);

                    // Get Terraform working directory
                    Path workingDir = Paths.get(terraformPath);

                    // Execute Terraform destroy
                    boolean success = terraformService.destroyInstance(workingDir);

                    // Fetch instance from repository
                    Instance inst = instanceRepository.findById(instId).orElse(null);
                    if (inst == null) {
                        log.error("Instance not found: {}", instId);
                        return;
                    }

                    if (success) {
                        // Mark as terminated
                        inst.setStatus(InstanceStatus.TERMINATED);
                        instanceRepository.save(inst);
                        log.info("Instance terminated successfully: {}", inst.getName());

                    } else {
                        // Mark as failed (but keep in DB for troubleshooting)
                        inst.setStatus(InstanceStatus.FAILED);
                        instanceRepository.save(inst);
                        log.error("Instance termination failed: {}", inst.getName());
                    }

                } catch (Exception e) {
                    log.error("Exception during instance termination: {}", instanceName, e);
                    instanceRepository.findById(instId).ifPresent(inst -> {
                        inst.setStatus(InstanceStatus.FAILED);
                        instanceRepository.save(inst);
                    });
                }
            });

            log.info("Instance termination initiated successfully: {}", instance.getName());
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(responseDto);

        } catch (IllegalArgumentException e) {
            log.error("Instance not found: {}", instanceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        } catch (Exception e) {
            log.error("Failed to initiate instance termination: {}", instanceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Converts Instance entity to InstanceResponseDto
     */
    private InstanceResponseDto convertToDto(Instance instance) {
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
                .terraformStatePath(instance.getTerraformStatePath())
                .createdAt(instance.getCreatedAt())
                .updatedAt(instance.getUpdatedAt())
                .build();
    }
}
