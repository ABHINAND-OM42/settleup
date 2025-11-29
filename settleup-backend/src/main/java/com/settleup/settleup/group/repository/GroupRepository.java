package com.settleup.settleup.group.repository;

import com.settleup.settleup.group.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    // Helper to find all groups a specific user belongs to (for Dashboard)
    List<Group> findByMembers_Id(Long userId);
}