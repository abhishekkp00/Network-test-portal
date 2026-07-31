# Stage 1: Build the JAR package
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app
# Copy pom.xml first to leverage Docker layer caching for dependency downloads
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Compact runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install network utilities AND python3 for executing local worker scripts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        iputils-ping \
        iperf3 \
        python3 \
        python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy built package from build stage
COPY --from=build /app/target/*.jar app.jar

# Run as a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
