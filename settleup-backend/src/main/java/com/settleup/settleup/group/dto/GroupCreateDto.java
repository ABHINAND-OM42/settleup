package com.settleup.settleup.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class GroupCreateDto {

    @NotBlank(message = "Group name is required")
    private String name;

    private String description;

    @NotEmpty(message = "Group must have at least one member")
    private List<Long> memberIds;

    @NotNull(message = "Creator ID is required")
    private Long createdByUserId;
}