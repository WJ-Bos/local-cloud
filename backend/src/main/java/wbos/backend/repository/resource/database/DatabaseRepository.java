package wbos.backend.repository.resource.database;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import wbos.backend.model.resource.database.Database;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DatabaseRepository extends JpaRepository<Database, UUID> {

    Optional<Database> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT COALESCE(MAX(d.port), 5432) FROM Database d")
    Integer findMaxPort();

    /**
     * Check if a port is already in use by a database in PROVISIONING or RUNNING state
     */
    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM Database d " +
           "WHERE d.port = :port AND d.status IN ('PROVISIONING', 'RUNNING')")
    boolean isPortInUse(@Param("port") Integer port);

    /**
     * Find database by port
     */
    Optional<Database> findByPort(Integer port);
}
