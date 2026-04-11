package com.finio.app.repository;

import com.finio.app.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);
    List<Budget> findByUserId(Long userId);
    Optional<Budget> findByUserIdAndCategoryAndMonthAndYear(Long userId, String category, Integer month, Integer year);
    void deleteByUserId(Long userId);

    // Used by the scheduler — fetch all budgets for a given month/year with user eagerly loaded
    @Query("SELECT b FROM Budget b JOIN FETCH b.user WHERE b.month = :month AND b.year = :year")
    List<Budget> findAllForMonthWithUser(@Param("month") int month, @Param("year") int year);
}