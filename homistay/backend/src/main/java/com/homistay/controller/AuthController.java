package com.homistay.controller;

import com.homistay.dto.request.*;
import com.homistay.dto.response.AuthResponse;
import com.homistay.dto.response.UserResponse;
import com.homistay.entity.User;
import com.homistay.exception.ResourceNotFoundException;
import com.homistay.repository.UserRepository;
import com.homistay.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Register, Login, Refresh, Profile")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (GUEST or HOST)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(authService.mapToUserResponse(user));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout (client discards token)")
    public ResponseEntity<Void> logout() {
        // JWT is stateless — client just deletes the token
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update current user profile", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("data") @Valid UpdateProfileRequest req,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(authService.updateProfile(userDetails.getUsername(), req, file));
    }

    @PutMapping("/upgrade")
    @Operation(summary = "Upgrade current user from GUEST to HOST", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserResponse> upgradeToHost(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.upgradeToHost(userDetails.getUsername()));
    }

    @PutMapping("/password")
    @Operation(summary = "Change current user password", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(userDetails.getUsername(), req);
        return ResponseEntity.noContent().build();
    }
}
