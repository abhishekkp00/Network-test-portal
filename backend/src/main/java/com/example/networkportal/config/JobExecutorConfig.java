package com.example.networkportal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class JobExecutorConfig {

    @Value("${jobs.executor.core-pool-size:5}")
    private int corePoolSize;

    @Value("${jobs.executor.max-pool-size:10}")
    private int maxPoolSize;

    @Value("${jobs.executor.queue-capacity:25}")
    private int queueCapacity;

    @Value("${jobs.executor.thread-name-prefix:network-job-}")
    private String threadNamePrefix;

    @Value("${jobs.executor.await-termination-seconds:30}")
    private int awaitTerminationSeconds;

    @Bean(name = "networkJobExecutor")
    public ThreadPoolTaskExecutor networkJobExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix(threadNamePrefix);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(awaitTerminationSeconds);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
