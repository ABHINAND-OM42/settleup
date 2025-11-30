package com.settleup.settleup.group.entity;

import com.settleup.settleup.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "expense_groups") // 'groups' is a reserved SQL keyword
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "group_seq_gen")
    @SequenceGenerator(name = "group_seq_gen", sequenceName = "group_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // RELATIONSHIP: Group has many Members
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "group_members",
            joinColumns = @JoinColumn(name = "group_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> members = new HashSet<>();

    // ... existing imports

    // ADD THIS FIELD
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id") // New Column
    private User createdBy;
}