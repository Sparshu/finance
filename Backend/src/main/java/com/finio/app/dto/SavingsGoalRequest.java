package com.finio.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        @NotBlank(message = "Goal name is required") String name,
        String icon,
        @NotNull(message = "Target amount is required") @Positive(message = "Target amount must be positive") BigDecimal targetAmount,
        BigDecimal savedAmount,
        LocalDate targetDate
) {}
