package com.finio.app.repository;

import com.finio.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByResetToken(String resetToken);

    // Find unverified accounts created before a certain time (for cleanup)
    @Query("SELECT u FROM User u WHERE u.verified = false AND u.createdAt < :cutoff")
    List<User> findUnverifiedBefore(@Param("cutoff") LocalDateTime cutoff);
}