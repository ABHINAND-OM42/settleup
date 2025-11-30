package com.settleup.settleup.group.controller;

import com.settleup.settleup.group.dto.GroupCreateDto;
import com.settleup.settleup.group.dto.GroupResponseDto;
import com.settleup.settleup.group.service.GroupService;
import com.settleup.settleup.shared.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GroupController {

    private final GroupService groupService;

    // 1. Create Group
    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponseDto>> createGroup(@Valid @RequestBody GroupCreateDto dto) {
        GroupResponseDto response = groupService.createGroup(dto);
        return ResponseEntity.ok(ApiResponse.success(response, "Group created successfully"));
    }

    // 2. Get Specific Group Details
    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupResponseDto>> getGroup(@PathVariable Long groupId) {
        GroupResponseDto response = groupService.getGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Group details fetched"));
    }

    // 3. Get All Groups for a User (Dashboard)
    // Usage: /api/groups/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<GroupResponseDto>>> getUserGroups(@PathVariable Long userId) {
        List<GroupResponseDto> response = groupService.getUserGroups(userId);
        return ResponseEntity.ok(ApiResponse.success(response, "User groups fetched"));
    }

    //ADD MEMBER
    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupResponseDto>> addMember(
            @PathVariable Long groupId,
            @PathVariable Long userId) {

        GroupResponseDto response = groupService.addMember(groupId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Member added successfully"));
    }

    // Update REMOVE to accept requesterId
    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupResponseDto>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @RequestParam Long requesterId) { // <--- Receive who is clicking the button

        GroupResponseDto response = groupService.removeMember(groupId, userId, requesterId);
        return ResponseEntity.ok(ApiResponse.success(response, "Member removed successfully"));
    }
}