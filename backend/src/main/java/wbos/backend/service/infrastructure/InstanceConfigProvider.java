package wbos.backend.service.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import wbos.backend.enums.InstanceType;
import wbos.backend.enums.MachineImage;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Provides Terraform configuration templates for compute instances.
 *
 * Each instance is a base OS container that bootstraps an SSH daemon at
 * launch (installed via the image's package manager), so the user can
 * connect with `ssh root@localhost -p <port>` — the EC2 experience on
 * local Docker. Optional user data runs once before sshd starts.
 */
@Component
@Slf4j
public class InstanceConfigProvider {

    private final String dockerHost;

    public InstanceConfigProvider(@Value("${app.docker.host:unix:///var/run/docker.sock}") String dockerHost) {
        this.dockerHost = dockerHost;
    }

    public String generateTerraformConfig(MachineImage image, String instanceName, Integer sshPort,
                                          String rootPassword, InstanceType instanceType, String userData) {
        log.info("Generating Terraform config for instance: {} (image: {}, type: {})",
                instanceName, image, instanceType.getApiName());

        return String.format("""
                terraform {
                  required_providers {
                    docker = {
                      source  = "kreuzwerker/docker"
                      version = "~> 3.0"
                    }
                  }
                }

                provider "docker" {
                  host = "%s"
                }

                resource "docker_container" "instance" {
                  name  = "%s"
                  image = "%s"
                  memory = %d
                  cpu_shares = %d

                  command = ["/bin/sh", "-c", "%s"]

                  ports {
                    internal = 22
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "%s"
                }

                output "container_id" {
                  value = docker_container.instance.id
                }
                """,
                dockerHost,
                instanceName,
                image.getDockerImage(),
                instanceType.getMemoryMb(),
                instanceType.getCpuShares(),
                generateBootstrapCommand(image, rootPassword, userData),
                sshPort,
                generateSshCommand(sshPort));
    }

    /**
     * Generates the SSH connection command for the instance (the connection-string equivalent)
     *
     * @param sshPort External SSH port
     * @return SSH command
     */
    public String generateSshCommand(Integer sshPort) {
        return String.format("ssh root@localhost -p %d", sshPort);
    }

    /**
     * Gets the default starting SSH port for instances
     * Used for auto-port assignment
     *
     * @return Default starting port
     */
    public int getDefaultStartPort() {
        return 2222;
    }

    /**
     * Builds the container boot command: install and start sshd via the
     * image's package manager, set the root password, then run the optional
     * user data script before sshd takes over as the foreground process.
     *
     * The command is embedded in an HCL double-quoted string, so it must not
     * contain double quotes or backslashes — sshd options are passed with -o
     * flags instead of editing sshd_config, and user data is base64-encoded.
     */
    private String generateBootstrapCommand(MachineImage image, String rootPassword, String userData) {
        String installSshd = switch (image.getPackageManager()) {
            case APT -> "apt-get update >/dev/null && DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server >/dev/null && mkdir -p /run/sshd";
            case APK -> "apk add --no-cache openssh >/dev/null && ssh-keygen -A";
            case DNF -> "dnf install -y openssh-server passwd >/dev/null && ssh-keygen -A";
        };

        String startSshd = "/usr/sbin/sshd -D -e -o PermitRootLogin=yes -o PasswordAuthentication=yes";

        return installSshd
                + String.format(" && echo 'root:%s' | chpasswd", rootPassword)
                + userDataSegment(userData)
                + " && " + startSshd;
    }

    /**
     * Returns the user data execution segment, or an empty string when no user data was supplied.
     * The script is base64-encoded so arbitrary content survives HCL and shell quoting;
     * a failing script does not prevent the instance from starting (EC2 semantics).
     */
    private String userDataSegment(String userData) {
        if (userData == null || userData.isBlank()) {
            return "";
        }
        String encoded = Base64.getEncoder().encodeToString(userData.getBytes(StandardCharsets.UTF_8));
        return String.format(
                " && echo '%s' | base64 -d > /root/user-data.sh && (sh /root/user-data.sh > /var/log/user-data.log 2>&1 || true)",
                encoded);
    }
}
