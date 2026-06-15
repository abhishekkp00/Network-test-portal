package com.example.networkportal.repository;

import com.example.networkportal.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    Optional<TestResult> findByTestJobId(Long jobId);
}
