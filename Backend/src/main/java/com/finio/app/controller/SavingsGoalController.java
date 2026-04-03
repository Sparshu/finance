package com.finio.app.controller;

import com.finio.app.dto.SavingsGoalRequest;
import com.finio.app.dto.SavingsGoalResponse;
import com.finio.app.entity.User;
import com.finio.app.service.SavingsGoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class SavingsGoalController {

    private final SavingsGoalService goalService;

    public SavingsGoalController(SavingsGoalService goalService) {
        this.goalService = goalService;
    }

    @PostMapping
    public ResponseEntity<SavingsGoalResponse> create(@Valid @RequestBody SavingsGoalRequest request,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.create(request, user));
    }

    @GetMapping
    public ResponseEntity<List<SavingsGoalResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.getAll(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody SavingsGoalRequest request,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.update(id, request, user));
    }

    @PatchMapping("/{id}/add")
    public ResponseEntity<SavingsGoalResponse> addSaving(@PathVariable Long id,
                                                         @RequestParam BigDecimal amount,
                                                         @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.addSaving(id, amount, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        goalService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
