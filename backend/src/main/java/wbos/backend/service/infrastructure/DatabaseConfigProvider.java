package wbos.backend.service.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import wbos.backend.enums.DatabaseType;

/**
 * Provides Terraform configuration templates for different database types
 */
@Component
@Slf4j
public class DatabaseConfigProvider {

    /**
     * Generates Terraform configuration for the specified database type
     *
     * @param type Database type
     * @param dbName Database/container name
     * @param port External port mapping
     * @param password Database password
     * @return Terraform HCL configuration string
     */
    public String generateTerraformConfig(DatabaseType type, String dbName, Integer port, String password) {
        return generateTerraformConfig(type, dbName, port, password, null, null);
    }

    public String generateTerraformConfig(DatabaseType type, String dbName, Integer port, String password, String version) {
        return generateTerraformConfig(type, dbName, port, password, version, null);
    }

    public String generateTerraformConfig(DatabaseType type, String dbName, Integer port, String password, String version, Integer memoryMb) {
        log.info("Generating Terraform config for type: {} version: {} memory: {}",
                type, version != null ? version : "default", memoryMb != null ? memoryMb + "MB" : "unlimited");

        return switch (type) {
            case POSTGRESQL -> generatePostgresConfig(dbName, port, password, resolveVersion(type, version), memoryMb);
            case MYSQL      -> generateMySQLConfig(dbName, port, password, resolveVersion(type, version), memoryMb);
            case MONGODB    -> generateMongoDBConfig(dbName, port, password, resolveVersion(type, version), memoryMb);
            case REDIS      -> generateRedisConfig(dbName, port, password, resolveVersion(type, version), memoryMb);
            case MARIADB    -> generateMariaDBConfig(dbName, port, password, resolveVersion(type, version), memoryMb);
        };
    }

    /** Returns a single HCL line for memory limit, or an empty string when there is no limit. */
    private String memoryLine(Integer memoryMb) {
        if (memoryMb != null && memoryMb > 0) {
            return String.format("  memory = %d%n", memoryMb);
        }
        return "";
    }

    private String resolveVersion(DatabaseType type, String version) {
        if (version != null && !version.isBlank()) {
            return version;
        }
        return switch (type) {
            case POSTGRESQL -> "15";
            case MYSQL      -> "8.0";
            case MONGODB    -> "7.0";
            case REDIS      -> "7.2";
            case MARIADB    -> "11.1";
        };
    }

    /**
     * Generates connection string for the specified database type
     *
     * @param type Database type
     * @param dbName Database name
     * @param port External port
     * @param password Database password
     * @return Connection string
     */
    public String generateConnectionString(DatabaseType type, String dbName, Integer port, String password) {
        return switch (type) {
            case POSTGRESQL -> String.format("postgresql://postgres:%s@localhost:%d/%s", password, port, dbName);
            case MYSQL -> String.format("mysql://root:%s@localhost:%d/%s", password, port, dbName);
            case MONGODB -> String.format("mongodb://root:%s@localhost:%d/%s?authSource=admin", password, port, dbName);
            case REDIS -> String.format("redis://:%s@localhost:%d", password, port);
            case MARIADB -> String.format("mysql://root:%s@localhost:%d/%s", password, port, dbName);
        };
    }

    /**
     * Gets the default starting port for a database type
     * Used for auto-port assignment
     *
     * @param type Database type
     * @return Default starting port
     */
    public int getDefaultStartPort(DatabaseType type) {
        return switch (type) {
            case POSTGRESQL -> 5433; // 5432 reserved for platform
            case MYSQL, MARIADB -> 3306;
            case MONGODB -> 27017;
            case REDIS -> 6379;
        };
    }

    // ==================== PostgreSQL Configuration ====================

    private String generatePostgresConfig(String dbName, Integer port, String password, String version, Integer memoryMb) {
        return String.format("""
                terraform {
                  required_providers {
                    docker = {
                      source  = "kreuzwerker/docker"
                      version = "~> 3.0"
                    }
                  }
                }

                provider "docker" {
                  host = "unix:///var/run/docker.sock"
                }

                resource "docker_container" "database" {
                  name  = "%s"
                  image = "postgres:%s"
                %s
                  env = [
                    "POSTGRES_DB=%s",
                    "POSTGRES_USER=postgres",
                    "POSTGRES_PASSWORD=%s"
                  ]

                  ports {
                    internal = 5432
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "postgresql://postgres:%s@localhost:%d/%s"
                }

                output "container_id" {
                  value = docker_container.database.id
                }
                """, dbName, version, memoryLine(memoryMb), dbName, password, port, password, port, dbName);
    }

