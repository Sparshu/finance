package com.finio.app.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── OTP Login ──────────────────────────────────────────────────────────────
    @Column(name = "login_otp")
    private String loginOtp;

    @Column(name = "login_otp_expiry")
    private LocalDateTime loginOtpExpiry;

    // ── Forgot Password ────────────────────────────────────────────────────────
    @Column(name = "reset_token", unique = true)
    private String resetToken;

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

    public User() {}

    public User(Long id, String name, String email, String password, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──
    public Long getId()                        { return id; }
    public void setId(Long id)                 { this.id = id; }
    public String getName()                    { return name; }
    public void setName(String name)           { this.name = name; }
    public String getEmail()                   { return email; }
    public void setEmail(String email)         { this.email = email; }
    public void setPassword(String password)   { this.password = password; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
    public void setCreatedAt(LocalDateTime t)  { this.createdAt = t; }

    public String getLoginOtp()                           { return loginOtp; }
    public void setLoginOtp(String loginOtp)              { this.loginOtp = loginOtp; }
    public LocalDateTime getLoginOtpExpiry()              { return loginOtpExpiry; }
    public void setLoginOtpExpiry(LocalDateTime expiry)   { this.loginOtpExpiry = expiry; }

    public String getResetToken()                         { return resetToken; }
    public void setResetToken(String resetToken)          { this.resetToken = resetToken; }
    public LocalDateTime getResetTokenExpiry()            { return resetTokenExpiry; }
    public void setResetTokenExpiry(LocalDateTime expiry) { this.resetTokenExpiry = expiry; }

    // ── UserDetails ──
    @Override public String getPassword()                                      { return password; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities()   { return List.of(); }
    @Override public String getUsername()                                       { return email; }
    @Override public boolean isAccountNonExpired()                             { return true; }
    @Override public boolean isAccountNonLocked()                              { return true; }
    @Override public boolean isCredentialsNonExpired()                         { return true; }
    @Override public boolean isEnabled()                                        { return true; }

    // ── Builder ──
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id;
        private String name, email, password;
        private LocalDateTime createdAt;
        public Builder id(Long id)                { this.id = id; return this; }
        public Builder name(String name)          { this.name = name; return this; }
        public Builder email(String email)        { this.email = email; return this; }
        public Builder password(String password)  { this.password = password; return this; }
        public Builder createdAt(LocalDateTime t) { this.createdAt = t; return this; }
        public User build() { return new User(id, name, email, password, createdAt); }
    }
}