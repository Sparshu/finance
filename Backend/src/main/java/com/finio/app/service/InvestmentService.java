package com.finio.app.service;

import com.finio.app.dto.InvestmentRequest;
import com.finio.app.dto.InvestmentResponse;
import com.finio.app.entity.Investment;
import com.finio.app.entity.User;
import com.finio.app.repository.InvestmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InvestmentService {

    private final InvestmentRepository investmentRepository;

    public InvestmentService(InvestmentRepository investmentRepository) {
        this.investmentRepository = investmentRepository;
    }

    public InvestmentResponse create(InvestmentRequest req, User user) {
        Investment inv = Investment.builder()
                .user(user).ticker(req.ticker().toUpperCase()).name(req.name())
                .quantity(req.quantity()).buyPrice(req.buyPrice())
                .currentPrice(req.currentPrice()).purchaseDate(req.purchaseDate()).build();
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public List<InvestmentResponse> getAll(User user) {
        return investmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(InvestmentResponse::from).toList();
    }

    public InvestmentResponse update(Long id, InvestmentRequest req, User user) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        inv.setTicker(req.ticker().toUpperCase()); inv.setName(req.name());
        inv.setQuantity(req.quantity()); inv.setBuyPrice(req.buyPrice());
        inv.setCurrentPrice(req.currentPrice()); inv.setPurchaseDate(req.purchaseDate());
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public InvestmentResponse updatePrice(Long id, BigDecimal currentPrice, User user) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        inv.setCurrentPrice(currentPrice);
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public void delete(Long id, User user) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        if (!inv.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        investmentRepository.delete(inv);
    }
}
