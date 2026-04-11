package com.finio.app.service;

import com.finio.app.dto.SavingsGoalRequest;
import com.finio.app.dto.SavingsGoalResponse;
import com.finio.app.entity.SavingsGoal;
import com.finio.app.entity.User;
import com.finio.app.repository.SavingsGoalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class SavingsGoalService {

    private static final Logger log = LoggerFactory.getLogger(SavingsGoalService.class);

    private final SavingsGoalRepository goalRepository;
    private final EmailService          emailService;

    // Milestone ranges: each entry is the minimum % to qualify for that milestone label
    // 25 = 25–49%, 50 = 50–74%, 75 = 75–99%, 100 = 100%+
    private static final int[] MILESTONES = {25, 50, 75, 100};

    public SavingsGoalService(SavingsGoalRepository goalRepository, EmailService emailService) {
        this.goalRepository = goalRepository;
        this.emailService   = emailService;
    }

    public SavingsGoalResponse create(SavingsGoalRequest req, User user) {
        SavingsGoal goal = SavingsGoal.builder()
                .user(user).name(req.name()).icon(req.icon()).targetAmount(req.targetAmount())
                .savedAmount(req.savedAmount() != null ? req.savedAmount() : BigDecimal.ZERO)
                .targetDate(req.targetDate()).build();
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public List<SavingsGoalResponse> getAll(User user) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(SavingsGoalResponse::from).toList();
    }

    public SavingsGoalResponse update(Long id, SavingsGoalRequest req, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        goal.setName(req.name()); goal.setIcon(req.icon());
        goal.setTargetAmount(req.targetAmount());
        if (req.savedAmount() != null) goal.setSavedAmount(req.savedAmount());
        goal.setTargetDate(req.targetDate());
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public SavingsGoalResponse addSaving(Long id, BigDecimal amount, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");

        goal.setSavedAmount(goal.getSavedAmount().add(amount));

        // ── Milestone check BEFORE saving — updates milestonesSent on the same object
        checkAndSendMilestones(goal, user);

        // Single save captures both the new savedAmount AND any milestonesSent updates
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public void delete(Long id, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        goalRepository.delete(goal);
    }

    // ── Milestone check ───────────────────────────────────────────────────────

    private void checkAndSendMilestones(SavingsGoal goal, User user) {
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) return;

        BigDecimal progress = goal.getSavedAmount()
                .divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        int progressInt = progress.intValue();

        for (int milestone : MILESTONES) {
            // Range-based: progress >= milestone threshold AND not yet sent
            if (progressInt >= milestone && goal.isMilestoneNotYetSent(milestone)) {
                try {
                    emailService.sendGoalMilestone(
                            user.getEmail(),
                            user.getName(),
                            goal.getName(),
                            goal.getIcon(),
                            goal.getSavedAmount(),
                            goal.getTargetAmount(),
                            milestone
                    );
                    goal.markMilestoneSent(milestone);
                    log.info("Goal milestone {}% sent to {} for goal '{}'",
                            milestone, user.getEmail(), goal.getName());
                } catch (Exception e) {
                    log.error("Failed goal milestone email for id={}: {}", goal.getId(), e.getMessage());
                }
            }
        }
    }
}