package com.finio.app.service;

import com.finio.app.dto.AuthResponse;
import com.finio.app.dto.ChangePasswordRequest;
import com.finio.app.dto.UpdateProfileRequest;
import com.finio.app.entity.User;
import com.finio.app.repository.UserRepository;
import com.finio.app.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService      = jwtService;
    }

    public AuthResponse updateProfile(UpdateProfileRequest request, User user) {
        user.setName(request.name().trim());
        userRepository.save(user);
        // Return a fresh token + updated info so the frontend can update state
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .userId(user.getId())
                .build();
    }

    public void changePassword(ChangePasswordRequest request, User user) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}