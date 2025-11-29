package com.settleup.settleup.settlement.controller;

import com.settleup.settleup.settlement.dto.SettlementDto;
import com.settleup.settleup.settlement.service.SettlementService;
import com.settleup.settleup.shared.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settlements") // Dedicated endpoint
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addSettlement(@Valid @RequestBody SettlementDto dto) {
        settlementService.addSettlement(dto);
        return ResponseEntity.ok(ApiResponse.success(null, "Settlement recorded successfully"));
    }
}