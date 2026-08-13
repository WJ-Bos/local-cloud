package wbos.backend.service.resource.instance;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.instance.InstanceResponseDto;
import wbos.backend.model.resource.instance.Instance;
import wbos.backend.repository.resource.instance.InstanceRepository;
import wbos.backend.service.security.PasswordEncryptionService;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class InstanceDetailsService {

    private final InstanceRepository instanceRepository;
    private final PasswordEncryptionService passwordEncryptionService;

    /**
     * Resync and fetch all active compute instances
     *
     * Returns all instances that are not in TERMINATED status.
     * This allows the frontend to display current instance state.
     *
     * @return ResponseEntity containing list of active instances
     */
    public ResponseEntity<List<InstanceResponseDto>> resync() {
        log.info("Fetching all active compute instances");

        List<Instance> activeInstances = instanceRepository.findAllActiveInstance();

        log.info("Found {} active compute instance(s)", activeInstances.size());

        List<InstanceResponseDto> responseDtos = activeInstances.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.OK).body(responseDtos);
    }


    private InstanceResponseDto mapToResponseDto(Instance instance) {
        // Unlike databases, the root password is included in the list response —
        // it's the only way to SSH into the instance, and the UI is fed from this list
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
                .terraformStatePath(instance.getTerraformStatePath())
                .createdAt(instance.getCreatedAt())
                .updatedAt(instance.getUpdatedAt())
                .build();
    }
}
