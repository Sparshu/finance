package com.finio.app.dto;

import com.finio.app.entity.Transaction;
import com.finio.app.entity.Transaction.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TransactionResponse {
    private Long            id;
    private String          name;
    private BigDecimal      amount;
    private TransactionType type;
    private String          category;
    private LocalDate       date;
    private String          note;
    private LocalDateTime   createdAt;

    public static TransactionResponse from(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .amount(t.getAmount())
                .type(t.getType())
                .category(t.getCategory())
                .date(t.getDate())
                .note(t.getNote())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
