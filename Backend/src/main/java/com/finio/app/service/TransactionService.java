package com.finio.app.service;

import com.finio.app.dto.TransactionRequest;
import com.finio.app.dto.TransactionResponse;
import com.finio.app.entity.Budget;
import com.finio.app.entity.Transaction;
import com.finio.app.entity.Transaction.TransactionType;
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
import java.util.Optional;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final BudgetRepository      budgetRepository;
    private final EmailService          emailService;

    public TransactionService(TransactionRepository transactionRepository,
                               BudgetRepository budgetRepository,
                               EmailService emailService) {
        this.transactionRepository = transactionRepository;
        this.budgetRepository      = budgetRepository;
        this.emailService          = emailService;
    }

    public TransactionResponse create(TransactionRequest req, User user) {
        Transaction tx = Transaction.builder()
                .user(user).name(req.name()).amount(req.amount()).type(req.type())
                .category(req.category()).date(req.date()).note(req.note()).build();
        TransactionResponse saved = TransactionResponse.from(transactionRepository.save(tx));

        // ── Instant budget overspend check ────────────────────────────────────
        // Only relevant for EXPENSE transactions
        if (req.type() == TransactionType.EXPENSE) {
            checkBudgetOverspend(user, req.category(), req.date());
        }

        return saved;
    }

    public List<TransactionResponse> getAll(User user) {
        return transactionRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream().map(TransactionResponse::from).toList();
    }

    public List<TransactionResponse> getByType(User user, TransactionType type) {
        return transactionRepository.findByUserIdAndTypeOrderByDateDesc(user.getId(), type)
                .stream().map(TransactionResponse::from).toList();
    }

    public List<TransactionResponse> getByDateRange(User user, LocalDate from, LocalDate to) {
        return transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), from, to)
                .stream().map(TransactionResponse::from).toList();
    }

    public TransactionResponse update(Long id, TransactionRequest req, User user) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!tx.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        tx.setName(req.name()); tx.setAmount(req.amount()); tx.setType(req.type());
        tx.setCategory(req.category()); tx.setDate(req.date()); tx.setNote(req.note());
        TransactionResponse updated = TransactionResponse.from(transactionRepository.save(tx));

        // Re-check budget on update too (amount or category may have changed)
        if (req.type() == TransactionType.EXPENSE) {
            checkBudgetOverspend(user, req.category(), req.date());
        }

        return updated;
    }

    public void delete(Long id, User user) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!tx.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        transactionRepository.delete(tx);

        // After deleting an expense, re-evaluate the budget —
        // if spending is now back under the limit, reset the alert so it fires again next time
        if (tx.getType() == TransactionType.EXPENSE) {
            resetBudgetAlertIfUnder(user, tx.getCategory(), tx.getDate());
        }
    }

    // ── Budget overspend check ────────────────────────────────────────────────

    private void checkBudgetOverspend(User user, String category, LocalDate txDate) {
        int month = txDate.getMonthValue();
        int year  = txDate.getYear();

        String normalizedCategory = category.trim();

        log.debug("Checking budget for user={} category='{}' month={} year={}",
                user.getId(), normalizedCategory, month, year);

        Optional<Budget> budgetOpt = findBudget(user, normalizedCategory, month, year);

        if (budgetOpt.isEmpty()) {
            log.debug("No budget found for category='{}' — skipping alert", normalizedCategory);
            return;
        }

        Budget budget = budgetOpt.get();

        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());

        BigDecimal spent = transactionRepository
                .sumExpenseByUserIdAndCategoryAndDateBetween(user.getId(), budget.getCategory(), from, to);
        if (spent == null) spent = BigDecimal.ZERO;

        log.debug("Budget check: category='{}' spent=₹{} limit=₹{}",
                budget.getCategory(), spent.toPlainString(), budget.getLimit().toPlainString());

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
                log.info("Budget alert sent to {} for category '{}' (spent ₹{} / limit ₹{})",
                        user.getEmail(), budget.getCategory(),
                        spent.toPlainString(), budget.getLimit().toPlainString());
            } catch (Exception e) {
                log.error("Failed to send budget alert: {}", e.getMessage());
            }
        } else if (isOverBudget) {
            log.debug("Budget exceeded but alert suppressed — last sent at {}",
                    budget.getOverspendAlertSentAt());
        }
    }

    // ── Reset alert when spending drops back under limit ─────────────────────
    // Called after a transaction is deleted. If total spent is now under the
    // limit, clear overspendAlertSentAt so the next overspend triggers a fresh alert.

    private void resetBudgetAlertIfUnder(User user, String category, LocalDate txDate) {
        int month = txDate.getMonthValue();
        int year  = txDate.getYear();

        Optional<Budget> budgetOpt = findBudget(user, category.trim(), month, year);
        if (budgetOpt.isEmpty()) return;

        Budget budget = budgetOpt.get();

        // Only reset if alert was previously sent
        if (budget.getOverspendAlertSentAt() == null) return;

        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());

        BigDecimal spent = transactionRepository
                .sumExpenseByUserIdAndCategoryAndDateBetween(user.getId(), budget.getCategory(), from, to);
        if (spent == null) spent = BigDecimal.ZERO;

        // If back under budget, reset the alert timestamp so it fires again on next overspend
        if (spent.compareTo(budget.getLimit()) <= 0) {
            budget.setOverspendAlertSentAt(null);
            budgetRepository.save(budget);
            log.info("Budget alert reset for user={} category='{}' — spending back under limit",
                    user.getId(), budget.getCategory());
        }
    }

    // ── Shared budget lookup (case-insensitive fallback) ──────────────────────

    private Optional<Budget> findBudget(User user, String category, int month, int year) {
        Optional<Budget> budgetOpt = budgetRepository
                .findByUserIdAndCategoryAndMonthAndYear(user.getId(), category, month, year);

        if (budgetOpt.isEmpty()) {
            budgetOpt = budgetRepository
                    .findAllForMonthWithUser(month, year)
                    .stream()
                    .filter(b -> b.getUser().getId().equals(user.getId()))
                    .filter(b -> b.getCategory().equalsIgnoreCase(category))
                    .findFirst();
        }

        return budgetOpt;
    }
}