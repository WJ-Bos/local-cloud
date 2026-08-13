package wbos.backend.service.resource.instance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.instance.InstanceResponseDto;
import wbos.backend.dto.resource.instance.UpdateInstanceRequestDto;
import wbos.backend.enums.InstanceStatus;
import wbos.backend.enums.InstanceType;
import wbos.backend.enums.MachineImage;
import wbos.backend.model.resource.instance.Instance;
import wbos.backend.records.TerraformResult;
import wbos.backend.repository.resource.instance.InstanceRepository;
import wbos.backend.service.infrastructure.TerraformService;
import wbos.backend.service.security.PasswordEncryptionService;

import java.nio.file.Paths;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstanceUpdateService {

    private final InstanceRepository instanceRepository;
    private final TerraformService terraformService;
    private final PasswordEncryptionService passwordEncryptionService;

    /**
     * Update an existing compute instance
     *
     * The instance MUST be in STOPPED status to be updated.
     *
     * @param requestDto The update request containing instance name and new configuration
     * @return ResponseEntity with updated instance details
     */
    public ResponseEntity<InstanceResponseDto> update(UpdateInstanceRequestDto requestDto) {
        log.info("Starting instance update for: {}", requestDto.getName());

        // Find the instance
        Optional<Instance> instanceOpt = instanceRepository.findByName(requestDto.getName());
        if (instanceOpt.isEmpty()) {
            log.error("Instance not found: {}", requestDto.getName());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Instance instance = instanceOpt.get();

        // Verify instance is STOPPED
        if (instance.getStatus() != InstanceStatus.STOPPED) {
            log.error("Instance {} is not stopped (status: {}). Cannot update.",
                    instance.getName(), instance.getStatus());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(InstanceResponseDto.builder()
                            .id(instance.getId())
                            .name(instance.getName())
                            .status(instance.getStatus().name())
                            .build());
        }

        String newName = requestDto.getNewName() != null ? requestDto.getNewName() : instance.getName();
        Integer newSshPort = requestDto.getSshPort() != null ? requestDto.getSshPort() : instance.getSshPort();
        InstanceType newInstanceType = requestDto.getInstanceType() != null
                ? requestDto.getInstanceType()
                : instance.getInstanceType();

        boolean hasNameChanged = !newName.equals(instance.getName());
        boolean hasPortChanged = !newSshPort.equals(instance.getSshPort());
        boolean hasTypeChanged = newInstanceType != instance.getInstanceType();

        if (!hasNameChanged && !hasPortChanged && !hasTypeChanged) {
            log.info("No changes detected for instance '{}' - all values are the same", instance.getName());
            return ResponseEntity.status(HttpStatus.OK).body(mapToResponseDto(instance));
        }

        StringBuilder changeLog = new StringBuilder();
        if (hasNameChanged) {
            changeLog.append(String.format("Name: '%s' -> '%s'; ", instance.getName(), newName));
        }
        if (hasPortChanged) {
            changeLog.append(String.format("SSH Port: %d -> %d; ", instance.getSshPort(), newSshPort));
        }
        if (hasTypeChanged) {
            changeLog.append(String.format("Type: %s -> %s; ",
                    instance.getInstanceType().getApiName(), newInstanceType.getApiName()));
        }

        log.info("Updating instance '{}': {}", instance.getName(), changeLog);

        instance.setStatus(InstanceStatus.UPDATING);
        Instance updatingInstance = instanceRepository.save(instance);

        InstanceResponseDto responseDto = mapToResponseDto(updatingInstance);

        // Execute Terraform update asynchronously
        final Long instId = updatingInstance.getId();
        final String oldName = updatingInstance.getName();
        final MachineImage image = updatingInstance.getImage();
        final String finalNewName = newName;
        final Integer finalNewSshPort = newSshPort;
        final InstanceType finalNewInstanceType = newInstanceType;
        final String userData = updatingInstance.getUserData();
        final String oldTerraformPath = updatingInstance.getTerraformStatePath();

        CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting async Terraform update for instance: {} -> {} (image: {})",
                        oldName, finalNewName, image);

                // Decrypt existing password to preserve it
                String existingPassword = null;
                try {
                    if (updatingInstance.getEncryptedPassword() != null) {
                        existingPassword = passwordEncryptionService.decrypt(
                                updatingInstance.getEncryptedPassword());
                        log.info("Retrieved existing password for instance: {}", oldName);
                    }
                } catch (Exception e) {
                    log.error("Failed to decrypt existing password for instance: {}", oldName, e);
                    // If we can't get the password, we can't update
                    Instance inst = instanceRepository.findById(instId).orElse(null);
                    if (inst != null) {
                        inst.setStatus(InstanceStatus.FAILED);
                        instanceRepository.save(inst);
                    }
                    return;
                }

                // Execute Terraform update
                TerraformResult result = terraformService.updateInstance(
                        oldName,
                        finalNewName,
                        image,
                        finalNewInstanceType,
                        finalNewSshPort,
                        existingPassword,
                        Paths.get(oldTerraformPath),
                        userData
                );

                Instance inst = instanceRepository.findById(instId).orElse(null);
                if (inst == null) {
                    log.error("Instance not found: {}", instId);
                    return;
                }

                if (result.success()) {
                    // Update instance with new configuration
                    inst.setName(finalNewName);
                    inst.setSshPort(finalNewSshPort);
                    inst.setInstanceType(finalNewInstanceType);
                    inst.setSshCommand(result.connectionString());
                    inst.setContainerId(result.containerId());
                    inst.setStatus(InstanceStatus.RUNNING);
                    inst.setTerraformStatePath(
                            result.workingDirectory() != null
                                    ? result.workingDirectory().toString()
                                    : String.format("/tmp/terraform/instances/%s", finalNewName)
                    );

                    // Password remains the same (already encrypted in database)

                    instanceRepository.save(inst);
                    log.info("Instance updated successfully: {} -> {} (container: {})",
                            oldName,
                            finalNewName,
                            result.containerId());

                } else {
                    inst.setStatus(InstanceStatus.FAILED);
                    instanceRepository.save(inst);
                    log.error("Instance update failed: {} -> {} - {}",
                            oldName,
                            finalNewName,
                            result.errorMessage());
                }

            } catch (Exception e) {
                log.error("Exception during instance update: {} -> {}", oldName, finalNewName, e);
                instanceRepository.findById(instId).ifPresent(inst -> {
                    inst.setStatus(InstanceStatus.FAILED);
                    instanceRepository.save(inst);
                });
            }
        });

        log.info("Instance update initiated successfully: {} -> {}", oldName, finalNewName);
        return ResponseEntity.status(HttpStatus.OK).body(responseDto);
    }

    private InstanceResponseDto mapToResponseDto(Instance instance) {
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
