package com.finio.app.controller;

import com.finio.app.dto.AuthResponse;
import com.finio.app.dto.LoginRequest;
import com.finio.app.dto.RegisterRequest;
import com.finio.app.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ── Register (Step 1) ─────────────────────────────────────────────────────
    // Saves user and sends OTP. Returns 200 with a message — no JWT yet.

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + request.email()));
    }

    // ── Login (Step 1) ────────────────────────────────────────────────────────
    // Verifies password. If correct, sends OTP. Returns 200 — no JWT yet.

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        authService.login(request);
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + request.email()));
    }

    // ── OTP Verify (Step 2 — for both login and register) ─────────────────────
    // Verifies OTP and returns JWT on success.

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");
        if (email == null || otp == null) {
            throw new RuntimeException("Email and OTP are required");
        }
        return ResponseEntity.ok(authService.verifyOtp(email.trim().toLowerCase(), otp.trim()));
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────

    @PostMapping("/otp/resend")
    public ResponseEntity<Map<String, String>> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        authService.resendOtp(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("message", "New OTP sent to " + email));
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        authService.sendPasswordResetLink(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("message",
                "If that email is registered, a reset link has been sent."));
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
    ) {}
}