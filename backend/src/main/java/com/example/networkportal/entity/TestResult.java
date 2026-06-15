package com.example.networkportal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "test_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_job_id", nullable = false, unique = true)
    private TestJob testJob;

    @Column(name = "packet_loss_pct")
    private Double packetLossPct;

    @Column(name = "throughput_mbps")
    private Double throughputMbps;

    @Column(name = "rtt_min_ms")
    private Double rttMinMs;

    @Column(name = "rtt_avg_ms")
    private Double rttAvgMs;

    @Column(name = "rtt_max_ms")
    private Double rttMaxMs;

    @Column(name = "jitter_ms")
    private Double jitterMs;

    @Column(name = "raw_output", columnDefinition = "TEXT")
    private String rawOutput;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "exit_code")
    private Integer exitCode;

    @Column(name = "parsed_status")
    private String parsedStatus;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
