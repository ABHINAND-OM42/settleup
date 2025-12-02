package com.settleup.settleup.group.service;

import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.expense.entity.Expense;
import com.settleup.settleup.expense.entity.ExpenseSplit;
import com.settleup.settleup.expense.repository.ExpenseRepository;
import com.settleup.settleup.expense.repository.ExpenseSplitRepository;
import com.settleup.settleup.group.dto.GroupCreateDto;
import com.settleup.settleup.group.dto.GroupResponseDto;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.settlement.entity.Settlement;
import com.settleup.settleup.settlement.repository.SettlementRepository;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepo;
    private final ExpenseSplitRepository splitRepo;
    private final SettlementRepository settlementRepo; // Inject Settlement Repo

    // 1. CREATE GROUP
    public GroupResponseDto createGroup(GroupCreateDto dto) {
        // Fetch Creator
        User creator = userRepository.findById(dto.getCreatedByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        // Fetch Members
        List<User> members = userRepository.findAllById(dto.getMemberIds());

        // --- STRICT VALIDATION: Ensure all requested IDs exist ---
        if (members.size() != dto.getMemberIds().size()) {
            List<Long> foundIds = members.stream().map(User::getId).collect(Collectors.toList());
            List<Long> missingIds = dto.getMemberIds().stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            throw new ResourceNotFoundException("Users not found with IDs: " + missingIds);
        }
        // ---------------------------------------------------------

        Group group = Group.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .members(new HashSet<>(members))
                .createdBy(creator)
                .build();

        Group savedGroup = groupRepository.save(group);
        return mapToResponse(savedGroup);
    }

    // 2. GET GROUP BY ID
    public GroupResponseDto getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with ID: " + groupId));
        return mapToResponse(group);
    }

    // 3. GET USER GROUPS
    public List<GroupResponseDto> getUserGroups(Long userId) {
        List<Group> groups = groupRepository.findByMembers_Id(userId);
        return groups.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // 4. ADD MEMBER
    public GroupResponseDto addMember(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (group.getMembers().contains(user)) {
            throw new InvalidInputException("User is already in the group");
        }

        group.getMembers().add(user);
        Group savedGroup = groupRepository.save(group);
        return mapToResponse(savedGroup);
    }

//    // 5. REMOVE MEMBER
//    public GroupResponseDto removeMember(Long groupId, Long userId, Long requesterId) {
//        Group group = groupRepository.findById(groupId)
//                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
//
//        // Permission Check: Only Creator
//        if (!group.getCreatedBy().getId().equals(requesterId)) {
//            throw new InvalidInputException("Only the Group Admin can remove members.");
//        }
//
//        // Safety: Admin cannot remove self
//        if (userId.equals(group.getCreatedBy().getId())) {
//            throw new InvalidInputException("Admin cannot be removed from the group.");
//        }
//
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
//
//        if (!group.getMembers().contains(user)) {
//            throw new ResourceNotFoundException("User is not in this group");
//        }
//
//        // Logic Check: Active Expenses
//        boolean hasPaidExpenses = expenseRepo.existsByGroupIdAndPaidById(groupId, userId);
//        boolean hasSplits = splitRepo.existsByExpense_GroupIdAndUserId(groupId, userId);
//
//        if (hasPaidExpenses || hasSplits) {
//            throw new InvalidInputException("Cannot remove user. They are part of expenses/splits.");
//        }
//
//        group.getMembers().remove(user);
//        Group savedGroup = groupRepository.save(group);
//        return mapToResponse(savedGroup);
//    }

    public GroupResponseDto removeMember(Long groupId, Long userId, Long requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        // 1. Permission Check
        if (!group.getCreatedBy().getId().equals(requesterId)) {
            throw new InvalidInputException("Only the Group Admin can remove members.");
        }
        if (userId.equals(group.getCreatedBy().getId())) {
            throw new InvalidInputException("Admin cannot be removed from the group.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!group.getMembers().contains(user)) {
            throw new ResourceNotFoundException("User is not in this group");
        }

        // 2. CHECK BALANCE (Must be 0 to remove)
        if (!isUserSettled(groupId, userId)) {
            throw new InvalidInputException("User has an unsettled balance (Owes or Owed). Please settle up before removing.");
        }

        // 3. Remove from Active List (Archive)
        group.getMembers().remove(user);
        Group savedGroup = groupRepository.save(group);
        return mapToResponse(savedGroup);
    }

    // --- HELPER: CALCULATE IF BALANCE IS ZERO ---
    private boolean isUserSettled(Long groupId, Long userId) {
        double balance = 0.0;

        // A. Add Expenses Paid (Credit)
        List<Expense> paidExpenses = expenseRepo.findByGroupId(groupId);
        for (Expense e : paidExpenses) {
            if (e.getPaidBy().getId().equals(userId)) {
                balance += e.getAmount();
            }
        }
        // B. Subtract Splits Owed (Debit)
        // Note: This is slightly inefficient but safe.
        // Ideally, use a custom @Query in repo for performance, but this logic is 100% accurate.
        for (Expense e : paidExpenses) {
            List<ExpenseSplit> splits = splitRepo.findByExpenseId(e.getId());
            for (ExpenseSplit split : splits) {
                if (split.getUser().getId().equals(userId)) {
                    balance -= split.getAmountOwed();
                }
            }
        }

        // C. Add Settlements Paid (Credit - I paid someone back)
        List<Settlement> settlements = settlementRepo.findByGroupId(groupId);
        for (Settlement s : settlements) {
            if (s.getPayer().getId().equals(userId)) {
                balance += s.getAmount();
            }
            // D. Subtract Settlements Received (Debit - Someone paid me)
            if (s.getPayee().getId().equals(userId)) {
                balance -= s.getAmount();
            }
        }

        // Check if effectively zero (handling floating point tiny differences)
        return Math.abs(balance) < 0.01;
    }

    // HELPER
    private GroupResponseDto mapToResponse(Group group) {
        List<UserResponseDto> memberDtos = group.getMembers().stream()
                .map(user -> new UserResponseDto(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getMobileNumber()))
                .collect(Collectors.toList());

        return GroupResponseDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .createdAt(group.getCreatedAt())
                .members(memberDtos)
                .createdByUserId(group.getCreatedBy().getId())
                .build();
    }
}