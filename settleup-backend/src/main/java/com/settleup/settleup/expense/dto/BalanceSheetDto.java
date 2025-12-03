package com.settleup.settleup.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BalanceSheetDto {

    private List<UserBalance> balances;
    private List<SimplifiedDebt> simplifiedDebts;

    @Data
    @AllArgsConstructor
    public static class UserBalance {
        private Long userId;
        private String name;
        private Double amount;
    }

    @Data
    @AllArgsConstructor
    public static class SimplifiedDebt {
        private String fromUser;
        private String toUser;
        private Double amount;
    }
}