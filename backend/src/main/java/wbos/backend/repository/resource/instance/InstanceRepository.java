package wbos.backend.repository.resource.instance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wbos.backend.model.resource.instance.Instance;

import java.util.Optional;

@Repository
public interface InstanceRepository extends JpaRepository<Instance, Long> {

    /**
     * Find the active (non-terminated) instance with this name.
     * Terminated rows are kept for history and may share the name.
     */
    @Query("SELECT i FROM Instance i WHERE i.name = :name AND i.status != 'TERMINATED'")
    Optional<Instance> findByName(@Param("name") String name);

    @Query("SELECT COALESCE(MAX(i.sshPort), 2221) FROM Instance i")
    Integer findMaxSshPort();

    /**
     * Check if an SSH port is already in use by an instance in PENDING, RUNNING, UPDATING, STARTING, or STOPPING state
     */
    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM Instance i " +
           "WHERE i.sshPort = :port AND i.status IN ('PENDING', 'RUNNING', 'UPDATING', 'STARTING', 'STOPPING')")
    boolean isPortInUse(@Param("port") Integer port);

    /**
     * Find instance by SSH port
     */
    Optional<Instance> findBySshPort(Integer sshPort);

    /**
     * Find all instances that are not terminated
     */
    @Query("SELECT i FROM Instance i WHERE i.status != 'TERMINATED' ORDER BY i.createdAt DESC")
    java.util.List<Instance> findAllActiveInstance();
}
