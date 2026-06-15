package com.example.networkportal.service;

import com.example.networkportal.dto.AuditLogResponse;
import com.example.networkportal.entity.AuditLog;
import com.example.networkportal.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String username, String actionType, String entityType, Long entityId, String message) {
        AuditLog auditLog = AuditLog.builder()
                .username(username != null ? username : "SYSTEM")
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .message(message)
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .username(log.getUsername())
                .actionType(log.getActionType())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .message(log.getMessage())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
