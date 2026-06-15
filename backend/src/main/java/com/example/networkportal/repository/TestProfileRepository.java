package com.example.networkportal.repository;

import com.example.networkportal.entity.TestProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestProfileRepository extends JpaRepository<TestProfile, Long> {
    List<TestProfile> findByCreatedById(Long userId);
}
