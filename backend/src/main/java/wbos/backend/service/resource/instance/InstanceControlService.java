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
import wbos.backend.service.security.PasswordEncryptionService;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstanceControlService {

    private final InstanceRepository instanceRepository;
    private final PasswordEncryptionService passwordEncryptionService;

    /**
     * Stops a running instance container
     */
    @Transactional
    public ResponseEntity<InstanceResponseDto> stopInstance(Long instanceId) {
        log.info("Stopping instance with ID: {}", instanceId);

        try {
            Instance instance = instanceRepository.findById(instanceId)
                    .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + instanceId));

            if (instance.getStatus() != InstanceStatus.RUNNING) {
                log.warn("Instance {} is not in RUNNING state (current: {})",
                    instance.getName(), instance.getStatus());
                return ResponseEntity.badRequest().build();
            }

            if (instance.getContainerId() == null) {
                log.error("Instance {} has no container ID", instance.getName());
                return ResponseEntity.badRequest().build();
            }

            // Update status to STOPPING
            instance.setStatus(InstanceStatus.STOPPING);
            instance = instanceRepository.save(instance);

            InstanceResponseDto responseDto = convertToDto(instance);

            // Execute docker stop asynchronously
            final Long instId = instance.getId();
            final String containerId = instance.getContainerId();
            final String instanceName = instance.getName();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Executing docker stop for container: {}", containerId);
                    boolean success = executeDockerCommand("stop", containerId);

                    Instance inst = instanceRepository.findById(instId).orElse(null);
                    if (inst == null) {
                        log.error("Instance not found: {}", instId);
                        return;
                    }

                    if (success) {
                        inst.setStatus(InstanceStatus.STOPPED);
                        instanceRepository.save(inst);
                        log.info("Instance stopped successfully: {}", instanceName);
                    } else {
                        inst.setStatus(InstanceStatus.RUNNING);
                        instanceRepository.save(inst);
                        log.error("Failed to stop instance: {}", instanceName);
                    }
                } catch (Exception e) {
                    log.error("Exception during instance stop: {}", instanceName, e);
                    instanceRepository.findById(instId).ifPresent(inst -> {
                        inst.setStatus(InstanceStatus.RUNNING);
                        instanceRepository.save(inst);
                    });
                }
            });

            return ResponseEntity.ok(responseDto);

        } catch (IllegalArgumentException e) {
            log.error("Instance not found: {}", instanceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Failed to stop instance: {}", instanceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Starts a stopped instance container
     */
    @Transactional
    public ResponseEntity<InstanceResponseDto> startInstance(Long instanceId) {
        log.info("Starting instance with ID: {}", instanceId);

        try {
            Instance instance = instanceRepository.findById(instanceId)
                    .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + instanceId));

            if (instance.getStatus() != InstanceStatus.STOPPED) {
                log.warn("Instance {} is not in STOPPED state (current: {})",
                    instance.getName(), instance.getStatus());
                return ResponseEntity.badRequest().build();
            }

            if (instance.getContainerId() == null) {
                log.error("Instance {} has no container ID", instance.getName());
                return ResponseEntity.badRequest().build();
            }

            // Update status to STARTING
            instance.setStatus(InstanceStatus.STARTING);
            instance = instanceRepository.save(instance);

            InstanceResponseDto responseDto = convertToDto(instance);

            // Execute docker start asynchronously
            final Long instId = instance.getId();
            final String containerId = instance.getContainerId();
            final String instanceName = instance.getName();

            CompletableFuture.runAsync(() -> {
                try {
                    log.info("Executing docker start for container: {}", containerId);
                    boolean success = executeDockerCommand("start", containerId);

                    Instance inst = instanceRepository.findById(instId).orElse(null);
                    if (inst == null) {
                        log.error("Instance not found: {}", instId);
                        return;
                    }

                    if (success) {
                        inst.setStatus(InstanceStatus.RUNNING);
                        instanceRepository.save(inst);
                        log.info("Instance started successfully: {}", instanceName);
                    } else {
                        inst.setStatus(InstanceStatus.STOPPED);
                        instanceRepository.save(inst);
                        log.error("Failed to start instance: {}", instanceName);
                    }
                } catch (Exception e) {
                    log.error("Exception during instance start: {}", instanceName, e);
                    instanceRepository.findById(instId).ifPresent(inst -> {
                        inst.setStatus(InstanceStatus.STOPPED);
                        instanceRepository.save(inst);
                    });
                }
            });

            return ResponseEntity.ok(responseDto);

        } catch (IllegalArgumentException e) {
            log.error("Instance not found: {}", instanceId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Failed to start instance: {}", instanceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Executes a docker command
     */
    private boolean executeDockerCommand(String command, String containerId) {
        try {
            ProcessBuilder pb = new ProcessBuilder("docker", command, containerId);
            pb.redirectErrorStream(true);

            log.info("Executing: docker {} {}", command, containerId);

            Process process = pb.start();

            // Read output
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("Docker: {}", line);
                }
            }

            int exitCode = process.waitFor();
            log.info("Docker {} command completed with exit code: {}", command, exitCode);

            return exitCode == 0;

        } catch (Exception e) {
            log.error("Failed to execute docker {} command", command, e);
            return false;
        }
    }

    /**
     * Converts Instance entity to InstanceResponseDto
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
