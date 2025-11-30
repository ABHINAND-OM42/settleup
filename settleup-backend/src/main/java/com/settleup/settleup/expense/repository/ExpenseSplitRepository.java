package com.settleup.settleup.expense.repository;

import com.settleup.settleup.expense.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {
    List<ExpenseSplit> findByExpenseId(Long expenseId);
    boolean existsByExpense_GroupIdAndUserId(Long groupId, Long userId);
}