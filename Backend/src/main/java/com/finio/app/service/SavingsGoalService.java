package com.finio.app.service;

import com.finio.app.dto.SavingsGoalRequest;
import com.finio.app.dto.SavingsGoalResponse;
import com.finio.app.entity.SavingsGoal;
import com.finio.app.entity.User;
import com.finio.app.repository.SavingsGoalRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SavingsGoalService {

    private final SavingsGoalRepository goalRepository;

    public SavingsGoalService(SavingsGoalRepository goalRepository) {
        this.goalRepository = goalRepository;
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
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public void delete(Long id, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        goalRepository.delete(goal);
    }
}
