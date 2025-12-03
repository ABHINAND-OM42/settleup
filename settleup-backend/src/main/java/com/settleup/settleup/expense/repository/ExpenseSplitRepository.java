package com.settleup.settleup.expense.repository;

import com.settleup.settleup.expense.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {
    List<ExpenseSplit> findByExpenseId(Long expenseId);
    boolean existsByExpense_GroupIdAndUserId(Long groupId, Long userId);
}