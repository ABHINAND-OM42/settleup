package com.settleup.settleup.expense.controller;

import com.settleup.settleup.expense.dto.BalanceSheetDto; // Make sure this import exists
import com.settleup.settleup.expense.dto.ExpenseRequestDto;
import com.settleup.settleup.expense.dto.ExpenseResponseDto;
import com.settleup.settleup.expense.service.ExpenseService;
import com.settleup.settleup.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addExpense(@Valid @RequestBody ExpenseRequestDto dto) {
        log.info("Request to ADD Expense: Description='{}', Amount={}, PaidByUserId={}, GroupId={}",
                dto.getDescription(), dto.getAmount(), dto.getPaidByUserId(), dto.getGroupId());
        expenseService.addExpense(dto);
        log.info("Expense added successfully for groupId: {}", dto.getGroupId());
        return ResponseEntity.ok(ApiResponse.success(null, "Expense added successfully"));
    }

    @GetMapping("/group/{groupId}/balances")
    public ResponseEntity<ApiResponse<BalanceSheetDto>> getGroupBalances(@PathVariable Long groupId) {
        log.info("Fetching Balance Sheet for groupId: {}", groupId);
        BalanceSheetDto response = expenseService.getGroupBalances(groupId);
        log.info("Balances calculated successfully for groupId: {}", groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Balances calculated"));
    }

    @GetMapping("/group/{groupId}/history")
    public ResponseEntity<ApiResponse<List<ExpenseResponseDto>>> getGroupHistory(@PathVariable Long groupId) {
        log.info("Fetching Activity History for groupId: {}", groupId);
        List<ExpenseResponseDto> response = expenseService.getGroupHistory(groupId);
        log.info("History fetched for groupId: {}. Found {} items.", groupId, response.size());
        return ResponseEntity.ok(ApiResponse.success(response, "History fetched"));
    }
}