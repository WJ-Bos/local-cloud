package wbos.backend.controllers.resource.instance;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wbos.backend.dto.resource.instance.CreateInstanceRequestDto;
import wbos.backend.dto.resource.instance.InstanceResponseDto;
import wbos.backend.dto.resource.instance.UpdateInstanceRequestDto;
import wbos.backend.service.resource.instance.InstanceControlService;
import wbos.backend.service.resource.instance.InstanceDetailsService;
import wbos.backend.service.resource.instance.InstanceProvisionService;
import wbos.backend.service.resource.instance.InstanceTerminateService;
import wbos.backend.service.resource.instance.InstanceUpdateService;
import wbos.backend.service.utlis.validation.InstanceValidationService;

import java.util.List;

@RestController
@RequestMapping("/instances")
@RequiredArgsConstructor
@Slf4j
public class InstanceController {

    private final InstanceProvisionService instanceProvisionService;
    private final InstanceValidationService instanceValidationService;
    private final InstanceDetailsService instanceDetailsService;
    private final InstanceUpdateService instanceUpdateService;
    private final InstanceTerminateService instanceTerminateService;
    private final InstanceControlService instanceControlService;

    /**
     * Launches a new compute instance (the EC2 RunInstances equivalent)
     *
     * @param createInstanceRequestDto The instance launch request
     * @return ResponseEntity with created instance details
     */
    @PostMapping
    public ResponseEntity<InstanceResponseDto> launchInstance(
            @Valid @RequestBody CreateInstanceRequestDto createInstanceRequestDto) {

        log.info("Received instance launch request: {}", createInstanceRequestDto.getName());

        if (!instanceValidationService.validateCreateRequest(createInstanceRequestDto)) {
            log.warn("Validation failed for instance: {}", createInstanceRequestDto.getName());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return instanceProvisionService.launch(createInstanceRequestDto);
    }

    @GetMapping
    public ResponseEntity<List<InstanceResponseDto>> resyncResources() {
        log.info("Resyncing and Refetching All Compute instances");
        return instanceDetailsService.resync();
    }

    /**
     * Updates an existing compute instance
     *
     * The name in the path must match the name in the request body.
     * Use newName field to rename the instance.
     *
     * @param name The current name of the instance to update (from path)
     * @param updateRequestDto The update request containing newName, sshPort and/or instanceType
     * @return ResponseEntity with updated instance details
     */
    @PutMapping("/{name}")
    public ResponseEntity<InstanceResponseDto> updateInstance(
            @PathVariable String name,
            @Valid @RequestBody UpdateInstanceRequestDto updateRequestDto) {

        log.info("Received update request for instance: {} (newName: {}, sshPort: {}, type: {})",
                name, updateRequestDto.getNewName(), updateRequestDto.getSshPort(),
                updateRequestDto.getInstanceType());

        if (!name.equals(updateRequestDto.getName())) {
            log.error("Path name '{}' does not match request body name '{}'", name, updateRequestDto.getName());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // Validate the update request
        if (!instanceValidationService.validateUpdateRequest(updateRequestDto)) {
            log.warn("Validation failed for instance update: {}", name);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return instanceUpdateService.update(updateRequestDto);
    }

    /**
     * Terminates a compute instance (the EC2 TerminateInstances equivalent)
     *
     * @param id The ID of the instance to terminate
     * @return ResponseEntity with termination status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<InstanceResponseDto> terminateInstance(@PathVariable Long id) {
        log.info("Received instance termination request for ID: {}", id);
        return instanceTerminateService.terminate(id);
    }

    /**
     * Stops a running instance container
     *
     * @param id The ID of the instance to stop
     * @return ResponseEntity with updated status
     */
    @PostMapping("/{id}/stop")
    public ResponseEntity<InstanceResponseDto> stopInstance(@PathVariable Long id) {
        log.info("Received instance stop request for ID: {}", id);
        return instanceControlService.stopInstance(id);
    }

    /**
     * Starts a stopped instance container
     *
     * @param id The ID of the instance to start
     * @return ResponseEntity with updated status
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<InstanceResponseDto> startInstance(@PathVariable Long id) {
        log.info("Received instance start request for ID: {}", id);
        return instanceControlService.startInstance(id);
    }
}
