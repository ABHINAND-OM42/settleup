package com.settleup.settleup.group;


import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.expense.entity.Expense;
import com.settleup.settleup.expense.repository.ExpenseRepository;
import com.settleup.settleup.expense.repository.ExpenseSplitRepository;
import com.settleup.settleup.group.dto.GroupCreateDto;
import com.settleup.settleup.group.dto.GroupResponseDto;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.group.service.GroupService;
import com.settleup.settleup.settlement.repository.SettlementRepository;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GrouopServiceTest {

    @InjectMocks
    private GroupService groupService;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExpenseRepository expenseRepo;

    @Mock
    private ExpenseSplitRepository splitRepo;

    @Mock
    private SettlementRepository settlementRepo;

    @Test
    void createGroupSuccess() {

        User creator = User.builder().id(1L).name("Admin").build();
        User member = User.builder().id(2L).name("Member").build();

        GroupCreateDto dto = new GroupCreateDto();
        dto.setName("Goa Trip");
        dto.setCreatedByUserId(1L);
        dto.setMemberIds(Arrays.asList(1L, 2L));

        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
        when(userRepository.findAllById(dto.getMemberIds())).thenReturn(Arrays.asList(creator, member));
        when(groupRepository.save(any(Group.class))).thenAnswer(i -> {
            Group g = i.getArgument(0);
            g.setId(10L);
            return g;
        });

        GroupResponseDto response = groupService.createGroup(dto);
        assertNotNull(response);

        assertEquals("Goa Trip", response.getName());
        assertEquals(2, response.getMembers().size());
        verify(groupRepository).save(any(Group.class));
    }

    @Test
    void createGroupCreatorNotFoundThrowsException() {
        GroupCreateDto dto = new GroupCreateDto();
        dto.setCreatedByUserId(99L);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> groupService.createGroup(dto));
    }

    @Test
    void addMemberSuccess() {
        Group group = Group.builder().id(1L).members(new HashSet<>()).createdBy(new User()).build();
        User newUser = User.builder().id(2L).name("New Guy").build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newUser));
        when(groupRepository.save(any(Group.class))).thenReturn(group);
        groupService.addMember(1L, 2L);

        assertTrue(group.getMembers().contains(newUser));
        verify(groupRepository).save(group);
    }

    @Test
    void addMemberAlreadyInGroupThrowsException() {
        User existingUser = User.builder().id(2L).build();
        Group group = Group.builder().id(1L).members(new HashSet<>(Set.of(existingUser))).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(existingUser));

        assertThrows(InvalidInputException.class, () -> groupService.addMember(1L, 2L));
    }

    @Test
    void removeMemberSuccessWhenBalanceIsZero() {
        User admin = User.builder().id(1L).build();
        User targetUser = User.builder().id(2L).build();
        Group group = Group.builder().id(10L).createdBy(admin).members(new HashSet<>(Set.of(admin, targetUser))).build();

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(groupRepository.save(any(Group.class))).thenReturn(group);
        when(expenseRepo.findByGroupId(10L)).thenReturn(Collections.emptyList());
        when(settlementRepo.findByGroupId(10L)).thenReturn(Collections.emptyList());

        groupService.removeMember(10L, 2L, 1L);
        assertFalse(group.getMembers().contains(targetUser));
        verify(groupRepository).save(group);
    }

    @Test
    void removeMemberUnsettledBalanceThrowsException() {
        User admin = User.builder().id(1L).build();
        User targetUser = User.builder().id(2L).build();
        Group group = Group.builder().id(10L).createdBy(admin).members(new HashSet<>(Set.of(admin, targetUser))).build();

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));

        Expense expense = new Expense();
        expense.setId(100L);
        expense.setAmount(100.0);
        expense.setPaidBy(targetUser);

        when(expenseRepo.findByGroupId(10L)).thenReturn(List.of(expense));
        when(splitRepo.findByExpenseId(100L)).thenReturn(Collections.emptyList());
        when(settlementRepo.findByGroupId(10L)).thenReturn(Collections.emptyList());

        InvalidInputException ex = assertThrows(InvalidInputException.class, () ->
                groupService.removeMember(10L, 2L, 1L)
        );
        assertEquals("User has an unsettled balance (Owes or Owed). Please settle up before removing.", ex.getMessage());
    }

    @Test
    void deleteGroupSuccessWhenSettled() {
        User admin = User.builder().id(1L).build();
        Group group = Group.builder().id(10L).createdBy(admin).build();

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(expenseRepo.findByGroupId(10L)).thenReturn(Collections.emptyList());
        when(settlementRepo.findByGroupId(10L)).thenReturn(Collections.emptyList());

        groupService.deleteGroup(10L, 1L);
        verify(groupRepository).delete(group);
        verify(expenseRepo).deleteAll(any());
        verify(settlementRepo).deleteAll(any());
    }

    @Test
    void deleteGroupUnsettledDebtsThrowsException() {
        User admin = User.builder().id(1L).build();
        Group group = Group.builder().id(10L).createdBy(admin).build();

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        Expense expense = new Expense();
        expense.setId(50L);
        expense.setAmount(500.0);
        expense.setPaidBy(admin);

        when(expenseRepo.findByGroupId(10L)).thenReturn(List.of(expense));
        assertThrows(InvalidInputException.class, () ->
                groupService.deleteGroup(10L, 1L)
        );
        verify(groupRepository, never()).delete(any());
    }
}
