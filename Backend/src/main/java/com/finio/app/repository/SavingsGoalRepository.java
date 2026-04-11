package com.finio.app.repository;

import com.finio.app.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
    List<SavingsGoal> findByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserId(Long userId);

    // Used by the scheduler — fetch all goals with user eagerly loaded
    @Query("SELECT g FROM SavingsGoal g JOIN FETCH g.user")
    List<SavingsGoal> findAllWithUser();
}