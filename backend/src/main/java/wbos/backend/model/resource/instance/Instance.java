package wbos.backend.model.resource.instance;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import wbos.backend.enums.InstanceStatus;
import wbos.backend.enums.InstanceType;
import wbos.backend.enums.MachineImage;

import java.time.LocalDateTime;

@Entity
@Table(name = "instances")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Instance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Not unique at the column level: terminated instances keep their row for
     * history, and the validation layer guarantees at most one non-terminated
     * instance per name.
     */
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MachineImage image;

    @Column(name = "instance_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private InstanceType instanceType;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InstanceStatus status;

    @Column(name = "container_id")
    private String containerId;

    @Column(name = "terraform_state_path")
    private String terraformStatePath;

    @Column(name = "ssh_command")
    private String sshCommand;

    @Column(name = "encrypted_password")
    private String encryptedPassword;

    @Column(name = "user_data", columnDefinition = "TEXT")
    private String userData;

    @Column(name = "ssh_port")
    private Integer sshPort;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
