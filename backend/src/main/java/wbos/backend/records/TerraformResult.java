package wbos.backend.records;

import java.nio.file.Path;

public record TerraformResult(
        boolean success,
        String connectionString,
        String containerId,
        String errorMessage,
        Path workingDirectory
) {}
