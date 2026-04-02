package com.finio.app.service;

import com.finio.app.dto.BudgetRequest;
import com.finio.app.dto.BudgetResponse;
import com.finio.app.entity.Budget;
import com.finio.app.entity.Transaction.TransactionType;
import com.finio.app.entity.User;
import com.finio.app.repository.BudgetRepository;
import com.finio.app.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository      budgetRepository;
    private final TransactionRepository transactionRepository;

    public BudgetResponse create(BudgetRequest req, User user) {
        Budget budget = Budget.builder()
                .user(user)
                .category(req.getCategory())
                .limit(req.getLimit())
                .month(req.getMonth())
                .year(req.getYear())
                .build();
        Budget saved = budgetRepository.save(budget);
        return BudgetResponse.from(saved, BigDecimal.ZERO);
    }

    public List<BudgetResponse> getForMonth(User user, int month, int year) {
        return budgetRepository
                .findByUserIdAndMonthAndYear(user.getId(), month, year)
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
        if (!b.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");

        b.setCategory(req.getCategory());
        b.setLimit(req.getLimit());
        b.setMonth(req.getMonth());
        b.setYear(req.getYear());
        Budget saved = budgetRepository.save(b);
        return BudgetResponse.from(saved, calcSpent(user.getId(), saved.getCategory(), saved.getMonth(), saved.getYear()));
    }

    public void delete(Long id, User user) {
        Budget b = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!b.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        budgetRepository.delete(b);
    }

    // ── Helper: sum expenses for a category in a given month/year ────────
    private BigDecimal calcSpent(Long userId, String category, int month, int year) {
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());
        return transactionRepository.sumExpenseByUserIdAndCategoryAndDateBetween(userId, category, from, to);
    }
}
