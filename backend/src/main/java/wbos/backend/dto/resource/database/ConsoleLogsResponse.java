package wbos.backend.dto.resource.database;

import java.util.List;

public record ConsoleLogsResponse(List<String> lines, int total) {
    public static ConsoleLogsResponse of(List<String> lines) {
        return new ConsoleLogsResponse(lines, lines.size());
    }
}
