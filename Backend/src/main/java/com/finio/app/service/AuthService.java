package com.finio.app.service;

import com.finio.app.dto.AuthResponse;
import com.finio.app.dto.LoginRequest;
import com.finio.app.dto.RegisterRequest;
import com.finio.app.entity.User;
import com.finio.app.repository.UserRepository;
import com.finio.app.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

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

    // ── Register ──────────────────────────────────────────────────────────────

    public void register(RegisterRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(existing -> {
            if (existing.isVerified()) {
                throw new RuntimeException("This email is already registered. Please log in instead.");
            }
            // Unverified account exists — delete it so they can re-register cleanly
            userRepository.delete(existing);
        });

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
        userRepository.save(user);

        // If OTP email fails, delete the user so they are not stuck
        try {
            sendOtpToUser(user);
        } catch (Exception e) {
            log.error("OTP email failed for {}, deleting unverified user: {}", request.email(), e.getMessage());
            userRepository.delete(user);
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public void login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isVerified()) {
            try {
                sendOtpToUser(user);
            } catch (Exception e) {
                throw new RuntimeException("Failed to send OTP. Please try again.");
            }
            throw new RuntimeException("Your email is not verified yet. A new OTP has been sent — please check your inbox.");
        }

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

        user.setVerified(true);
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

    // ── Cleanup unverified accounts every hour ────────────────────────────────
    // Deletes unverified accounts older than 30 minutes to keep the DB clean.

    @Scheduled(fixedRate = 3600000)
    public void cleanupUnverifiedAccounts() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        List<User> stale = userRepository.findUnverifiedBefore(cutoff);
        if (!stale.isEmpty()) {
            userRepository.deleteAll(stale);
            log.info("Cleaned up {} unverified accounts older than 30 minutes", stale.size());
        }
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