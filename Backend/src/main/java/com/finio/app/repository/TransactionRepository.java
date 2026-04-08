package com.finio.app.repository;

import com.finio.app.entity.Transaction;
import com.finio.app.entity.Transaction.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByDateDesc(Long userId);

    List<Transaction> findByUserIdAndTypeOrderByDateDesc(Long userId, TransactionType type);

    List<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type")
    BigDecimal sumAmountByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type AND t.date BETWEEN :from AND :to")
    BigDecimal sumAmountByUserIdAndTypeAndDateBetween(@Param("userId") Long userId, @Param("type") TransactionType type, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = 'EXPENSE' AND t.category = :category AND t.date BETWEEN :from AND :to")
    BigDecimal sumExpenseByUserIdAndCategoryAndDateBetween(@Param("userId") Long userId, @Param("category") String category, @Param("from") LocalDate from, @Param("to") LocalDate to);
}