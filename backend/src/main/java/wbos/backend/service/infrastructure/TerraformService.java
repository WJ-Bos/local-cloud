package wbos.backend.service.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wbos.backend.records.TerraformResult;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing Terraform operations
 */
@Service
@Slf4j
public class TerraformService {

    private static final String TERRAFORM_BASE_DIR = "/tmp/terraform";
    private static final String CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int PASSWORD_LENGTH = 24;

    /**
     * Provisions a PostgreSQL database using Terraform
     *
     * @param dbName Database name
     * @param port External port
     * @return TerraformResult with connection details
     */
    public TerraformResult provisionPostgres(String dbName, Integer port) {
        log.info("Starting Terraform provisioning for database: {}", dbName);

        try {
            // Create working directory
            Path workingDir = Paths.get(TERRAFORM_BASE_DIR, dbName);
            Files.createDirectories(workingDir);

            // Generate secure password
            String password = generateSecurePassword();

            // Generate Terraform configuration
            String terraformConfig = generatePostgresTerraformConfig(dbName, port, password);
            Path mainTfPath = workingDir.resolve("main.tf");
            Files.writeString(mainTfPath, terraformConfig);

            log.info("Generated Terraform config at: {}", mainTfPath);

            // Execute terraform init
            log.info("Executing terraform init in: {}", workingDir);
            if (!executeTerraformCommand(workingDir, "init")) {
                return new TerraformResult(false, null, null, null,
                        "Terraform init failed", workingDir);
            }

            // Execute terraform apply
            log.info("Executing terraform apply in: {}", workingDir);
            if (!executeTerraformCommand(workingDir, "apply", "-auto-approve")) {
                return new TerraformResult(false, null, null, null,
                        "Terraform apply failed", workingDir);
            }

            // Extract outputs
            Map<String, String> outputs = extractTerraformOutputs(workingDir);
            String connectionString = outputs.getOrDefault("connection_string",
                    buildConnectionString(dbName, port, password));
            String containerId = outputs.get("container_id");

            log.info("Successfully provisioned database: {} (container: {})",
                    dbName, containerId);

            return new TerraformResult(true, connectionString, containerId, password,
                    null, workingDir);

        } catch (Exception e) {
            log.error("Failed to provision database: {}", dbName, e);
            return new TerraformResult(false, null, null, null,
                    e.getMessage(), null);
        }
    }

    /**
     * Destroys a PostgreSQL database using Terraform
     *
     * @param workingDir Terraform working directory
     * @return true if successful
     */
    public boolean destroyPostgres(Path workingDir) {
        log.info("Starting Terraform destroy in: {}", workingDir);

        try {
            if (!Files.exists(workingDir)) {
                log.warn("Working directory does not exist: {}", workingDir);
                return true;
            }

            // Execute terraform destroy
            boolean success = executeTerraformCommand(workingDir,
                    "destroy", "-auto-approve");

            if (success) {
                log.info("Successfully destroyed database at: {}", workingDir);
                deleteDirectory(workingDir);
            } else {
                log.error("Failed to destroy database at: {}", workingDir);
            }

            return success;

        } catch (Exception e) {
            log.error("Failed to destroy database at: {}", workingDir, e);
            return false;
        }
    }

    /**
     * Generates Terraform HCL configuration for PostgreSQL
     */
    private String generatePostgresTerraformConfig(String dbName, Integer port, String password) {
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
                  host = "unix:///var/run/docker.sock"
                }

                resource "docker_container" "postgres" {
                  name  = "%s"
                  image = "postgres:15-alpine"

                  env = [
                    "POSTGRES_DB=%s",
                    "POSTGRES_USER=postgres",
                    "POSTGRES_PASSWORD=%s"
                  ]

                  ports {
                    internal = 5432
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "postgresql://postgres:%s@localhost:%d/%s"
                }

                output "container_id" {
                  value = docker_container.postgres.id
                }
                """, dbName, dbName, password, port, password, port, dbName);
    }

    /**
     * Executes a Terraform command
     */
    private boolean executeTerraformCommand(Path workingDir, String... args) {
        try {
            String[] command = new String[args.length + 1];
            command[0] = "terraform";
            System.arraycopy(args, 0, command, 1, args.length);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(workingDir.toFile());
            pb.redirectErrorStream(true);

            log.info("Executing: {} in {}", String.join(" ", command), workingDir);

            Process process = pb.start();

            // Read output
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.debug("Terraform: {}", line);
                }
            }

            int exitCode = process.waitFor();
            log.info("Terraform command completed with exit code: {}", exitCode);

            return exitCode == 0;

        } catch (Exception e) {
            log.error("Failed to execute terraform command", e);
            return false;
        }
    }

    /**
     * Extracts Terraform outputs
     */
    private Map<String, String> extractTerraformOutputs(Path workingDir) {
        Map<String, String> outputs = new HashMap<>();

        try {
            ProcessBuilder pb = new ProcessBuilder("terraform", "output", "-json");
            pb.directory(workingDir.toFile());

            Process process = pb.start();
            StringBuilder output = new StringBuilder();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            process.waitFor();

            // Simple JSON parsing
            String json = output.toString();
            if (json.contains("connection_string")) {
                outputs.put("connection_string",
                        extractJsonValue(json, "connection_string"));
            }
            if (json.contains("container_id")) {
                outputs.put("container_id",
                        extractJsonValue(json, "container_id"));
            }

        } catch (Exception e) {
            log.warn("Failed to extract terraform outputs", e);
        }

        return outputs;
    }

    /**
     * Simple JSON value extractor
     */
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\".*?\"value\":\\s*\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            log.warn("Failed to extract JSON value for key: {}", key);
        }
        return null;
    }

    /**
     * Builds connection string manually
     */
    private String buildConnectionString(String dbName, Integer port, String password) {
        return String.format("postgresql://postgres:%s@localhost:%d/%s",
                password, port, dbName);
    }

    /**
     * Generates a secure random password
     */
    private String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(PASSWORD_LENGTH);

        for (int i = 0; i < PASSWORD_LENGTH; i++) {
            password.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
        }

        return password.toString();
    }

    /**
     * Deletes directory recursively
     */
    private void deleteDirectory(Path directory) throws Exception {
        if (Files.exists(directory)) {
            Files.walk(directory)
                    .sorted(java.util.Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
    }
}
