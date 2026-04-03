package com.finio.app.dto;

import com.finio.app.entity.Transaction;
import com.finio.app.entity.Transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TransactionResponse(Long id, String name, BigDecimal amount, TransactionType type,
                                  String category, LocalDate date, String note,
                                  LocalDateTime createdAt) {
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(t.getId(), t.getName(), t.getAmount(), t.getType(),
                t.getCategory(), t.getDate(), t.getNote(), t.getCreatedAt());
    }
}
