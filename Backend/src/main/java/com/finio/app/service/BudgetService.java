package com.finio.app.service;

import com.finio.app.dto.BudgetRequest;
import com.finio.app.dto.BudgetResponse;
import com.finio.app.entity.Budget;
import com.finio.app.entity.User;
import com.finio.app.repository.BudgetRepository;
import com.finio.app.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository      budgetRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, TransactionRepository transactionRepository) {
        this.budgetRepository      = budgetRepository;
        this.transactionRepository = transactionRepository;
    }

    public BudgetResponse create(BudgetRequest req, User user) {
        Budget budget = Budget.builder()
                .user(user).category(req.category()).limit(req.limit())
                .month(req.month()).year(req.year()).build();
        return BudgetResponse.from(budgetRepository.save(budget), BigDecimal.ZERO);
    }

    public List<BudgetResponse> getForMonth(User user, int month, int year) {
        return budgetRepository.findByUserIdAndMonthAndYear(user.getId(), month, year)
                .stream()
                .map(b -> BudgetResponse.from(b, calcSpent(user.getId(), b.getCategory(), month, year)))
                .toList();
    }

    public List<BudgetResponse> getAll(User user) {
        return budgetRepository.findByUserId(user.getId())
                .stream()
                .map(b -> BudgetResponse.from(b, calcSpent(user.getId(), b.getCategory(), b.getMonth(), b.getYear())))
                .toList();
    }

    public BudgetResponse update(Long id, BudgetRequest req, User user) {
        Budget b = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!b.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        b.setCategory(req.category()); b.setLimit(req.limit());
        b.setMonth(req.month()); b.setYear(req.year());
        Budget saved = budgetRepository.save(b);
        return BudgetResponse.from(saved, calcSpent(user.getId(), saved.getCategory(), saved.getMonth(), saved.getYear()));
    }

    public void delete(Long id, User user) {
        Budget b = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!b.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        budgetRepository.delete(b);
    }

    private BigDecimal calcSpent(Long userId, String category, int month, int year) {
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());
        return transactionRepository.sumExpenseByUserIdAndCategoryAndDateBetween(userId, category, from, to);
    }
}
