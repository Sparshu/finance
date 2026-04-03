package com.finio.app.dto;

public record AuthResponse(String token, String name, String email, Long userId) {
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private String token, name, email; private Long userId;
        public Builder token(String token)    { this.token = token; return this; }
        public Builder name(String name)      { this.name = name; return this; }
        public Builder email(String email)    { this.email = email; return this; }
        public Builder userId(Long userId)    { this.userId = userId; return this; }
        public AuthResponse build()           { return new AuthResponse(token, name, email, userId); }
    }
}
