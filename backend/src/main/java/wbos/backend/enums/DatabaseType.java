package wbos.backend.enums;

/**
 * Supported database types
 */
public enum DatabaseType {
    POSTGRESQL("PostgreSQL", "postgres:15-alpine", 5432),
    MYSQL("MySQL", "mysql:8.0", 3306),
    MONGODB("MongoDB", "mongo:7.0", 27017),
    REDIS("Redis", "redis:7.2-alpine", 6379),
    MARIADB("MariaDB", "mariadb:11.1", 3306);

    private final String displayName;
    private final String dockerImage;
    private final int defaultInternalPort;

    DatabaseType(String displayName, String dockerImage, int defaultInternalPort) {
        this.displayName = displayName;
        this.dockerImage = dockerImage;
        this.defaultInternalPort = defaultInternalPort;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDockerImage() {
        return dockerImage;
    }

    public int getDefaultInternalPort() {
        return defaultInternalPort;
    }
}
