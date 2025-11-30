package com.settleup.settleup.expense.repository;

import com.settleup.settleup.expense.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroupId(Long groupId);
    boolean existsByGroupIdAndPaidById(Long groupId, Long userId);
}