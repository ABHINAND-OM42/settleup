package com.settleup.settleup.expense.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExpenseResponseDto {
    private Long id;
    private String description;
    private Double amount;
    private String paidByUserName; // We just need the name for the UI
    private LocalDateTime createdAt;
    private String type;

    private List<SplitDetail> splits;

    @Data
    @Builder
    public static class SplitDetail {
        private String userName;
        private Double amountOwed;
    }// "EXPENSE" or "SETTLEMENT"
}