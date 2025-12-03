package com.settleup.settleup.user.service;

import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.user.dto.PasswordResetDto;
import com.settleup.settleup.user.dto.UserLoginDto;
import com.settleup.settleup.user.dto.UserRegisterDto;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.dto.UserUpdateDto;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // REGISTER USER
    public UserResponseDto registerUser(UserRegisterDto dto) {

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new InvalidInputException("User with this email already exists");
        }
        if (userRepository.existsByMobileNumber(dto.getMobileNumber())) {
            throw new InvalidInputException("User with this mobile number already exists");
        }

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .mobileNumber(dto.getMobileNumber())
                .password(passwordEncoder.encode(dto.getPassword())) // <--- Hashing here
                .build();

        User savedUser = userRepository.save(user);

        return mapToResponse(savedUser);
    }

    public UserResponseDto login(UserLoginDto dto) {
        User user = userRepository.findByEmailOrMobileNumber(dto.getIdentifier(), dto.getIdentifier())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + dto.getIdentifier()));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new InvalidInputException("Invalid password");
        }

        return mapToResponse(user);
    }

    public List<UserResponseDto> searchUsers(String query) {
        List<User> users;

        if (query == null || query.isBlank()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.findByNameContainingIgnoreCaseOrMobileNumberContaining(query, query);
        }

        return users.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public java.util.List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    public UserResponseDto updateUser(Long userId, UserUpdateDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equals(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new InvalidInputException("Email already in use by another account");
        }

        if (!user.getMobileNumber().equals(dto.getMobileNumber()) && userRepository.existsByMobileNumber(dto.getMobileNumber())) {
            throw new InvalidInputException("Mobile number already in use by another account");
        }

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setMobileNumber(dto.getMobileNumber());

        User updatedUser = userRepository.save(user);

        return mapToResponse(updatedUser);
    }

    private UserResponseDto mapToResponse(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getMobileNumber()
        );
    }

    public void resetPassword(PasswordResetDto dto) {
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new InvalidInputException("New Password and Confirm Password do not match.");
        }

        User user = userRepository.findByEmailAndMobileNumber(dto.getEmail(), dto.getMobileNumber())
                .orElseThrow(() -> new InvalidInputException("No account found with this Email and Mobile number."));

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));

        userRepository.save(user);
    }
}