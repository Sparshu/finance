package com.finio.app.service;

import com.finio.app.dto.BillRequest;
import com.finio.app.dto.BillResponse;
import com.finio.app.entity.Bill;
import com.finio.app.entity.Bill.BillStatus;
import com.finio.app.entity.User;
import com.finio.app.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;

    public BillResponse create(BillRequest req, User user) {
        Bill bill = Bill.builder()
                .user(user)
                .name(req.getName())
                .icon(req.getIcon())
                .amount(req.getAmount())
                .dueDay(req.getDueDay())
                .status(req.getStatus() != null ? req.getStatus() : BillStatus.UPCOMING)
                .build();
        return BillResponse.from(billRepository.save(bill));
    }

    public List<BillResponse> getAll(User user) {
        return billRepository.findByUserIdOrderByDueDayAsc(user.getId())
                .stream().map(BillResponse::from).toList();
    }

    public List<BillResponse> getByStatus(User user, BillStatus status) {
        return billRepository.findByUserIdAndStatus(user.getId(), status)
                .stream().map(BillResponse::from).toList();
    }

    public BillResponse update(Long id, BillRequest req, User user) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!bill.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");

        bill.setName(req.getName());
        bill.setIcon(req.getIcon());
        bill.setAmount(req.getAmount());
        bill.setDueDay(req.getDueDay());
        if (req.getStatus() != null) bill.setStatus(req.getStatus());
        return BillResponse.from(billRepository.save(bill));
    }

    public BillResponse markAsPaid(Long id, User user) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!bill.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        bill.setStatus(BillStatus.PAID);
        return BillResponse.from(billRepository.save(bill));
    }

    public void delete(Long id, User user) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!bill.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        billRepository.delete(bill);
    }
}
