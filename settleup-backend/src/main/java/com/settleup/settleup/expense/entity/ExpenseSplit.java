package com.settleup.settleup.expense.entity;

import com.settleup.settleup.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "expense_splits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "split_seq_gen")
    @SequenceGenerator(name = "split_seq_gen", sequenceName = "split_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double amountOwed;
}