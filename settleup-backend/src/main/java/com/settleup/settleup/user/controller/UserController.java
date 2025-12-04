package com.settleup.settleup.user.controller;

import com.settleup.settleup.user.dto.PasswordResetDto;
import com.settleup.settleup.user.dto.UserRegisterDto;
import com.settleup.settleup.user.dto.UserLoginDto;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.dto.UserUpdateDto;
import com.settleup.settleup.user.service.UserService;
import com.settleup.settleup.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponseDto>> register(@Valid @RequestBody UserRegisterDto dto) {
        log.info("Request received to register user with email: {}", dto.getEmail());
        UserResponseDto response = userService.registerUser(dto);
        log.info("User registered successfully. User ID: {}", response.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponseDto>> login(@Valid @RequestBody UserLoginDto dto) {
        log.info("Login request received for email: {}", dto.getIdentifier());
        UserResponseDto response = userService.login(dto);
        log.info("Login successful for user ID: {}", response.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getUsers(
            @RequestParam(required = false) String query) {
        log.info("Request received to search users. Query parameter: '{}'", query);
        List<UserResponseDto> users = userService.searchUsers(query);
        log.info("Search completed. Found {} users", users.size());
        return ResponseEntity.ok(ApiResponse.success(users, "Users fetched successfully"));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UserUpdateDto dto) {
        log.info("Request received to update profile for User ID: {}", userId);
        UserResponseDto response = userService.updateUser(userId, dto);
        log.info("Profile updated successfully for User ID: {}", userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody PasswordResetDto dto) {
        log.info("Password reset requested for email: {}", dto.getEmail());
        userService.resetPassword(dto);
        log.info("Password reset operation completed successfully for email: {}", dto.getEmail());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }
}