package com.settleup.settleup.expense.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ExpenseRequestDto {

    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotNull(message = "Payer ID is required")
    private Long paidByUserId;

    @NotNull(message = "Description is required")
    private String description;

    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotNull(message = "Split type is required (EQUAL or EXACT)")
    private String splitType;

    private List<Long> involvedUserIds;

    private Map<Long, Double> exactSplits;
}