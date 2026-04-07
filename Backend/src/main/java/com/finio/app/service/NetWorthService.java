package com.finio.app.service;

import com.finio.app.dto.NetWorthRequest;
import com.finio.app.dto.NetWorthResponse;
import com.finio.app.entity.NetWorthEntry;
import com.finio.app.entity.NetWorthEntry.EntryType;
import com.finio.app.entity.Transaction.TransactionType;
import com.finio.app.entity.User;
import com.finio.app.repository.NetWorthRepository;
import com.finio.app.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class NetWorthService {

    private final NetWorthRepository repo;
    private final TransactionRepository txRepo;

    public NetWorthService(NetWorthRepository repo, TransactionRepository txRepo) {
        this.repo = repo;
        this.txRepo = txRepo;
    }

    public NetWorthResponse create(NetWorthRequest req, User user) {
        NetWorthEntry entry = new NetWorthEntry();
        entry.setUser(user);
        entry.setName(req.name().trim());
        entry.setType(req.type());
        entry.setCategory(req.category());
        entry.setAmount(req.amount());
        entry.setDate(req.date());
        entry.setNote(req.note());
        return NetWorthResponse.from(repo.save(entry));
    }

    public List<NetWorthResponse> getAll(User user) {
        return repo.findByUserIdOrderByDateDescCreatedAtDesc(user.getId())
                .stream().map(NetWorthResponse::from).toList();
    }

    public NetWorthResponse update(Long id, NetWorthRequest req, User user) {
        NetWorthEntry entry = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (!entry.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        entry.setName(req.name().trim());
        entry.setType(req.type());
        entry.setCategory(req.category());
        entry.setAmount(req.amount());
        entry.setDate(req.date());
        entry.setNote(req.note());
        return NetWorthResponse.from(repo.save(entry));
    }

    public void delete(Long id, User user) {
        NetWorthEntry entry = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (!entry.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        repo.delete(entry);
    }

    /**
     * Calculates net savings for a given month (income - expenses) from transactions
     * and creates a MONTHLY_SAVINGS entry in net worth.
     * If an entry already exists for that month, it is updated (idempotent).
     *
     * @param yearMonth the month to roll over (defaults to last month if null)
     * @param user      the authenticated user
     * @return the saved/updated NetWorthResponse
     */
    public Map<String, Object> rolloverMonthlySavings(YearMonth yearMonth, User user) {
        YearMonth target = (yearMonth != null) ? yearMonth : YearMonth.now().minusMonths(1);

        LocalDate from = target.atDay(1);
        LocalDate to   = target.atEndOfMonth();

        BigDecimal income  = txRepo.sumAmountByUserIdAndTypeAndDateBetween(
                user.getId(), TransactionType.INCOME, from, to);
        BigDecimal expense = txRepo.sumAmountByUserIdAndTypeAndDateBetween(
                user.getId(), TransactionType.EXPENSE, from, to);

        income  = income  != null ? income  : BigDecimal.ZERO;
        expense = expense != null ? expense : BigDecimal.ZERO;

        BigDecimal netSavings = income.subtract(expense);

        String monthName = target.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
                + " " + target.getYear();
        String entryName = "Monthly Savings – " + monthName;

        // Check if already rolled over for this month (idempotent)
        Optional<NetWorthEntry> existing = repo.findMonthlySavingsForPeriod(user.getId(), from, to);

        NetWorthEntry entry;
        boolean wasUpdate;
        if (existing.isPresent()) {
            entry = existing.get();
            wasUpdate = true;
        } else {
            entry = new NetWorthEntry();
            entry.setUser(user);
            entry.setType(EntryType.MONTHLY_SAVINGS);
            entry.setDate(to); // pin to last day of the month
            wasUpdate = false;
        }

        entry.setName(entryName);
        entry.setCategory("Monthly Savings");
        // Store as positive value; frontend will handle +/- display based on sign vs type
        entry.setAmount(netSavings.abs());
        entry.setNote((netSavings.compareTo(BigDecimal.ZERO) >= 0 ? "Surplus" : "Deficit")
                + ": ₹" + String.format("%,.0f", netSavings.abs()) + " for " + monthName
                + " (Income ₹" + String.format("%,.0f", income) + " − Expenses ₹" + String.format("%,.0f", expense) + ")");

        NetWorthEntry saved = repo.save(entry);
        return Map.of(
            "entry",      NetWorthResponse.from(saved),
            "income",     income,
            "expense",    expense,
            "netSavings", netSavings,
            "month",      monthName,
            "isDeficit",  netSavings.compareTo(BigDecimal.ZERO) < 0,
            "updated",    wasUpdate
        );
    }
}