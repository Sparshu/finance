package com.finio.app.service;

import com.finio.app.dto.InvestmentRequest;
import com.finio.app.dto.InvestmentResponse;
import com.finio.app.entity.Investment;
import com.finio.app.entity.User;
import com.finio.app.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;

    public InvestmentResponse create(InvestmentRequest req, User user) {
        Investment inv = Investment.builder()
                .user(user)
                .ticker(req.getTicker().toUpperCase())
                .name(req.getName())
                .quantity(req.getQuantity())
                .buyPrice(req.getBuyPrice())
                .currentPrice(req.getCurrentPrice())
                .purchaseDate(req.getPurchaseDate())
                .build();
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public List<InvestmentResponse> getAll(User user) {
        return investmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(InvestmentResponse::from).toList();
    }

    public InvestmentResponse update(Long id, InvestmentRequest req, User user) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");

        inv.setTicker(req.getTicker().toUpperCase());
        inv.setName(req.getName());
        inv.setQuantity(req.getQuantity());
        inv.setBuyPrice(req.getBuyPrice());
        inv.setCurrentPrice(req.getCurrentPrice());
        inv.setPurchaseDate(req.getPurchaseDate());
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public InvestmentResponse updatePrice(Long id, java.math.BigDecimal currentPrice, User user) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        inv.setCurrentPrice(currentPrice);
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public void delete(Long id, User user) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        investmentRepository.delete(inv);
    }
}
