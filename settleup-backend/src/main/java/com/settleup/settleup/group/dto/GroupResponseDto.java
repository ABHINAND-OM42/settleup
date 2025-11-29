package com.settleup.settleup.group.dto;

import com.settleup.settleup.user.dto.UserResponseDto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class GroupResponseDto {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private List<UserResponseDto> members; // Full member details
}