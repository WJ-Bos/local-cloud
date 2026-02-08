package wbos.backend.repository.resource.database;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wbos.backend.model.resource.database.Database;

import java.util.Optional;

@Repository
public interface DatabaseRepository extends JpaRepository<Database, Long> {

    Optional<Database> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT COALESCE(MAX(d.port), 5432) FROM Database d")
    Integer findMaxPort();

    /**
     * Check if a port is already in use by a database in PROVISIONING, RUNNING, UPDATING, STARTING, or STOPPING state
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM Database d " +
           "WHERE d.port = :port AND d.status IN ('PROVISIONING', 'RUNNING', 'UPDATING', 'STARTING', 'STOPPING')")
    boolean isPortInUse(@Param("port") Integer port);

    /**
     * Find database by port
     */
    Optional<Database> findByPort(Integer port);

    /**
     * Find all databases that are not destroyed
     */
    @Query("SELECT d FROM Database d WHERE d.status != 'DESTROYED' ORDER BY d.createdAt DESC")
    java.util.List<Database> findAllActiveDatabase();
}
