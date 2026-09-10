package com.example.networkportal.repository;

import com.example.networkportal.entity.TestJob;
import com.example.networkportal.enums.JobStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestJobRepository extends JpaRepository<TestJob, Long> {
    List<TestJob> findByRequestedById(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2")})
    Optional<TestJob> findFirstByAgentIdAndStatusOrderByIdAsc(Long agentId, JobStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2")})
    @Query("SELECT j FROM TestJob j WHERE j.agent.id = :agentId AND j.status = :status AND (j.nextRetryAt IS NULL OR j.nextRetryAt <= :now) ORDER BY j.id ASC LIMIT 1")
    Optional<TestJob> findFirstClaimableJobByAgentId(@Param("agentId") Long agentId, @Param("status") JobStatus status, @Param("now") java.time.LocalDateTime now);

    @Query("SELECT j FROM TestJob j WHERE j.status = :status AND j.startedAt < :cutoff")
    List<TestJob> findStaleJobs(@Param("status") JobStatus status, @Param("cutoff") java.time.LocalDateTime cutoff);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2")})
    @Query("SELECT j FROM TestJob j WHERE j.id = :id")
    Optional<TestJob> findByIdForUpdate(@Param("id") Long id);
}

