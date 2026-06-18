package com.example.networkportal.service;

import com.example.networkportal.dto.JobRequest;
import com.example.networkportal.entity.TestProfile;
import com.example.networkportal.entity.User;
import com.example.networkportal.repository.TestProfileRepository;
import com.example.networkportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulingService {

    private final TaskScheduler taskScheduler;
    private final TestProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final JobService jobService;

    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void initSchedules() {
        log.info("Initializing scheduled cron tasks for active profiles...");
        profileRepository.findAll().forEach(this::scheduleProfile);
    }

    public void scheduleProfile(TestProfile profile) {
        cancelSchedule(profile.getId());

        if (Boolean.TRUE.equals(profile.getScheduleEnabled()) && profile.getCronExpression() != null && !profile.getCronExpression().trim().isEmpty()) {
            try {
                CronTrigger trigger = new CronTrigger(profile.getCronExpression().trim());
                Runnable task = () -> executeScheduledTask(profile.getId());

                ScheduledFuture<?> future = taskScheduler.schedule(task, trigger);
                scheduledTasks.put(profile.getId(), future);
                log.info("Scheduled profile #{} ({}) with cron expression [{}]", profile.getId(), profile.getName(), profile.getCronExpression());
            } catch (IllegalArgumentException e) {
                log.error("Failed to schedule profile #{} ({}): Invalid cron expression [{}]. Error: {}", 
                        profile.getId(), profile.getName(), profile.getCronExpression(), e.getMessage());
            }
        }
    }

    public void cancelSchedule(Long profileId) {
        ScheduledFuture<?> future = scheduledTasks.remove(profileId);
        if (future != null) {
            future.cancel(true);
            log.info("Cancelled scheduling for profile #{}", profileId);
        }
    }

    private void executeScheduledTask(Long profileId) {
        log.info("Executing scheduled cron check for profile #{}", profileId);
        try {
            User systemUser = userRepository.findByUsername("system")
                    .orElseThrow(() -> new IllegalStateException("System service user not found in database."));

            JobRequest request = new JobRequest();
            request.setProfileId(profileId);

            jobService.createJob(request, systemUser);
            log.info("Scheduled job successfully dispatched for profile #{}", profileId);
        } catch (Exception e) {
            log.error("Failed to execute scheduled job for profile #{}: {}", profileId, e.getMessage());
        }
    }
}
