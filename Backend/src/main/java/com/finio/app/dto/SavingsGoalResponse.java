package com.finio.app.dto;

import com.finio.app.entity.SavingsGoal;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalResponse(Long id, String name, String icon, BigDecimal targetAmount,
                                  BigDecimal savedAmount, LocalDate targetDate, int progressPercent) {
    public static SavingsGoalResponse from(SavingsGoal g) {
        int pct = g.getTargetAmount().compareTo(BigDecimal.ZERO) == 0 ? 0
                : g.getSavedAmount().multiply(BigDecimal.valueOf(100))
                        .divide(g.getTargetAmount(), 0, java.math.RoundingMode.HALF_UP)
                        .intValue();
        return new SavingsGoalResponse(g.getId(), g.getName(), g.getIcon(),
                g.getTargetAmount(), g.getSavedAmount(), g.getTargetDate(), pct);
    }
}
