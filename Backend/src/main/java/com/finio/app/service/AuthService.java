package com.finio.app.service;

import com.finio.app.dto.AuthResponse;
import com.finio.app.dto.LoginRequest;
import com.finio.app.dto.RegisterRequest;
import com.finio.app.entity.User;
import com.finio.app.repository.UserRepository;
import com.finio.app.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtService            jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService          emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager,
                       EmailService emailService) {
        this.userRepository        = userRepository;
        this.passwordEncoder       = passwordEncoder;
        this.jwtService            = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService          = emailService;
    }

    // ── Register ─────────────────────────────────────────────────────────────
    // Step 1: Save the user, then send OTP for email verification.
    // Does NOT return a JWT yet — user must verify OTP first.

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already registered: " + request.email());
        }
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
        userRepository.save(user);

        // Send OTP for email verification
        sendOtpToUser(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    // Step 1: Verify email + password. If correct, send OTP.
    // Does NOT return a JWT yet — user must verify OTP first.

    public void login(LoginRequest request) {
        // This throws if credentials are wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Credentials are correct — now send OTP
        sendOtpToUser(user);
    }

    // ── Shared OTP sender ─────────────────────────────────────────────────────

    private void sendOtpToUser(User user) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setLoginOtp(passwordEncoder.encode(otp));
        user.setLoginOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendLoginOtp(user.getEmail(), user.getName(), otp);
    }

    // ── OTP Verify ────────────────────────────────────────────────────────────
    // Step 2 (for both login and register): verify OTP → return JWT.

    public AuthResponse verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with that email."));

        if (user.getLoginOtp() == null || user.getLoginOtpExpiry() == null) {
            throw new RuntimeException("No OTP was requested for this account.");
        }
        if (LocalDateTime.now().isAfter(user.getLoginOtpExpiry())) {
            throw new RuntimeException("OTP has expired. Please try again.");
        }
        if (!passwordEncoder.matches(otp, user.getLoginOtp())) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // Clear OTP so it can't be reused
        user.setLoginOtp(null);
        user.setLoginOtpExpiry(null);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token).name(user.getName())
                .email(user.getEmail()).userId(user.getId())
                .build();
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with that email."));
        sendOtpToUser(user);
    }

    // ── Forgot / Reset Password ──────────────────────────────────────────────

    public void sendPasswordResetLink(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);
            emailService.sendPasswordResetLink(email, user.getName(), token);
        });
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link."));

        if (LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}