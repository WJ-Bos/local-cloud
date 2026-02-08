package wbos.backend.dto.resource.database;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatabaseResponseDto {

    private Long id;
    private String name;
    private String containerId;
    private String status;
    private Integer port;
    private String connectionString;
    private String password;
    private String terraformStatePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
