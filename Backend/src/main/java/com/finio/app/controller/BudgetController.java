package com.finio.app.controller;

import com.finio.app.dto.BudgetRequest;
import com.finio.app.dto.BudgetResponse;
import com.finio.app.entity.User;
import com.finio.app.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> create(@Valid @RequestBody BudgetRequest request,
                                                 @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(budgetService.create(request, user));
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAll(@RequestParam(required = false) Integer month,
                                                       @RequestParam(required = false) Integer year,
                                                       @AuthenticationPrincipal User user) {
        if (month != null && year != null) return ResponseEntity.ok(budgetService.getForMonth(user, month, year));
        LocalDate now = LocalDate.now();
        return ResponseEntity.ok(budgetService.getForMonth(user, now.getMonthValue(), now.getYear()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody BudgetRequest request,
                                                 @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(budgetService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        budgetService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
