package wbos.backend.enums;

/**
 * Lifecycle states for a compute instance, mirroring the EC2 state machine
 */
public enum InstanceStatus {
    PENDING,
    RUNNING,
    STOPPED,
    STARTING,
    STOPPING,
    UPDATING,
    FAILED,
    TERMINATING,
    TERMINATED
}
