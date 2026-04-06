package com.finio.app.controller;

import com.finio.app.dto.RecurringTransactionRequest;
import com.finio.app.dto.RecurringTransactionResponse;
import com.finio.app.entity.User;
import com.finio.app.service.RecurringTransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
public class RecurringTransactionController {

    private final RecurringTransactionService service;

    public RecurringTransactionController(RecurringTransactionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RecurringTransactionResponse> create(
            @Valid @RequestBody RecurringTransactionRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(req, user));
    }

    @GetMapping
    public ResponseEntity<List<RecurringTransactionResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAll(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringTransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, req, user));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<RecurringTransactionResponse> toggle(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.toggleActive(id, user));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<RecurringTransactionResponse> runNow(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.runNow(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}