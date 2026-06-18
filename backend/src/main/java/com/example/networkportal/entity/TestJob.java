package com.example.networkportal.entity;

import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.enums.Protocol;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "test_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private TestProfile profile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    @Column(name = "effective_host")
    private String effectiveHost;

    @Column(name = "effective_server")
    private String effectiveServer;

    @Enumerated(EnumType.STRING)
    @Column(name = "effective_protocol", nullable = false)
    private Protocol effectiveProtocol;

    @Column(name = "effective_count")
    private Integer effectiveCount;

    @Column(name = "effective_duration_seconds")
    private Integer effectiveDurationSeconds;

    @Column(name = "effective_port")
    private Integer effectivePort;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
