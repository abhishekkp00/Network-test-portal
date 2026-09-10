package com.example.networkportal.repository;

import com.example.networkportal.entity.Incident;
import com.example.networkportal.entity.TestProfile;
import com.example.networkportal.enums.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Optional<Incident> findFirstByProfileAndStatusInOrderByFirstSeenAtDesc(
            TestProfile profile,
            Collection<IncidentStatus> statuses
    );

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByProfileId(Long profileId);
}
