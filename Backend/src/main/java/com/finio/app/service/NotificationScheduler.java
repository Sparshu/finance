package com.finio.app.service;

import com.finio.app.entity.Bill;
import com.finio.app.repository.BillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Daily scheduler — runs at 08:00 AM every day.
 *
 * Handles ONLY bill due-date reminders (7 days and 3 days before due day).
 *
 * Budget overspend alerts  → fired instantly in TransactionService.create()
 * Goal milestone emails    → fired instantly in SavingsGoalService.addSaving()
 */
@Service
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final BillRepository billRepository;
    private final EmailService   emailService;

    public NotificationScheduler(BillRepository billRepository, EmailService emailService) {
        this.billRepository = billRepository;
        this.emailService   = emailService;
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void runDailyNotifications() {
        log.info("Running daily bill reminder checks...");
        checkBillReminders();
        log.info("Daily bill reminder checks complete.");
    }

    // ── Bill due-date reminders ───────────────────────────────────────────────

    private void checkBillReminders() {
        LocalDate today       = LocalDate.now();
        int       todayDay    = today.getDayOfMonth();
        int       daysInMonth = today.lengthOfMonth();

        List<Bill> unpaidBills = billRepository.findAllUnpaidWithUser(Bill.BillStatus.PAID);

        for (Bill bill : unpaidBills) {
            int dueDay   = bill.getDueDay();
            int daysLeft = dueDay - todayDay;

            // Handle month wrap-around (e.g. today is day 28, due day is 3 next month)
            if (daysLeft < 0) {
                daysLeft = (daysInMonth - todayDay) + dueDay;
            }

            if (daysLeft == 7 || daysLeft == 3 || daysLeft == 1 || daysLeft == 0) {
                try {
                    emailService.sendBillReminder(
                            bill.getUser().getEmail(),
                            bill.getUser().getName(),
                            bill.getName(),
                            bill.getIcon(),
                            bill.getAmount(),
                            dueDay,
                            daysLeft
                    );
                    log.info("Bill reminder sent to {} for '{}' ({} days left)",
                            bill.getUser().getEmail(), bill.getName(), daysLeft);
                } catch (Exception e) {
                    log.error("Failed bill reminder for id={}: {}", bill.getId(), e.getMessage());
                }
            }
        }
    }
}