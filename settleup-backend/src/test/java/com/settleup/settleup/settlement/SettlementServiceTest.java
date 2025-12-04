package com.settleup.settleup.settlement;

import com.settleup.settleup.exception.ResourceNotFoundException;
import com.settleup.settleup.group.entity.Group;
import com.settleup.settleup.group.repository.GroupRepository;
import com.settleup.settleup.settlement.dto.SettlementDto;
import com.settleup.settleup.settlement.entity.Settlement;
import com.settleup.settleup.settlement.repository.SettlementRepository;
import com.settleup.settleup.settlement.service.SettlementService;
import com.settleup.settleup.user.entity.User;
import com.settleup.settleup.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SettlementServiceTest {

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SettlementService settlementService;

    @Test
    void addSettlementSuccess() {
        Long groupId = 10L;
        Long payerId = 1L;
        Long payeeId = 2L;
        Double amount = 500.0;

        SettlementDto dto = new SettlementDto();
        dto.setGroupId(groupId);
        dto.setPayerId(payerId);
        dto.setPayeeId(payeeId);
        dto.setAmount(amount);

        Group group = Group.builder().id(groupId).name("Trip").build();
        User payer = User.builder().id(payerId).name("Bob").build();
        User payee = User.builder().id(payeeId).name("Alice").build();

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(userRepository.findById(payerId)).thenReturn(Optional.of(payer));
        when(userRepository.findById(payeeId)).thenReturn(Optional.of(payee));

        settlementService.addSettlement(dto);
        ArgumentCaptor<Settlement> captor = ArgumentCaptor.forClass(Settlement.class);
        verify(settlementRepository).save(captor.capture());

        Settlement savedSettlement = captor.getValue();
        assertEquals(groupId, savedSettlement.getGroup().getId());
        assertEquals(payerId, savedSettlement.getPayer().getId());
        assertEquals(payeeId, savedSettlement.getPayee().getId());
        assertEquals(amount, savedSettlement.getAmount());
    }

    @Test
    void addSettlementPayerNotFoundThrowsException() {
        SettlementDto dto = new SettlementDto();
        dto.setGroupId(1L);
        dto.setPayerId(99L);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(new Group()));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                settlementService.addSettlement(dto)
        );
        assertEquals("Payer not found", ex.getMessage());
    }

    @Test
    void addSettlementPayeeNotFoundThrowsException() {
        SettlementDto dto = new SettlementDto();
        dto.setGroupId(1L);
        dto.setPayerId(2L);
        dto.setPayeeId(99L);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(new Group()));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                settlementService.addSettlement(dto)
        );
        assertEquals("Payee not found", ex.getMessage());
    }
}
