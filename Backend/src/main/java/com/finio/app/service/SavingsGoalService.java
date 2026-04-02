package com.finio.app.service;

import com.finio.app.dto.SavingsGoalRequest;
import com.finio.app.dto.SavingsGoalResponse;
import com.finio.app.entity.SavingsGoal;
import com.finio.app.entity.User;
import com.finio.app.repository.SavingsGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavingsGoalService {

    private final SavingsGoalRepository goalRepository;

    public SavingsGoalResponse create(SavingsGoalRequest req, User user) {
        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(req.getName())
                .icon(req.getIcon())
                .targetAmount(req.getTargetAmount())
                .savedAmount(req.getSavedAmount() != null ? req.getSavedAmount() : BigDecimal.ZERO)
                .targetDate(req.getTargetDate())
                .build();
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public List<SavingsGoalResponse> getAll(User user) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(SavingsGoalResponse::from).toList();
    }

    public SavingsGoalResponse update(Long id, SavingsGoalRequest req, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");

        goal.setName(req.getName());
        goal.setIcon(req.getIcon());
        goal.setTargetAmount(req.getTargetAmount());
        if (req.getSavedAmount() != null) goal.setSavedAmount(req.getSavedAmount());
        goal.setTargetDate(req.getTargetDate());
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public SavingsGoalResponse addSaving(Long id, BigDecimal amount, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        goal.setSavedAmount(goal.getSavedAmount().add(amount));
        return SavingsGoalResponse.from(goalRepository.save(goal));
    }

    public void delete(Long id, User user) {
        SavingsGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        if (!goal.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        goalRepository.delete(goal);
    }
}
