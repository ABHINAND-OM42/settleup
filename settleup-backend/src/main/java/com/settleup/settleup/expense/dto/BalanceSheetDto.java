package com.settleup.settleup.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BalanceSheetDto {

    // List 1: Net Balance per User (e.g., Alice: +500, Bob: -500)
    // Used for the "Summary" cards at the top of the dashboard
    private List<UserBalance> balances;

    // List 2: Simplified "Who pays Whom" (e.g., Bob -> Alice: 500)
    // Used for the list of debts/settlement instructions
    private List<SimplifiedDebt> simplifiedDebts;

    // --- Inner Classes for Structure ---

    @Data
    @AllArgsConstructor
    public static class UserBalance {
        private Long userId;
        private String name;
        private Double amount; // Positive = Owed to them, Negative = They owe
    }

    @Data
    @AllArgsConstructor
    public static class SimplifiedDebt {
        private String fromUser; // Name of Debtor (Bob)
        private String toUser;   // Name of Creditor (Alice)
        private Double amount;   // Amount to pay
    }
}