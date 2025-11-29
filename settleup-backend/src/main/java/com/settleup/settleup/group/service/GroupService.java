package com.settleup.settleup.group.service;

import com.settleup.settleup.group.dto.GroupCreateDto;
import com.settleup.settleup.group.dto.GroupResponseDto;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import com.settleup.settleup.exception.ResourceNotFoundException;

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

    // CREATE GROUP
    public GroupResponseDto createGroup(GroupCreateDto dto) {

        // 1. Fetch all members from DB
        List<User> members = userRepository.findAllById(dto.getMemberIds());

        // --- NEW STRICT VALIDATION START ---
        // If the number of found users is less than the requested IDs, something is missing.
        if (members.size() != dto.getMemberIds().size()) {

            // Get list of found IDs
            List<Long> foundIds = members.stream()
                    .map(User::getId)
                    .collect(Collectors.toList());

            // Find which IDs from the input are NOT in the found list
            List<Long> missingIds = dto.getMemberIds().stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());

            throw new ResourceNotFoundException("Users not found with IDs: " + missingIds);
        }
        // --- NEW STRICT VALIDATION END ---

        // 2. Create and Save Group
        Group group = Group.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .members(new HashSet<>(members))
                .build();

        Group savedGroup = groupRepository.save(group);

        return mapToResponse(savedGroup);
    }

    // GET GROUP BY ID
    public GroupResponseDto getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with ID: " + groupId));

        return mapToResponse(group);
    }

    // GET ALL GROUPS FOR A USER (For Dashboard)
    public List<GroupResponseDto> getUserGroups(Long userId) {
        List<Group> groups = groupRepository.findByMembers_Id(userId);
        return groups.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // HELPER: Map Entity to DTO
    private GroupResponseDto mapToResponse(Group group) {
        // Convert User entities to UserResponseDto
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
                .build();
    }
}