package com.finio.app.dto;

import com.finio.app.entity.SavingsGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SavingsGoalResponse {
    private Long       id;
    private String     name;
    private String     icon;
    private BigDecimal targetAmount;
    private BigDecimal savedAmount;
    private LocalDate  targetDate;
    private int        progressPercent;

    public static SavingsGoalResponse from(SavingsGoal g) {
        int pct = g.getTargetAmount().compareTo(BigDecimal.ZERO) == 0 ? 0
                : g.getSavedAmount().multiply(BigDecimal.valueOf(100))
                        .divide(g.getTargetAmount(), 0, java.math.RoundingMode.HALF_UP)
                        .intValue();
        return SavingsGoalResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .icon(g.getIcon())
                .targetAmount(g.getTargetAmount())
                .savedAmount(g.getSavedAmount())
                .targetDate(g.getTargetDate())
                .progressPercent(pct)
                .build();
    }
}
