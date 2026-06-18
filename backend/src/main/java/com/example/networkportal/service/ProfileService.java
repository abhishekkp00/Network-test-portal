package com.example.networkportal.service;

import com.example.networkportal.dto.ProfileRequest;
import com.example.networkportal.dto.ProfileResponse;
import com.example.networkportal.entity.TestProfile;
import com.example.networkportal.entity.User;
import com.example.networkportal.enums.Role;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.exception.UnauthorizedException;
import com.example.networkportal.repository.TestProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final TestProfileRepository profileRepository;
    private final AuditLogService auditLogService;
    private final SchedulingService schedulingService;

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ProfileResponse createProfile(ProfileRequest request, User currentUser) {
        TestProfile profile = TestProfile.builder()
                .name(request.getName())
                .description(request.getDescription())
                .host(request.getHost())
                .server(request.getServer())
                .protocol(request.getProtocol())
                .count(request.getCount())
                .durationSeconds(request.getDurationSeconds())
                .port(request.getPort())
                .notes(request.getNotes())
                .cronExpression(request.getCronExpression())
                .scheduleEnabled(request.getScheduleEnabled() != null ? request.getScheduleEnabled() : false)
                .createdBy(currentUser)
                .build();

        profileRepository.save(profile);

        // Dynamic schedule registration
        schedulingService.scheduleProfile(profile);


        auditLogService.log(
                currentUser.getUsername(),
                "PROFILE_CREATE",
                "TestProfile",
                profile.getId(),
                "Created test profile: " + profile.getName()
        );

        return mapToResponse(profile);
    }

    @Transactional(readOnly = true)
    public List<ProfileResponse> getAllProfiles() {
        return profileRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfileById(Long id) {
        TestProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test profile not found with id: " + id));
        return mapToResponse(profile);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ProfileResponse updateProfile(Long id, ProfileRequest request, User currentUser) {
        TestProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test profile not found with id: " + id));

        // Security check: Operators can only update profiles they created (Admins can update all)
        if (currentUser.getRole() == Role.OPERATOR && !profile.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Operators can only modify their own profiles");
        }

        profile.setName(request.getName());
        profile.setDescription(request.getDescription());
        profile.setHost(request.getHost());
        profile.setServer(request.getServer());
        profile.setProtocol(request.getProtocol());
        profile.setCount(request.getCount());
        profile.setDurationSeconds(request.getDurationSeconds());
        profile.setPort(request.getPort());
        profile.setNotes(request.getNotes());
        profile.setCronExpression(request.getCronExpression());
        profile.setScheduleEnabled(request.getScheduleEnabled() != null ? request.getScheduleEnabled() : false);

        profileRepository.save(profile);

        // Update schedule dynamically
        schedulingService.scheduleProfile(profile);

        auditLogService.log(
                currentUser.getUsername(),
                "PROFILE_UPDATE",
                "TestProfile",
                profile.getId(),
                "Updated test profile: " + profile.getName()
        );

        return mapToResponse(profile);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public void deleteProfile(Long id, User currentUser) {
        TestProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test profile not found with id: " + id));

        // Security check: Operators can only delete profiles they created (Admins can delete all)
        if (currentUser.getRole() == Role.OPERATOR && !profile.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Operators can only delete their own profiles");
        }

        // Cancel dynamic schedule
        schedulingService.cancelSchedule(id);

        profileRepository.delete(profile);

        auditLogService.log(
                currentUser.getUsername(),
                "PROFILE_DELETE",
                "TestProfile",
                id,
                "Deleted test profile: " + profile.getName()
        );
    }

    public ProfileResponse mapToResponse(TestProfile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .name(profile.getName())
                .description(profile.getDescription())
                .host(profile.getHost())
                .server(profile.getServer())
                .protocol(profile.getProtocol())
                .count(profile.getCount())
                .durationSeconds(profile.getDurationSeconds())
                .port(profile.getPort())
                .notes(profile.getNotes())
                .cronExpression(profile.getCronExpression())
                .scheduleEnabled(profile.getScheduleEnabled())
                .createdByUsername(profile.getCreatedBy().getUsername())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
