package com.settleup.settleup.settlement.service;

import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.settlement.dto.SettlementDto;
import com.settleup.settleup.settlement.entity.Settlement;
import com.settleup.settleup.settlement.repository.SettlementRepository;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public void addSettlement(SettlementDto dto) {
        // 1. Validate existence
        Group group = groupRepository.findById(dto.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        User payer = userRepository.findById(dto.getPayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Payer not found"));
        User payee = userRepository.findById(dto.getPayeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Payee not found"));

        // 2. Save Settlement
        Settlement settlement = Settlement.builder()
                .group(group)
                .payer(payer)
                .payee(payee)
                .amount(dto.getAmount())
                .build();

        settlementRepository.save(settlement);
    }
}