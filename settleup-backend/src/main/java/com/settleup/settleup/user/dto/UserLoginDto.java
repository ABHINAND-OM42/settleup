package com.settleup.settleup.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginDto {

    @NotBlank(message = "Identifier (Email or Mobile) is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}