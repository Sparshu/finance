package com.finio.app.service;

import com.finio.app.dto.RecurringTransactionRequest;
import com.finio.app.dto.RecurringTransactionResponse;
import com.finio.app.entity.RecurringTransaction;
import com.finio.app.entity.RecurringTransaction.Frequency;
import com.finio.app.entity.Transaction;
import com.finio.app.entity.User;
import com.finio.app.repository.RecurringTransactionRepository;
import com.finio.app.repository.TransactionRepository;
import com.finio.app.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepo;
    private final TransactionRepository          txRepo;
    private final UserRepository                 userRepo;

    public RecurringTransactionService(RecurringTransactionRepository recurringRepo,
                                       TransactionRepository txRepo,
                                       UserRepository userRepo) {
        this.recurringRepo = recurringRepo;
        this.txRepo        = txRepo;
        this.userRepo      = userRepo;
    }

    public RecurringTransactionResponse create(RecurringTransactionRequest req, User user) {
        RecurringTransaction r = new RecurringTransaction();
        r.setUser(user);
        r.setName(req.name().trim());
        r.setAmount(req.amount());
        r.setType(req.type());
        r.setCategory(req.category());
        r.setFrequency(req.frequency());
        r.setDayOfPeriod(req.dayOfPeriod());
        r.setStartDate(req.startDate());
        r.setEndDate(req.endDate());
        r.setNote(req.note());
        r.setActive(true);
        r.setNextRunDate(req.startDate());
        return RecurringTransactionResponse.from(recurringRepo.save(r));
    }

    public List<RecurringTransactionResponse> getAll(User user) {
        return recurringRepo.findByUserIdOrderByNextRunDateAsc(user.getId())
                .stream().map(RecurringTransactionResponse::from).toList();
    }

    public RecurringTransactionResponse update(Long id, RecurringTransactionRequest req, User user) {
        RecurringTransaction r = getOwned(id, user);
        r.setName(req.name().trim());
        r.setAmount(req.amount());
        r.setType(req.type());
        r.setCategory(req.category());
        r.setFrequency(req.frequency());
        r.setDayOfPeriod(req.dayOfPeriod());
        r.setStartDate(req.startDate());
        r.setEndDate(req.endDate());
        r.setNote(req.note());
        return RecurringTransactionResponse.from(recurringRepo.save(r));
    }

    public RecurringTransactionResponse toggleActive(Long id, User user) {
        RecurringTransaction r = getOwned(id, user);
        r.setActive(!r.isActive());
        return RecurringTransactionResponse.from(recurringRepo.save(r));
    }

    // Manually post a recurring transaction right now
    public RecurringTransactionResponse runNow(Long id, User user) {
        RecurringTransaction r = getOwned(id, user);
        postTransaction(r, LocalDate.now());
        r.setLastRunDate(LocalDate.now());
        r.setNextRunDate(calcNextRunDate(r, LocalDate.now()));
        return RecurringTransactionResponse.from(recurringRepo.save(r));
    }

    public void delete(Long id, User user) {
        recurringRepo.delete(getOwned(id, user));
    }

    // ── Scheduler — runs every day at midnight ────────────────────────────────
    @Scheduled(cron = "0 0 0 * * *")
    public void processRecurring() {
        LocalDate today = LocalDate.now();
        List<RecurringTransaction> due = recurringRepo
                .findByActiveAndNextRunDateLessThanEqual(true, today);

        for (RecurringTransaction r : due) {
            // Skip if end date has passed
            if (r.getEndDate() != null && today.isAfter(r.getEndDate())) {
                r.setActive(false);
                recurringRepo.save(r);
                continue;
            }
            postTransaction(r, today);
            r.setLastRunDate(today);
            r.setNextRunDate(calcNextRunDate(r, today));
            recurringRepo.save(r);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void postTransaction(RecurringTransaction r, LocalDate date) {
        Transaction tx = new Transaction();
        tx.setUser(r.getUser());
        tx.setName(r.getName());
        tx.setAmount(r.getAmount());
        tx.setType(r.getType());
        tx.setCategory(r.getCategory());
        tx.setDate(date);
        tx.setNote(r.getNote() != null ? r.getNote() + " (auto)" : "auto");
        txRepo.save(tx);
    }

    private LocalDate calcNextRunDate(RecurringTransaction r, LocalDate from) {
        return switch (r.getFrequency()) {
            case DAILY   -> from.plusDays(1);
            case WEEKLY  -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
            case YEARLY  -> from.plusYears(1);
        };
    }

    private RecurringTransaction getOwned(Long id, User user) {
        RecurringTransaction r = recurringRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring transaction not found"));
        if (!r.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        return r;
    }
}