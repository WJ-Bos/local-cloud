package wbos.backend.records;

import java.nio.file.Path;

public record TerraformResult(
        boolean success,
        String connectionString,
        String containerId,
        String password,
        String errorMessage,
        Path workingDirectory
) {}
