package com.example.networkportal.repository;

import com.example.networkportal.entity.TestJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestJobRepository extends JpaRepository<TestJob, Long> {
    List<TestJob> findByRequestedById(Long userId);
}
