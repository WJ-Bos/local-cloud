package wbos.backend.service.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import wbos.backend.enums.DatabaseType;
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
@RequiredArgsConstructor
@Slf4j
public class TerraformService {

    private final DatabaseConfigProvider configProvider;

    private static final String TERRAFORM_BASE_DIR = "/tmp/terraform";
    private static final String CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int PASSWORD_LENGTH = 24;

    /**
     * Provisions a database using Terraform
     *
     * @param dbName Database name
     * @param type Database type
     * @param port External port
     * @return TerraformResult with connection details
     */
    public TerraformResult provisionDatabase(String dbName, DatabaseType type, Integer port) {
        log.info("Starting Terraform provisioning for database: {} (type: {})", dbName, type);

        try {
            // Create working directory
            Path workingDir = Paths.get(TERRAFORM_BASE_DIR, dbName);
            Files.createDirectories(workingDir);

            // Generate secure password
            String password = generateSecurePassword();

            // Generate Terraform configuration using config provider
            String terraformConfig = configProvider.generateTerraformConfig(type, dbName, port, password);
            Path mainTfPath = workingDir.resolve("main.tf");
            Files.writeString(mainTfPath, terraformConfig);

            log.info("Generated {} Terraform config at: {}", type, mainTfPath);

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
                    configProvider.generateConnectionString(type, dbName, port, password));
            String containerId = outputs.get("container_id");

            log.info("Successfully provisioned {} database: {} (container: {})",
                    type, dbName, containerId);

            return new TerraformResult(true, connectionString, containerId, password,
                    null, workingDir);

        } catch (Exception e) {
            log.error("Failed to provision {} database: {}", type, dbName, e);
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
     * Updates a database using Terraform
     * This destroys the old infrastructure and recreates it with new configuration
     *
     * @param oldName Old database name
     * @param newName New database name (can be same as oldName)
     * @param type Database type
     * @param newPort New port number
     * @param existingPassword Existing password to preserve
     * @param oldWorkingDir Old Terraform working directory
     * @return TerraformResult with new connection details
     */
    public TerraformResult updateDatabase(String oldName, String newName, DatabaseType type,
                                          Integer newPort, String existingPassword, Path oldWorkingDir) {
        log.info("Starting Terraform update for {} database: {} -> {} (port: {})",
                type, oldName, newName, newPort);

        try {
            // Step 1: Destroy old infrastructure if it exists
            if (Files.exists(oldWorkingDir)) {
                log.info("Destroying old infrastructure at: {}", oldWorkingDir);
                if (!executeTerraformCommand(oldWorkingDir, "destroy", "-auto-approve")) {
                    log.warn("Failed to destroy old infrastructure, continuing with update...");
                }
                // Delete old directory
                deleteDirectory(oldWorkingDir);
            }

            // Step 2: Create new working directory with new name
            Path newWorkingDir = Paths.get(TERRAFORM_BASE_DIR, newName);
            Files.createDirectories(newWorkingDir);

            // Step 3: Generate new Terraform configuration with existing password
            String terraformConfig = configProvider.generateTerraformConfig(type, newName, newPort, existingPassword);
            Path mainTfPath = newWorkingDir.resolve("main.tf");
            Files.writeString(mainTfPath, terraformConfig);

            log.info("Generated updated {} Terraform config at: {}", type, mainTfPath);

            // Step 4: Execute terraform init
            log.info("Executing terraform init in: {}", newWorkingDir);
            if (!executeTerraformCommand(newWorkingDir, "init")) {
                return new TerraformResult(false, null, null, null,
                        "Terraform init failed during update", newWorkingDir);
            }

            // Step 5: Execute terraform apply
            log.info("Executing terraform apply in: {}", newWorkingDir);
            if (!executeTerraformCommand(newWorkingDir, "apply", "-auto-approve")) {
                return new TerraformResult(false, null, null, null,
                        "Terraform apply failed during update", newWorkingDir);
            }

            // Step 6: Extract outputs
            Map<String, String> outputs = extractTerraformOutputs(newWorkingDir);
            String connectionString = outputs.getOrDefault("connection_string",
                    configProvider.generateConnectionString(type, newName, newPort, existingPassword));
            String containerId = outputs.get("container_id");

            log.info("Successfully updated {} database: {} -> {} (container: {})",
                    type, oldName, newName, containerId);

            return new TerraformResult(true, connectionString, containerId, existingPassword,
                    null, newWorkingDir);

        } catch (Exception e) {
            log.error("Failed to update database: {} -> {}", oldName, newName, e);
            return new TerraformResult(false, null, null, null,
                    e.getMessage(), null);
        }
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
