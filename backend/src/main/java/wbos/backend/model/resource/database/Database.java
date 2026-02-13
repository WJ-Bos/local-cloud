package wbos.backend.model.resource.database;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import wbos.backend.enums.DatabaseStatus;
import wbos.backend.enums.DatabaseType;

import java.time.LocalDateTime;

@Entity
@Table(name = "databases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Database {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DatabaseType type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DatabaseStatus status;

    @Column(name = "container_id")
    private String containerId;

    @Column(name = "terraform_state_path")
    private String terraformStatePath;

    @Column(name = "connection_string")
    private String connectionString;

    @Column(name = "encrypted_password")
    private String encryptedPassword;

    @Column(name = "version", length = 20)
    private String version;

    @Column
    private Integer port;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
