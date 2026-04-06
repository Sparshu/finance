package com.finio.app.dto;

import com.finio.app.entity.NetWorthEntry.EntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NetWorthRequest(
        @NotBlank(message = "Name is required") String name,
        @NotNull(message = "Type is required") EntryType type,
        @NotBlank(message = "Category is required") String category,
        @NotNull @Positive BigDecimal amount,
        @NotNull LocalDate date,
        String note
) {}