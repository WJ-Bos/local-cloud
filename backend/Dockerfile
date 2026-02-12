# Multi-stage build for Spring Boot application

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy root POM first (parent for the backend module)
COPY pom.xml .

# Copy backend POM and download dependencies (cached layer)
COPY backend/pom.xml backend/
RUN mvn -pl backend dependency:go-offline -B

# Copy source code and build
COPY backend/src backend/src
RUN mvn -pl backend clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install Terraform and Docker CLI
RUN apk add --no-cache curl unzip docker-cli && \
    TERRAFORM_VERSION=1.7.4 && \
    curl -fsSL https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -o terraform.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform.zip && \
    terraform version && \
    docker --version

# Copy the built JAR from builder stage
COPY --from=builder /app/backend/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]