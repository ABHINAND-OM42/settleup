package com.settleup.settleup.user.service;

import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.user.dto.UserLoginDto;
import com.settleup.settleup.user.dto.UserRegisterDto;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.dto.UserUpdateDto;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // Import this
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // DIRECT INSTANTIATION (As requested)
    // We make it 'final' so it's immutable, but initialized immediately so Lombok ignores it in constructor
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // REGISTER USER
    public UserResponseDto registerUser(UserRegisterDto dto) {

        // 1. Check Duplicates
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new InvalidInputException("User with this email already exists");
        }
        if (userRepository.existsByMobileNumber(dto.getMobileNumber())) {
            throw new InvalidInputException("User with this mobile number already exists");
        }

        // 2. Encrypt Password & Save
        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .mobileNumber(dto.getMobileNumber())
                .password(passwordEncoder.encode(dto.getPassword())) // <--- Hashing here
                .build();

        User savedUser = userRepository.save(user);

        return mapToResponse(savedUser);
    }

    // LOGIN USER
    public UserResponseDto login(UserLoginDto dto) {
        // 1. Find User
        User user = userRepository.findByEmailOrMobileNumber(dto.getIdentifier(), dto.getIdentifier())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + dto.getIdentifier()));

        // 2. Check Password (Raw vs Hash)
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new InvalidInputException("Invalid password");
        }

        return mapToResponse(user);
    }



    public List<UserResponseDto> searchUsers(String query) {
        List<User> users;

        // If query is empty/null, find ALL. Else, search by name/mobile.
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

        // 1. Check if new Email is taken by someone else
        if (!user.getEmail().equals(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new InvalidInputException("Email already in use by another account");
        }

        // 2. Check if new Mobile is taken by someone else
        if (!user.getMobileNumber().equals(dto.getMobileNumber()) && userRepository.existsByMobileNumber(dto.getMobileNumber())) {
            throw new InvalidInputException("Mobile number already in use by another account");
        }

        // 3. Update fields
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


}