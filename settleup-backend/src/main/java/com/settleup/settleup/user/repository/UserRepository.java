package com.settleup.settleup.user.repository;

import com.settleup.settleup.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    boolean existsByMobileNumber(String mobileNumber);

    Optional<User> findByEmailOrMobileNumber(String email, String mobileNumber);

    List<User> findByNameContainingIgnoreCaseOrMobileNumberContaining(String name, String mobile);

    Optional<User> findByEmailAndMobileNumber(String email, String mobileNumber);
}