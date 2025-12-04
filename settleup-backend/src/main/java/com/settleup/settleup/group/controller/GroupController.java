package com.settleup.settleup.group.controller;

import com.settleup.settleup.group.dto.GroupCreateDto;
import com.settleup.settleup.group.dto.GroupResponseDto;
import com.settleup.settleup.group.service.GroupService;
import com.settleup.settleup.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponseDto>> createGroup(@Valid @RequestBody GroupCreateDto dto) {
        log.info("Request received to create group with name: '{}' by creatorId: {}", dto.getName(), dto.getCreatedByUserId());
        GroupResponseDto response = groupService.createGroup(dto);
        log.info("Group created successfully with ID: {}", response.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Group created successfully"));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupResponseDto>> getGroup(@PathVariable Long groupId) {
        log.info("Fetching details for groupId: {}", groupId);
        GroupResponseDto response = groupService.getGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Group details fetched"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<GroupResponseDto>>> getUserGroups(@PathVariable Long userId) {
        log.info("Fetching all groups for userId: {}", userId);
        List<GroupResponseDto> response = groupService.getUserGroups(userId);
        log.info("Found {} groups for userId: {}", response.size(), userId);
        return ResponseEntity.ok(ApiResponse.success(response, "User groups fetched"));
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupResponseDto>> addMember(
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        log.info("Request to ADD member userId: {} to groupId: {}", userId, groupId);

        GroupResponseDto response = groupService.addMember(groupId, userId);
        log.info("Member added successfully to groupId: {}", groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Member added successfully"));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupResponseDto>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @RequestParam Long requesterId) {
        log.info("Request to REMOVE member userId: {} from groupId: {} by requesterId: {}", userId, groupId, requesterId);
        GroupResponseDto response = groupService.removeMember(groupId, userId, requesterId);
        log.info("Member removed successfully from groupId: {}", groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Member removed successfully"));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable Long groupId,
            @RequestParam Long requesterId
    ) {
        log.warn("Request to DELETE entire groupId: {} by requesterId: {}", groupId, requesterId);
        groupService.deleteGroup(groupId, requesterId);
        log.info("Group {} deleted successfully", groupId);
        return ResponseEntity.ok(ApiResponse.success(null, "Group deleted successfully"));
    }
}