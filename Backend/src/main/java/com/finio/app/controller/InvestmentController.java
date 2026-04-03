package com.finio.app.controller;

import com.finio.app.dto.InvestmentRequest;
import com.finio.app.dto.InvestmentResponse;
import com.finio.app.entity.User;
import com.finio.app.service.InvestmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    private final InvestmentService investmentService;

    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @PostMapping
    public ResponseEntity<InvestmentResponse> create(@Valid @RequestBody InvestmentRequest request,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.create(request, user));
    }

    @GetMapping
    public ResponseEntity<List<InvestmentResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.getAll(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestmentResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody InvestmentRequest request,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.update(id, request, user));
    }

    @PatchMapping("/{id}/price")
    public ResponseEntity<InvestmentResponse> updatePrice(@PathVariable Long id,
                                                          @RequestParam BigDecimal currentPrice,
                                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.updatePrice(id, currentPrice, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        investmentService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
