package wbos.backend.service.utlis.validation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wbos.backend.dto.resource.instance.InstanceRequestDto;
import wbos.backend.dto.resource.instance.UpdateInstanceRequestDto;
import wbos.backend.enums.InstanceStatus;
import wbos.backend.model.resource.instance.Instance;
import wbos.backend.repository.resource.instance.InstanceRepository;

import java.util.Optional;

/**
 * Service for validating compute instance operations
 * Handles validation logic for CREATE and UPDATE operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InstanceValidationService {

    private final InstanceRepository instanceRepository;

    /**
     * Validates instance launch request
     *
     * Checks:
     * - Instance name is provided and valid format
     * - Instance name doesn't already exist (unless TERMINATED)
     * - SSH port is in valid range (if provided)
     * - SSH port is not already in use by an active instance
     *
     * @param requestDto The instance launch request
     * @return true if validation passes, false otherwise
     */
    public boolean validateCreateRequest(InstanceRequestDto requestDto) {
        log.info("Validating CREATE request for instance: {}", requestDto != null ? requestDto.getName() : "null");

        // Validate DTO is not null
        if (requestDto == null) {
            log.error("Request DTO cannot be null");
            return false;
        }

        // Validate name (blank check and format check)
        if (!validateBasicNameRules(requestDto.getName())) {
            return false;
        }

        // findByName only returns non-terminated instances, so a hit means the name is taken
        Optional<Instance> existingInstance = instanceRepository.findByName(requestDto.getName());
        if (existingInstance.isPresent()) {
            log.error("Instance with name '{}' already exists and is in '{}' state",
                    requestDto.getName(), existingInstance.get().getStatus());
            return false;
        }

        if (requestDto.getSshPort() != null && !validatePort(requestDto.getSshPort())) {
            return false;
        }

        log.info("CREATE validation successful for instance: '{}' on SSH port: {}",
                requestDto.getName(),
                requestDto.getSshPort() != null ? requestDto.getSshPort() : "auto-assign");
        return true;
    }

    /**
     * Validates instance update request
     *
     * Checks:
     * - Instance name is provided and valid format
     * - Instance exists with given name
     * - Instance is in STOPPED state (only stopped instances can be updated)
     * - If newName is provided, validate it's not already in use (unless TERMINATED)
     * - If SSH port is being changed, validate the new port
     *
     * @param requestDto The instance update request
     * @return true if validation passes, false otherwise
     */
    public boolean validateUpdateRequest(UpdateInstanceRequestDto requestDto) {
        log.info("Validating UPDATE request for instance: '{}'",
                requestDto != null ? requestDto.getName() : "null");

        if (requestDto == null) {
            log.error("Request DTO cannot be null");
            return false;
        }

        if (!validateNameNotBlank(requestDto.getName())) {
            return false;
        }

        Optional<Instance> instanceOpt = findRequiredInstance(requestDto.getName());
        if (instanceOpt.isEmpty()) {
            return false;
        }

        Instance instance = instanceOpt.get();

        if (instance.getStatus() != InstanceStatus.STOPPED) {
            log.error("Instance '{}' (ID: {}) cannot be updated - must be in STOPPED state but is in '{}' state",
                    instance.getName(), instance.getId(), instance.getStatus());
            return false;
        }

        if (requestDto.getNewName() != null && !requestDto.getNewName().equals(instance.getName())) {
            if (!validateNameFormat(requestDto.getNewName())) {
                return false;
            }

            Optional<Instance> existingInstance = instanceRepository.findByName(requestDto.getNewName());
            if (existingInstance.isPresent()) {
                log.error("Instance with name '{}' already exists and is in '{}' state",
                        requestDto.getNewName(), existingInstance.get().getStatus());
                return false;
            }
        }

        if (requestDto.getSshPort() != null && !requestDto.getSshPort().equals(instance.getSshPort())) {
            if (!validatePortForUpdate(requestDto.getSshPort(), instance.getId())) {
                return false;
            }
        }

        log.info("UPDATE validation successful for instance: '{}' (ID: {}, Status: {})",
                instance.getName(), instance.getId(), instance.getStatus());
        return true;
    }

    // ========================================================================================
    // Private Helper Methods
    // ========================================================================================

    /**
     * Validates that instance name is not null or blank
     */
    private boolean validateNameNotBlank(String name) {
        if (name == null || name.isBlank()) {
            log.error("Instance name cannot be null or blank");
            return false;
        }
        return true;
    }

    /**
     * Validates instance name format
     * Name must contain only lowercase letters, numbers, and hyphens
     */
    private boolean validateNameFormat(String name) {
        if (!name.matches("^[a-z0-9-]+$")) {
            log.error("Instance name '{}' must contain only lowercase letters, numbers, and hyphens", name);
            return false;
        }
        return true;
    }

    /**
     * Validates basic name rules: not blank and correct format
     */
    private boolean validateBasicNameRules(String name) {
        return validateNameNotBlank(name) && validateNameFormat(name);
    }

    /**
     * Validates SSH port number
     * Port must be between 1024 and 65535, excluding 5432 (reserved for platform database)
     * Port must not be in use by another active instance
     */
    private boolean validatePort(Integer port) {
        // Check port range
        if (port < 1024 || port > 65535) {
            log.error("SSH port {} is out of valid range. Must be between 1024 and 65535", port);
            return false;
        }

        if (port == 5432) {
            log.error("SSH port 5432 is reserved for the platform database");
            return false;
        }

        // Check if port is in use
        if (instanceRepository.isPortInUse(port)) {
            log.error("SSH port {} is already in use by another instance in an active state", port);
            return false;
        }

        return true;
    }

    /**
     * Validates SSH port number for instance updates
     * Similar to validatePort but excludes the current instance being updated
     */
    private boolean validatePortForUpdate(Integer port, Long currentInstanceId) {
        // Check port range
        if (port < 1024 || port > 65535) {
            log.error("SSH port {} is out of valid range. Must be between 1024 and 65535", port);
            return false;
        }

        if (port == 5432) {
            log.error("SSH port 5432 is reserved for the platform database");
            return false;
        }

        // Check if port is in use by a DIFFERENT instance
        Optional<Instance> instanceOnPort = instanceRepository.findBySshPort(port);
        if (instanceOnPort.isPresent() && !instanceOnPort.get().getId().equals(currentInstanceId)) {
            Instance conflictingInstance = instanceOnPort.get();
            // Check if the conflicting instance is in an active state
            if (conflictingInstance.getStatus() == InstanceStatus.PENDING ||
                conflictingInstance.getStatus() == InstanceStatus.RUNNING ||
                conflictingInstance.getStatus() == InstanceStatus.STARTING ||
                conflictingInstance.getStatus() == InstanceStatus.UPDATING ||
                conflictingInstance.getStatus() == InstanceStatus.STOPPING) {
                log.error("SSH port {} is already in use by instance '{}' (ID: {}) in '{}' state",
                        port, conflictingInstance.getName(), conflictingInstance.getId(),
                        conflictingInstance.getStatus());
                return false;
            }
        }

        return true;
    }

    /**
     * Finds an instance by name and logs error if not found
     */
    private Optional<Instance> findRequiredInstance(String name) {
        Optional<Instance> instanceOpt = instanceRepository.findByName(name);
        if (instanceOpt.isEmpty()) {
            log.error("Instance with name '{}' not found", name);
        }
        return instanceOpt;
    }
}
