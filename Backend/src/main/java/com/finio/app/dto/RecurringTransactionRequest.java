package com.finio.app.dto;

import com.finio.app.entity.RecurringTransaction.Frequency;
import com.finio.app.entity.Transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionRequest(
        @NotBlank(message = "Name is required") String name,
        @NotNull @Positive BigDecimal amount,
        @NotNull TransactionType type,
        @NotBlank String category,
        @NotNull Frequency frequency,
        Integer dayOfPeriod,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        String note
) {}