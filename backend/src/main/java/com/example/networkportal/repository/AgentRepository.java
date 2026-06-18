package com.example.networkportal.repository;

import com.example.networkportal.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByToken(String token);
    Optional<Agent> findByName(String name);
}
