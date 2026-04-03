package com.finio.app.service;

import com.finio.app.dto.BillRequest;
import com.finio.app.dto.BillResponse;
import com.finio.app.entity.Bill;
import com.finio.app.entity.Bill.BillStatus;
import com.finio.app.entity.User;
import com.finio.app.repository.BillRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BillService {

    private final BillRepository billRepository;

    public BillService(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    public BillResponse create(BillRequest req, User user) {
        Bill bill = Bill.builder()
                .user(user).name(req.name()).icon(req.icon()).amount(req.amount())
                .dueDay(req.dueDay()).status(req.status() != null ? req.status() : BillStatus.UPCOMING)
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
        if (!bill.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        bill.setName(req.name()); bill.setIcon(req.icon());
        bill.setAmount(req.amount()); bill.setDueDay(req.dueDay());
        if (req.status() != null) bill.setStatus(req.status());
        return BillResponse.from(billRepository.save(bill));
    }

    public BillResponse markAsPaid(Long id, User user) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!bill.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        bill.setStatus(BillStatus.PAID);
        return BillResponse.from(billRepository.save(bill));
    }

    public void delete(Long id, User user) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!bill.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        billRepository.delete(bill);
    }
}
