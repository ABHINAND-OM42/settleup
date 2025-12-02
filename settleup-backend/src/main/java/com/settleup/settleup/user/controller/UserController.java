package com.settleup.settleup.user.controller;

import com.settleup.settleup.user.dto.PasswordResetDto;
import com.settleup.settleup.user.dto.UserRegisterDto;
import com.settleup.settleup.user.dto.UserLoginDto;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.dto.UserUpdateDto;
import com.settleup.settleup.user.service.UserService;
import com.settleup.settleup.shared.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponseDto>> register(@Valid @RequestBody UserRegisterDto dto) {
        UserResponseDto response = userService.registerUser(dto);
        return ResponseEntity.ok(ApiResponse.success(response, "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponseDto>> login(@Valid @RequestBody UserLoginDto dto) {
        UserResponseDto response = userService.login(dto);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getUsers(
            @RequestParam(required = false) String query) {

        List<UserResponseDto> users = userService.searchUsers(query);
        return ResponseEntity.ok(ApiResponse.success(users, "Users fetched successfully"));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UserUpdateDto dto) {

        UserResponseDto response = userService.updateUser(userId, dto);
        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody PasswordResetDto dto) {
        userService.resetPassword(dto);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }
}