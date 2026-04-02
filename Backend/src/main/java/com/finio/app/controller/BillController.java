package com.finio.app.controller;

import com.finio.app.dto.BillRequest;
import com.finio.app.dto.BillResponse;
import com.finio.app.entity.Bill.BillStatus;
import com.finio.app.entity.User;
import com.finio.app.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    // POST /api/bills
    @PostMapping
    public ResponseEntity<BillResponse> create(
            @Valid @RequestBody BillRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(billService.create(request, user));
    }

    // GET /api/bills
    // GET /api/bills?status=DUE
    @GetMapping
    public ResponseEntity<List<BillResponse>> getAll(
            @RequestParam(required = false) BillStatus status,
            @AuthenticationPrincipal User user) {
        if (status != null) {
            return ResponseEntity.ok(billService.getByStatus(user, status));
        }
        return ResponseEntity.ok(billService.getAll(user));
    }

    // PUT /api/bills/{id}
    @PutMapping("/{id}")
    public ResponseEntity<BillResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BillRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(billService.update(id, request, user));
    }

    // PATCH /api/bills/{id}/pay
    @PatchMapping("/{id}/pay")
    public ResponseEntity<BillResponse> markPaid(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(billService.markAsPaid(id, user));
    }

    // DELETE /api/bills/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        billService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
