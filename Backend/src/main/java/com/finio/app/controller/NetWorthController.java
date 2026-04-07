package com.finio.app.controller;

import com.finio.app.dto.NetWorthRequest;
import com.finio.app.dto.NetWorthResponse;
import com.finio.app.entity.User;
import com.finio.app.service.NetWorthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/networth")
public class NetWorthController {

    private final NetWorthService service;

    public NetWorthController(NetWorthService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<NetWorthResponse> create(
            @Valid @RequestBody NetWorthRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(req, user));
    }

    @GetMapping
    public ResponseEntity<List<NetWorthResponse>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAll(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NetWorthResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody NetWorthRequest req,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, req, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/networth/rollover-savings?year=2025&month=3
     * Computes last month's net savings (income − expenses) from transactions
     * and upserts a MONTHLY_SAVINGS entry into net worth.
     * year and month are optional; defaults to the previous calendar month.
     */
    @PostMapping("/rollover-savings")
    public ResponseEntity<Map<String, Object>> rolloverSavings(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthenticationPrincipal User user) {
        YearMonth ym = (year != null && month != null) ? YearMonth.of(year, month) : null;
        return ResponseEntity.ok(service.rolloverMonthlySavings(ym, user));
    }
}