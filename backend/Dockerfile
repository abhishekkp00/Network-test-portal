# Stage 1: Build the JAR package
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Compact runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install network utilities required for executing local diagnostics
RUN apt-get update && \
    apt-get install -y iputils-ping iperf3 && \
    rm -rf /var/lib/apt/lists/*

# Copy built package from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
