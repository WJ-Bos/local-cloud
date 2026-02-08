package wbos.backend.model.resource.database;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "databases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Database {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DatabaseStatus status;

    @Column(name = "terraform_state_path")
    private String terraformStatePath;

    @Column(name = "connection_string")
    private String connectionString;

    @Column
    private Integer port;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum DatabaseStatus {
        PROVISIONING,
        RUNNING,
        FAILED,
        DESTROYING,
        DESTROYED
    }
}
