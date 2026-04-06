package com.finio.app.controller;

import com.finio.app.dto.NetWorthRequest;
import com.finio.app.dto.NetWorthResponse;
import com.finio.app.entity.User;
import com.finio.app.service.NetWorthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}