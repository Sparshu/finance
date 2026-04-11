package com.finio.app.service;

import com.finio.app.dto.BudgetRequest;
import com.finio.app.dto.BudgetResponse;
import com.finio.app.entity.Budget;
import com.finio.app.entity.User;
import com.finio.app.repository.BudgetRepository;
import com.finio.app.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BudgetService {

    private static final Logger log = LoggerFactory.getLogger(BudgetService.class);

    private final BudgetRepository      budgetRepository;
    private final TransactionRepository transactionRepository;
    private final EmailService          emailService;

    public BudgetService(BudgetRepository budgetRepository,
                         TransactionRepository transactionRepository,
                         EmailService emailService) {
        this.budgetRepository      = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.emailService          = emailService;
    }

    public BudgetResponse create(BudgetRequest req, User user) {
        Budget budget = Budget.builder()
                .user(user).category(req.category()).limit(req.limit())
                .month(req.month()).year(req.year()).build();
        Budget saved = budgetRepository.save(budget);

        // Immediately check if existing spending already exceeds this new budget
        checkAndAlertIfOverspent(saved, user);

        return BudgetResponse.from(saved, calcSpent(user.getId(), saved.getCategory(), saved.getMonth(), saved.getYear()));
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

        // If the limit was raised, reset the alert so it can fire again if exceeded
        b.setOverspendAlertSentAt(null);

        Budget saved = budgetRepository.save(b);

        // Check immediately after update in case new limit is already exceeded
        checkAndAlertIfOverspent(saved, user);

        return BudgetResponse.from(saved, calcSpent(user.getId(), saved.getCategory(), saved.getMonth(), saved.getYear()));
    }

    public void delete(Long id, User user) {
        Budget b = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        if (!b.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        budgetRepository.delete(b);
    }

    // ── Shared overspend check ────────────────────────────────────────────────

    private void checkAndAlertIfOverspent(Budget budget, User user) {
        BigDecimal spent = calcSpent(user.getId(), budget.getCategory(), budget.getMonth(), budget.getYear());
        if (spent == null) spent = BigDecimal.ZERO;

        boolean isOverBudget = spent.compareTo(budget.getLimit()) > 0;

        if (isOverBudget && budget.shouldSendAlert()) {
            try {
                emailService.sendBudgetOverspendAlert(
                        user.getEmail(),
                        user.getName(),
                        budget.getCategory(),
                        budget.getLimit(),
                        spent
                );
                budget.setOverspendAlertSentAt(LocalDateTime.now());
                budgetRepository.save(budget);
                log.info("Budget alert sent to {} for category '{}' on create/update (spent ₹{} / limit ₹{})",
                        user.getEmail(), budget.getCategory(),
                        spent.toPlainString(), budget.getLimit().toPlainString());
            } catch (Exception e) {
                log.error("Failed to send budget alert on create/update: {}", e.getMessage());
            }
        }
    }

    private BigDecimal calcSpent(Long userId, String category, int month, int year) {
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());
        return transactionRepository.sumExpenseByUserIdAndCategoryAndDateBetween(userId, category, from, to);
    }
}