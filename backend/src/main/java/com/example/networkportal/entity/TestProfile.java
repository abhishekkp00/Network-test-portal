package com.example.networkportal.entity;

import com.example.networkportal.enums.Protocol;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "test_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    // Used for ping (e.g. "8.8.8.8")
    private String host;

    // Used for iperf (e.g. "iperf.example.com")
    private String server;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Protocol protocol;

    // For ping
    private Integer count;

    // For iperf
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    // For iperf
    private Integer port;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
