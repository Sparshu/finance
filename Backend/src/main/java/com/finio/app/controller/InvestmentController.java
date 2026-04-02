package com.finio.app.controller;

import com.finio.app.dto.InvestmentRequest;
import com.finio.app.dto.InvestmentResponse;
import com.finio.app.entity.User;
import com.finio.app.service.InvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentService investmentService;

    // POST /api/investments
    @PostMapping
    public ResponseEntity<InvestmentResponse> create(
            @Valid @RequestBody InvestmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.create(request, user));
    }

    // GET /api/investments
    @GetMapping
    public ResponseEntity<List<InvestmentResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.getAll(user));
    }

    // PUT /api/investments/{id}
    @PutMapping("/{id}")
    public ResponseEntity<InvestmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InvestmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.update(id, request, user));
    }

    // PATCH /api/investments/{id}/price?currentPrice=3200
    @PatchMapping("/{id}/price")
    public ResponseEntity<InvestmentResponse> updatePrice(
            @PathVariable Long id,
            @RequestParam BigDecimal currentPrice,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(investmentService.updatePrice(id, currentPrice, user));
    }

    // DELETE /api/investments/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        investmentService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
