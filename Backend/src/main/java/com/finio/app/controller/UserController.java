package com.finio.app.controller;

import com.finio.app.dto.AuthResponse;
import com.finio.app.dto.ChangePasswordRequest;
import com.finio.app.dto.UpdateProfileRequest;
import com.finio.app.entity.User;
import com.finio.app.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                AuthResponse.builder()
                        .token(null)
                        .name(user.getName())
                        .email(user.getEmail())
                        .userId(user.getId())
                        .build()
        );
    }

    @PatchMapping("/me")
    public ResponseEntity<AuthResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.updateProfile(request, user));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User user) {
        userService.changePassword(request, user);
        return ResponseEntity.noContent().build();
    }
}