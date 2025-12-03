package com.settleup.settleup.user;

import com.settleup.settleup.exception.InvalidInputException;
import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.user.dto.PasswordResetDto;
import com.settleup.settleup.user.dto.UserLoginDto;
import com.settleup.settleup.user.dto.UserRegisterDto;
import com.settleup.settleup.user.dto.UserResponseDto;
import com.settleup.settleup.user.dto.UserUpdateDto;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import com.settleup.settleup.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void registerUser_Success(){
        UserRegisterDto dto = new UserRegisterDto();

        dto.setName("Test User");
        dto.setEmail("test@example.com");
        dto.setMobileNumber("1234567890");
        dto.setPassword("password");

        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setName("Test User");
        savedUser.setEmail("test@example.com");
        savedUser.setMobileNumber("1234567890");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByMobileNumber(anyString())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(savedUser);
        UserResponseDto response = userService.registerUser(dto);
        assertNotNull(response);
        assertEquals("Test User", response.getName());
        assertEquals("test@example.com", response.getEmail());
        verify(userRepository, times(1)).save(any());
    }

    @Test
    void registerUserDuplicateEmailThrowsException(){
        UserRegisterDto dto = new UserRegisterDto();
        dto.setEmail("existin@example.com");
        when(userRepository.existsByEmail("existin@example.com")).thenReturn(true);
        assertThrows(InvalidInputException.class, () -> userService.registerUser(dto));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUserDuplicateMobileThrowsException(){
        UserRegisterDto dto = new UserRegisterDto();
        dto.setMobileNumber("1234567890");
        when(userRepository.existsByMobileNumber("1234567890")).thenReturn(true);
        assertThrows(InvalidInputException.class, () -> userService.registerUser(dto));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void successFullUserLogin(){
        String identifier = "test@example.com";
        String password = "password123";
        String encodedPassword = "encodedPassword";
        UserLoginDto loginDto = new UserLoginDto();
        loginDto.setIdentifier(identifier);
        loginDto.setPassword(password);

        User userFormDb = new User();
        userFormDb.setId(1L);
        userFormDb.setEmail(identifier);
        userFormDb.setPassword(encodedPassword);
        userFormDb.setName("Test User");

        when(userRepository.findByEmailOrMobileNumber(identifier,identifier))
                .thenReturn(Optional.of(userFormDb));
        when(passwordEncoder.matches(password, encodedPassword)).thenReturn(true);

        UserResponseDto responseDto = userService.login(loginDto);
        assertNotNull(responseDto);
        assertEquals(identifier,responseDto.getEmail());
        assertEquals(1L, responseDto.getId());
        verify(userRepository).findByEmailOrMobileNumber(identifier, identifier);
    }

    @Test
    void loginUserNotFoundThrowException(){
        String identifier = "Test User";
        UserLoginDto dto = new UserLoginDto();
        dto.setIdentifier(identifier);
        dto.setPassword("anypass");

        when(userRepository.findByEmailOrMobileNumber(identifier, identifier)).thenReturn(Optional.empty());
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> userService.login(dto));
        assertEquals("User not found with identifier: " + identifier, exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void LoginInvalidPasswordThrowException(){
        String identifier = "test@example.com";
        String rawPassword = "wrongPassword";
        String encodedPassword = "actual_encoded_password";

        UserLoginDto dto = new UserLoginDto();
        dto.setIdentifier(identifier);
        dto.setPassword(rawPassword);

        User userFormDb = new User();

        userFormDb.setMobileNumber(identifier);
        userFormDb.setPassword(encodedPassword);

        when(userRepository.findByEmailOrMobileNumber(identifier, identifier))
                .thenReturn(Optional.of(userFormDb));
        when(passwordEncoder.matches(rawPassword, encodedPassword)).thenReturn(false);
        InvalidInputException exception = assertThrows(InvalidInputException.class,
                () -> userService.login(dto));

        assertEquals("Invalid password", exception.getMessage());
        verify(userRepository).findByEmailOrMobileNumber(identifier, identifier);
        verify(passwordEncoder, times(1)).matches(rawPassword, encodedPassword);
    }

    @Test
    void searchUsersWithQuery(){
        String query = "Alice";
        User u1 = User.builder().id(1L).name("Alice").build();
        User u2 = User.builder().id(2L).name("Alice Smith").build();

        when(userRepository.findByNameContainingIgnoreCaseOrMobileNumberContaining(query, query))
                .thenReturn(Arrays.asList(u1, u2));
        List<UserResponseDto> results = userService.searchUsers(query);

        assertEquals(2,results.size());
        assertEquals("Alice", results.get(0).getName());
    }


    @Test
    void updateUserSuccess(){
        Long userId = 1L;
        User existingUser = new User();
        existingUser.setName("Old Name");
        existingUser.setEmail("old@example.com");
        existingUser.setMobileNumber("1111111111");

        UserUpdateDto updateDto = new UserUpdateDto();
        updateDto.setName("New Name");
        updateDto.setEmail("new@example.com");
        updateDto.setMobileNumber("2222222222");

        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByMobileNumber("2222222222")).thenReturn(false);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserResponseDto result = userService.updateUser(userId, updateDto);

        assertNotNull(result);
        assertEquals("New Name", result.getName());
        assertEquals("new@example.com", result.getEmail());
        assertEquals("2222222222", result.getMobileNumber());
    }

    @Test
    void resetPasswordSuccess(){

        String email = "reset@example.com";
        String mobile = "9876543210";
        String newPass = "newPassword123";
        String encodedPass = "encoded_new_pass";

        PasswordResetDto dto = new PasswordResetDto();
        dto.setEmail(email);
        dto.setMobileNumber(mobile);
        dto.setNewPassword(newPass);
        dto.setConfirmPassword(newPass);

        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setPassword("old_password");

        when(userRepository.findByEmailAndMobileNumber(email, mobile))
                .thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode(newPass)).thenReturn(encodedPass);
        userService.resetPassword(dto);
        assertEquals(encodedPass, existingUser.getPassword());
    }


}
