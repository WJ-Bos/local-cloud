package wbos.backend.enums;

/**
 * Supported machine images (the AMI equivalent).
 * Each image maps to a base OS Docker image and the package manager
 * used to bootstrap the SSH daemon at launch time.
 */
public enum MachineImage {
    UBUNTU_22_04("Ubuntu 22.04 LTS", "ubuntu:22.04", PackageManager.APT),
    UBUNTU_24_04("Ubuntu 24.04 LTS", "ubuntu:24.04", PackageManager.APT),
    DEBIAN_12("Debian 12", "debian:12", PackageManager.APT),
    ALPINE_3_19("Alpine 3.19", "alpine:3.19", PackageManager.APK),
    AMAZON_LINUX_2023("Amazon Linux 2023", "amazonlinux:2023", PackageManager.DNF);

    public enum PackageManager {
        APT,
        APK,
        DNF
    }

    private final String displayName;
    private final String dockerImage;
    private final PackageManager packageManager;

    MachineImage(String displayName, String dockerImage, PackageManager packageManager) {
        this.displayName = displayName;
        this.dockerImage = dockerImage;
        this.packageManager = packageManager;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDockerImage() {
        return dockerImage;
    }

    public PackageManager getPackageManager() {
        return packageManager;
    }
}
