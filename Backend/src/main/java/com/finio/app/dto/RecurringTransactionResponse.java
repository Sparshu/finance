package com.finio.app.dto;

import com.finio.app.entity.RecurringTransaction;
import com.finio.app.entity.RecurringTransaction.Frequency;
import com.finio.app.entity.Transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionResponse(
        Long id,
        String name,
        BigDecimal amount,
        TransactionType type,
        String category,
        Frequency frequency,
        Integer dayOfPeriod,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate nextRunDate,
        LocalDate lastRunDate,
        boolean active,
        String note
) {
    public static RecurringTransactionResponse from(RecurringTransaction r) {
        return new RecurringTransactionResponse(
                r.getId(), r.getName(), r.getAmount(), r.getType(),
                r.getCategory(), r.getFrequency(), r.getDayOfPeriod(),
                r.getStartDate(), r.getEndDate(), r.getNextRunDate(),
                r.getLastRunDate(), r.isActive(), r.getNote()
        );
    }
}