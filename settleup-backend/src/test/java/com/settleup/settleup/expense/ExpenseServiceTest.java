package com.settleup.settleup.expense;

import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.expense.dto.BalanceSheetDto;
import com.settleup.settleup.expense.dto.ExpenseRequestDto;
import com.settleup.settleup.expense.dto.ExpenseResponseDto;
import com.settleup.settleup.expense.entity.Expense;
import com.settleup.settleup.expense.entity.ExpenseSplit;
import com.settleup.settleup.expense.repository.ExpenseRepository;
import com.settleup.settleup.expense.repository.ExpenseSplitRepository;
import com.settleup.settleup.expense.service.ExpenseService;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.settlement.entity.Settlement;
import com.settleup.settleup.settlement.repository.SettlementRepository;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ExpenseServiceTest {
    @Mock
    private ExpenseRepository expenseRepo;

    @Mock
    private ExpenseSplitRepository splitRepo;

    @Mock
    private GroupRepository groupRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private SettlementRepository settlementRepo;

    @InjectMocks
    private ExpenseService expenseService;

    private User user1;
    private User user2;
    private User user3;
    private Group group;

    @BeforeEach
    void setUp() {
        user1 = User.builder().id(1L).name("Alice").build();
        user2 = User.builder().id(2L).name("Bob").build();
        user3 = User.builder().id(3L).name("Charlie").build();

        group = Group.builder()
                .id(10L)
                .name("Trip")
                .members(new HashSet<>(Arrays.asList(user1, user2, user3)))
                .build();
    }

    @Test
    void addExpenseEqualSplitSuccess() {
        ExpenseRequestDto dto = new ExpenseRequestDto();
        dto.setGroupId(10L);
        dto.setPaidByUserId(1L);
        dto.setAmount(100.0);
        dto.setSplitType("EQUAL");
        dto.setInvolvedUserIds(Arrays.asList(1L, 2L, 3L));
        dto.setDescription("Lunch");

        when(groupRepo.findById(10L)).thenReturn(Optional.of(group));
        when(userRepo.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepo.findById(2L)).thenReturn(Optional.of(user2));
        when(userRepo.findById(3L)).thenReturn(Optional.of(user3));

        when(expenseRepo.save(any(Expense.class))).thenAnswer(i -> i.getArgument(0));

        expenseService.addExpense(dto);

        ArgumentCaptor<List<ExpenseSplit>> captor = ArgumentCaptor.forClass(List.class);
        verify(splitRepo).saveAll(captor.capture());

        List<ExpenseSplit> savedSplits = captor.getValue();
        assertEquals(3, savedSplits.size());

        assertEquals(33.34, savedSplits.get(0).getAmountOwed());
        assertEquals(33.33, savedSplits.get(1).getAmountOwed());
        assertEquals(33.33, savedSplits.get(2).getAmountOwed());
    }

    @Test
    void addExpenseExactSplitSuccess() {
        Map<Long, Double> exactSplits = new HashMap<>();
        exactSplits.put(2L, 60.0);
        exactSplits.put(3L, 40.0);

        ExpenseRequestDto dto = new ExpenseRequestDto();
        dto.setGroupId(10L);
        dto.setPaidByUserId(1L);
        dto.setAmount(100.0);
        dto.setSplitType("EXACT");
        dto.setExactSplits(exactSplits);

        when(groupRepo.findById(10L)).thenReturn(Optional.of(group));
        when(userRepo.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepo.findById(2L)).thenReturn(Optional.of(user2));
        when(userRepo.findById(3L)).thenReturn(Optional.of(user3));
        when(expenseRepo.save(any(Expense.class))).thenAnswer(i -> i.getArgument(0));

        expenseService.addExpense(dto);

        verify(splitRepo).saveAll(anyList());
    }

    @Test
    void addExpenseUserNotInGroupThrowsException() {
        User outsider = User.builder().id(99L).build();

        ExpenseRequestDto dto = new ExpenseRequestDto();
        dto.setGroupId(10L);
        dto.setPaidByUserId(1L);
        dto.setSplitType("EQUAL");
        dto.setInvolvedUserIds(Arrays.asList(1L, 99L));

        when(groupRepo.findById(10L)).thenReturn(Optional.of(group));
        when(userRepo.findById(1L)).thenReturn(Optional.of(outsider));

        assertThrows(InvalidInputException.class, () -> expenseService.addExpense(dto));
    }

    @Test
    void addExpenseExactSplitSumMismatchThrowsException() {
        Map<Long, Double> exactSplits = new HashMap<>();
        exactSplits.put(2L, 50.0);

        ExpenseRequestDto dto = new ExpenseRequestDto();
        dto.setGroupId(10L);
        dto.setPaidByUserId(1L);
        dto.setAmount(100.0);
        dto.setSplitType("EXACT");
        dto.setExactSplits(exactSplits);

        when(groupRepo.findById(10L)).thenReturn(Optional.of(group));
        when(userRepo.findById(1L)).thenReturn(Optional.of(user1));

        InvalidInputException ex = assertThrows(InvalidInputException.class, () -> expenseService.addExpense(dto));
        assertEquals("Split amounts do not sum to total", ex.getMessage());
    }

    @Test
    void getGroupBalancesCalculatesCorrectly() {
        Long expenseId = 100L;
        Expense expense = Expense.builder().id(expenseId).amount(100.0).paidBy(user1).build();
        ExpenseSplit split1 = ExpenseSplit.builder().user(user1).amountOwed(50.0).build();
        ExpenseSplit split2 = ExpenseSplit.builder().user(user2).amountOwed(50.0).build();

        Settlement settlement = Settlement.builder()
                .payer(user2).payee(user1).amount(20.0).build();

        when(expenseRepo.findByGroupId(10L)).thenReturn(List.of(expense));
        when(splitRepo.findByExpenseId(expenseId)).thenReturn(List.of(split1, split2));
        when(settlementRepo.findByGroupId(10L)).thenReturn(List.of(settlement));

        when(userRepo.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepo.findById(2L)).thenReturn(Optional.of(user2));

        BalanceSheetDto result = expenseService.getGroupBalances(10L);


        BalanceSheetDto.UserBalance aliceBalance = result.getBalances().stream().filter(u -> u.getUserId().equals(1L)).findFirst().get();
        assertEquals(30.0, aliceBalance.getAmount());

        BalanceSheetDto.UserBalance bobBalance = result.getBalances().stream().filter(u -> u.getUserId().equals(2L)).findFirst().get();
        assertEquals(-30.0, bobBalance.getAmount());

        assertFalse(result.getSimplifiedDebts().isEmpty());
        assertEquals("Bob", result.getSimplifiedDebts().get(0).getFromUser());
        assertEquals("Alice", result.getSimplifiedDebts().get(0).getToUser());
        assertEquals(30.0, result.getSimplifiedDebts().get(0).getAmount());
    }

    @Test
    void getGroupHistoryReturnsSortedList() {

        Expense e1 = Expense.builder()
                .id(1L).description("Dinner").amount(50.0).paidBy(user1)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        Settlement s1 = Settlement.builder()
                .id(2L).amount(50.0).payer(user2).payee(user1)
                .createdAt(LocalDateTime.now())
                .build();

        when(expenseRepo.findByGroupId(10L)).thenReturn(List.of(e1));
        when(splitRepo.findByExpenseId(1L)).thenReturn(Collections.emptyList());
        when(settlementRepo.findByGroupId(10L)).thenReturn(List.of(s1));

        List<ExpenseResponseDto> history = expenseService.getGroupHistory(10L);

        assertEquals(2, history.size());

        assertEquals("SETTLEMENT", history.get(0).getType());
        assertEquals("EXPENSE", history.get(1).getType());
    }


}
