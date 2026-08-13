package wbos.backend.enums;

/**
 * Instance sizes (the EC2 instance type equivalent).
 * Memory maps to the Docker container memory limit (MB) and vCPUs are
 * approximated with Docker CPU shares (1024 shares per vCPU).
 */
public enum InstanceType {
    T3_NANO("t3.nano", 1, 128, 256),
    T3_MICRO("t3.micro", 1, 256, 512),
    T3_SMALL("t3.small", 1, 512, 1024),
    T3_MEDIUM("t3.medium", 2, 1024, 2048),
    T3_LARGE("t3.large", 2, 2048, 4096);

    private final String apiName;
    private final int vcpus;
    private final int memoryMb;
    private final int cpuShares;

    InstanceType(String apiName, int vcpus, int memoryMb, int cpuShares) {
        this.apiName = apiName;
        this.vcpus = vcpus;
        this.memoryMb = memoryMb;
        this.cpuShares = cpuShares;
    }

    public String getApiName() {
        return apiName;
    }

    public int getVcpus() {
        return vcpus;
    }

    public int getMemoryMb() {
        return memoryMb;
    }

    public int getCpuShares() {
        return cpuShares;
    }
}
