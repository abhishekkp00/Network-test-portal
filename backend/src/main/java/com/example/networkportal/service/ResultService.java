package com.example.networkportal.service;

import com.example.networkportal.dto.ResultResponse;
import com.example.networkportal.entity.TestResult;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.repository.TestResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final TestResultRepository resultRepository;

    @Transactional(readOnly = true)
    public List<ResultResponse> getAllResults() {
        return resultRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResultResponse getResultById(Long id) {
        TestResult result = resultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test result not found with id: " + id));
        return mapToResponse(result);
    }

    @Transactional(readOnly = true)
    public ResultResponse getResultByJobId(Long jobId) {
        TestResult result = resultRepository.findByTestJobId(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Test result not found for job id: " + jobId));
        return mapToResponse(result);
    }

    public ResultResponse mapToResponse(TestResult result) {
        return ResultResponse.builder()
                .id(result.getId())
                .jobId(result.getTestJob().getId())
                .packetLossPct(result.getPacketLossPct())
                .throughputMbps(result.getThroughputMbps())
                .rttMinMs(result.getRttMinMs())
                .rttAvgMs(result.getRttAvgMs())
                .rttMaxMs(result.getRttMaxMs())
                .jitterMs(result.getJitterMs())
                .rawOutput(result.getRawOutput())
                .errorMessage(result.getErrorMessage())
                .exitCode(result.getExitCode())
                .parsedStatus(result.getParsedStatus())
                .createdAt(result.getCreatedAt())
                .build();
    }
}