    // ==================== MySQL Configuration ====================

    private String generateMySQLConfig(String dbName, Integer port, String password, String version, Integer memoryMb) {
        return String.format("""
                terraform {
                  required_providers {
                    docker = {
                      source  = "kreuzwerker/docker"
                      version = "~> 3.0"
                    }
                  }
                }

                provider "docker" {
                  host = "unix:///var/run/docker.sock"
                }

                resource "docker_container" "database" {
                  name  = "%s"
                  image = "mysql:%s"
                %s
                  env = [
                    "MYSQL_ROOT_PASSWORD=%s",
                    "MYSQL_DATABASE=%s"
                  ]

                  ports {
                    internal = 3306
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "mysql://root:%s@localhost:%d/%s"
                }

                output "container_id" {
                  value = docker_container.database.id
                }
                """, dbName, version, memoryLine(memoryMb), password, dbName, port, password, port, dbName);
    }

    // ==================== MongoDB Configuration ====================

    private String generateMongoDBConfig(String dbName, Integer port, String password, String version, Integer memoryMb) {
        return String.format("""
                terraform {
                  required_providers {
                    docker = {
                      source  = "kreuzwerker/docker"
                      version = "~> 3.0"
                    }
                  }
                }

                provider "docker" {
                  host = "unix:///var/run/docker.sock"
                }

                resource "docker_container" "database" {
                  name  = "%s"
                  image = "mongo:%s"
                %s
                  env = [
                    "MONGO_INITDB_ROOT_USERNAME=root",
                    "MONGO_INITDB_ROOT_PASSWORD=%s",
                    "MONGO_INITDB_DATABASE=%s"
                  ]

                  ports {
                    internal = 27017
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "mongodb://root:%s@localhost:%d/%s?authSource=admin"
                }

                output "container_id" {
                  value = docker_container.database.id
                }
                """, dbName, version, memoryLine(memoryMb), password, dbName, port, password, port, dbName);
    }

    // ==================== Redis Configuration ====================

    private String generateRedisConfig(String dbName, Integer port, String password, String version, Integer memoryMb) {
        return String.format("""
                terraform {
                  required_providers {
                    docker = {
                      source  = "kreuzwerker/docker"
                      version = "~> 3.0"
                    }
                  }
                }

                provider "docker" {
                  host = "unix:///var/run/docker.sock"
                }

                resource "docker_container" "database" {
                  name  = "%s"
                  image = "redis:%s-alpine"
                %s
                  command = ["redis-server", "--requirepass", "%s"]

                  ports {
                    internal = 6379
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "redis://:%s@localhost:%d"
                }

                output "container_id" {
                  value = docker_container.database.id
                }
                """, dbName, version, memoryLine(memoryMb), password, port, password, port);
    }

    // ==================== MariaDB Configuration ====================

    private String generateMariaDBConfig(String dbName, Integer port, String password, String version, Integer memoryMb) {
        return String.format("""
                terraform {
                  required_providers {
                    docker = {
                      source  = "kreuzwerker/docker"
                      version = "~> 3.0"
                    }
                  }
                }

                provider "docker" {
                  host = "unix:///var/run/docker.sock"
                }

                resource "docker_container" "database" {
                  name  = "%s"
                  image = "mariadb:%s"
                %s
                  env = [
                    "MARIADB_ROOT_PASSWORD=%s",
                    "MARIADB_DATABASE=%s"
                  ]

                  ports {
                    internal = 3306
                    external = %d
                  }

                  restart = "unless-stopped"
                }

                output "connection_string" {
                  value = "mysql://root:%s@localhost:%d/%s"
                }

                output "container_id" {
                  value = docker_container.database.id
                }
                """, dbName, version, memoryLine(memoryMb), password, dbName, port, password, port, dbName);
    }
}
