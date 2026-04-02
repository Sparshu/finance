package com.finio.app.controller;

import com.finio.app.dto.SavingsGoalRequest;
import com.finio.app.dto.SavingsGoalResponse;
import com.finio.app.entity.User;
import com.finio.app.service.SavingsGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class SavingsGoalController {

    private final SavingsGoalService goalService;

    // POST /api/goals
    @PostMapping
    public ResponseEntity<SavingsGoalResponse> create(
            @Valid @RequestBody SavingsGoalRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.create(request, user));
    }

    // GET /api/goals
    @GetMapping
    public ResponseEntity<List<SavingsGoalResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.getAll(user));
    }

    // PUT /api/goals/{id}
    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SavingsGoalRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.update(id, request, user));
    }

    // PATCH /api/goals/{id}/add?amount=5000
    @PatchMapping("/{id}/add")
    public ResponseEntity<SavingsGoalResponse> addSaving(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.addSaving(id, amount, user));
    }

    // DELETE /api/goals/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        goalService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
