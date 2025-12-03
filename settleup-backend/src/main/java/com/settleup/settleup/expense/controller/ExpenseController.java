package com.settleup.settleup.expense.controller;

import com.settleup.settleup.expense.dto.BalanceSheetDto; // Make sure this import exists
import com.settleup.settleup.expense.dto.ExpenseRequestDto;
import com.settleup.settleup.expense.dto.ExpenseResponseDto;
import com.settleup.settleup.expense.service.ExpenseService;
import com.settleup.settleup.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addExpense(@Valid @RequestBody ExpenseRequestDto dto) {
        expenseService.addExpense(dto);
        return ResponseEntity.ok(ApiResponse.success(null, "Expense added successfully"));
    }

    @GetMapping("/group/{groupId}/balances")
    public ResponseEntity<ApiResponse<BalanceSheetDto>> getGroupBalances(@PathVariable Long groupId) {
        BalanceSheetDto response = expenseService.getGroupBalances(groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Balances calculated"));
    }

    @GetMapping("/group/{groupId}/history")
    public ResponseEntity<ApiResponse<List<ExpenseResponseDto>>> getGroupHistory(@PathVariable Long groupId) {
        List<ExpenseResponseDto> response = expenseService.getGroupHistory(groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "History fetched"));
    }
}