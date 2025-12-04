package com.settleup.settleup.settlement.controller;

import com.settleup.settleup.settlement.dto.SettlementDto;
import com.settleup.settleup.settlement.service.SettlementService;
import com.settleup.settleup.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/settlements") // Dedicated endpoint
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addSettlement(@Valid @RequestBody SettlementDto dto) {
        log.info("Request to SETTLE UP: PayerId={} -> PayeeId={}, Amount={}, GroupId={}",
                dto.getPayerId(), dto.getPayeeId(), dto.getAmount(), dto.getGroupId());
        settlementService.addSettlement(dto);
        log.info("Settlement recorded successfully for groupId: {}", dto.getGroupId());
        return ResponseEntity.ok(ApiResponse.success(null, "Settlement recorded successfully"));
    }
}