package com.settleup.settleup.expense.service;

import com.settleup.settleup.expense.dto.BalanceSheetDto;
import com.settleup.settleup.expense.dto.ExpenseRequestDto;
import com.settleup.settleup.expense.dto.ExpenseResponseDto;
import com.settleup.settleup.expense.entity.Expense;
import com.settleup.settleup.expense.entity.ExpenseSplit;
import com.settleup.settleup.expense.repository.ExpenseRepository;
import com.settleup.settleup.expense.repository.ExpenseSplitRepository;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.settlement.entity.Settlement;
import com.settleup.settleup.settlement.repository.SettlementRepository;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepo;
    private final ExpenseSplitRepository splitRepo;
    private final GroupRepository groupRepo;
    private final UserRepository userRepo;
    private final SettlementRepository settlementRepo; // Inject Settlement Repo

    // -------------------------------------------------------------------------
    // 1. ADD EXPENSE LOGIC
    // -------------------------------------------------------------------------
    @Transactional
    public void addExpense(ExpenseRequestDto dto) {

        Group group = groupRepo.findById(dto.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        User payer = userRepo.findById(dto.getPaidByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Payer not found"));

        // Validate Members
        Set<Long> involvedUserIds = new HashSet<>();
        involvedUserIds.add(dto.getPaidByUserId());

        if ("EQUAL".equalsIgnoreCase(dto.getSplitType())) {
            involvedUserIds.addAll(dto.getInvolvedUserIds());
        } else if ("EXACT".equalsIgnoreCase(dto.getSplitType())) {
            involvedUserIds.addAll(dto.getExactSplits().keySet());
        }
        validateMembersBelongToGroup(group, involvedUserIds);

        // Save Header
        Expense expense = Expense.builder()
                .group(group)
                .paidBy(payer)
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .splitType(dto.getSplitType())
                .build();

        expense = expenseRepo.save(expense);

        // Save Splits
        List<ExpenseSplit> splits = new ArrayList<>();
        if ("EQUAL".equalsIgnoreCase(dto.getSplitType())) {
            splits = calculateEqualSplits(expense, dto.getInvolvedUserIds(), dto.getAmount());
        } else if ("EXACT".equalsIgnoreCase(dto.getSplitType())) {
            splits = calculateExactSplits(expense, dto.getExactSplits(), dto.getAmount());
        } else {
            throw new InvalidInputException("Invalid Split Type. Use EQUAL or EXACT.");
        }
        splitRepo.saveAll(splits);
    }

    // -------------------------------------------------------------------------
    // 2. GET BALANCES LOGIC (The Fix)
    // -------------------------------------------------------------------------
    public BalanceSheetDto getGroupBalances(Long groupId) {

        // Map: UserId -> Net Balance (Positive = Owed, Negative = Owes)
        Map<Long, Double> balances = new HashMap<>();

        // A. Process Expenses (Debt Creation)
        List<Expense> expenses = expenseRepo.findByGroupId(groupId);
        for (Expense e : expenses) {
            // Payer gets POSITIVE credit
            balances.merge(e.getPaidBy().getId(), e.getAmount(), Double::sum);

            // Splitters get NEGATIVE debit
            List<ExpenseSplit> splits = splitRepo.findByExpenseId(e.getId());
            for (ExpenseSplit split : splits) {
                balances.merge(split.getUser().getId(), -split.getAmountOwed(), Double::sum);
            }
        }

        // B. Process Settlements (Debt Reduction)
        List<Settlement> settlements = settlementRepo.findByGroupId(groupId);
        for (Settlement s : settlements) {
            // Payer (Who owed money) paid back -> Balance Increases (Less Negative)
            balances.merge(s.getPayer().getId(), s.getAmount(), Double::sum);

            // Payee (Who was owed) received money -> Balance Decreases (Less Positive)
            balances.merge(s.getPayee().getId(), -s.getAmount(), Double::sum);
        }

        // C. Separate into Debtors and Creditors for Simplification
        List<BalanceSheetDto.UserBalance> userBalances = new ArrayList<>();
        Map<Long, Double> debtors = new HashMap<>();
        Map<Long, Double> creditors = new HashMap<>();

        for (Map.Entry<Long, Double> entry : balances.entrySet()) {
            double val = Math.round(entry.getValue() * 100.0) / 100.0;

            // Skip if balance is essentially zero
            if (Math.abs(val) < 0.01) continue;

            // Add to the View List
            User user = userRepo.findById(entry.getKey()).orElse(null);
            if (user != null) {
                userBalances.add(new BalanceSheetDto.UserBalance(user.getId(), user.getName(), val));
            }

            // Add to Calculation Maps
            if (val < 0) debtors.put(entry.getKey(), val);
            else creditors.put(entry.getKey(), val);
        }

        // D. Run Algorithm
        List<BalanceSheetDto.SimplifiedDebt> simplifiedDebts = simplifyDebts(debtors, creditors);

        return new BalanceSheetDto(userBalances, simplifiedDebts);
    }

    // -------------------------------------------------------------------------
    // 3. PRIVATE HELPERS
    // -------------------------------------------------------------------------

    // Greedy Algorithm to minimize transactions
    private List<BalanceSheetDto.SimplifiedDebt> simplifyDebts(Map<Long, Double> debtors, Map<Long, Double> creditors) {
        List<BalanceSheetDto.SimplifiedDebt> transactions = new ArrayList<>();

        Iterator<Map.Entry<Long, Double>> debtorIt = debtors.entrySet().iterator();
        Iterator<Map.Entry<Long, Double>> creditorIt = creditors.entrySet().iterator();

        Map.Entry<Long, Double> currentDebtor = debtorIt.hasNext() ? debtorIt.next() : null;
        Map.Entry<Long, Double> currentCreditor = creditorIt.hasNext() ? creditorIt.next() : null;

        while (currentDebtor != null && currentCreditor != null) {
            double debt = Math.abs(currentDebtor.getValue());
            double credit = currentCreditor.getValue();

            // Allow settlement of the minimum of the two amounts
            double amount = Math.min(debt, credit);
            amount = Math.round(amount * 100.0) / 100.0;

            if (amount > 0) {
                String fromName = userRepo.findById(currentDebtor.getKey()).map(User::getName).orElse("Unknown");
                String toName = userRepo.findById(currentCreditor.getKey()).map(User::getName).orElse("Unknown");

                transactions.add(new BalanceSheetDto.SimplifiedDebt(fromName, toName, amount));
            }

            // Update remaining amounts
            double remainingDebt = debt - amount;
            double remainingCredit = credit - amount;

            // Move pointers or update values
            if (remainingDebt < 0.01) {
                currentDebtor = debtorIt.hasNext() ? debtorIt.next() : null;
            } else {
                currentDebtor.setValue(-remainingDebt);
            }

            if (remainingCredit < 0.01) {
                currentCreditor = creditorIt.hasNext() ? creditorIt.next() : null;
            } else {
                currentCreditor.setValue(remainingCredit);
            }
        }
        return transactions;
    }

    private void validateMembersBelongToGroup(Group group, Set<Long> userIdsToCheck) {
        Set<Long> validMemberIds = group.getMembers().stream()
                .map(User::getId)
                .collect(Collectors.toSet());

        List<Long> nonMembers = userIdsToCheck.stream()
                .filter(id -> !validMemberIds.contains(id))
                .collect(Collectors.toList());

        if (!nonMembers.isEmpty()) {
            throw new InvalidInputException("The following users are not members of this group: " + nonMembers);
        }
    }

    private List<ExpenseSplit> calculateEqualSplits(Expense expense, List<Long> userIds, Double totalAmount) {
        if (userIds == null || userIds.isEmpty()) throw new InvalidInputException("No users selected for split");
        int count = userIds.size();
        double baseShare = Math.floor((totalAmount / count) * 100) / 100.0;
        double remainder = totalAmount - (baseShare * count);
        List<ExpenseSplit> splits = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Long currentUserId = userIds.get(i);
            User user = userRepo.findById(currentUserId).orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));
            double share = baseShare;
            if (i == 0) share += remainder;
            splits.add(ExpenseSplit.builder().expense(expense).user(user).amountOwed(share).build());
        }
        return splits;
    }

    private List<ExpenseSplit> calculateExactSplits(Expense expense, Map<Long, Double> splitMap, Double totalAmount) {
        if (splitMap == null || splitMap.isEmpty()) throw new InvalidInputException("No split amounts provided");
        double sum = splitMap.values().stream().mapToDouble(Double::doubleValue).sum();
        if (Math.abs(totalAmount - sum) > 0.01) throw new InvalidInputException("Split amounts do not sum to total");
        List<ExpenseSplit> splits = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : splitMap.entrySet()) {
            User user = userRepo.findById(entry.getKey()).orElseThrow(() -> new ResourceNotFoundException("User not found: " + entry.getKey()));
            splits.add(ExpenseSplit.builder().expense(expense).user(user).amountOwed(entry.getValue()).build());
        }
        return splits;
    }


    public List<ExpenseResponseDto> getGroupHistory(Long groupId) {
        List<ExpenseResponseDto> history = new ArrayList<>();

        // 1. Fetch Expenses
        List<Expense> expenses = expenseRepo.findByGroupId(groupId);
        for (Expense e : expenses) {

            // --- NEW: Fetch Splits for this expense ---
            List<ExpenseSplit> splitsEntities = splitRepo.findByExpenseId(e.getId());
            List<ExpenseResponseDto.SplitDetail> splitDetails = splitsEntities.stream()
                    .map(s -> ExpenseResponseDto.SplitDetail.builder()
                            .userName(s.getUser().getName())
                            .amountOwed(s.getAmountOwed())
                            .build())
                    .collect(Collectors.toList());
            // ------------------------------------------

            history.add(ExpenseResponseDto.builder()
                    .id(e.getId())
                    .description(e.getDescription())
                    .amount(e.getAmount())
                    .paidByUserName(e.getPaidBy().getName())
                    .createdAt(e.getCreatedAt())
                    .type("EXPENSE")
                    .splits(splitDetails) // Add the details
                    .build());
        }

        // 2. Fetch Settlements (No changes needed here usually, but let's be consistent)
        List<Settlement> settlements = settlementRepo.findByGroupId(groupId);
        for (Settlement s : settlements) {
            String desc = s.getPayer().getName() + " paid " + s.getPayee().getName();
            history.add(ExpenseResponseDto.builder()
                    .id(s.getId())
                    .description(desc)
                    .amount(s.getAmount())
                    .paidByUserName(s.getPayer().getName())
                    .createdAt(s.getCreatedAt())
                    .type("SETTLEMENT")
                    // Settlements don't really have "splits", but we can leave it null or empty
                    .build());
        }

        history.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return history;
    }
}