package com.finio.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestmentRequest(
        @NotBlank(message = "Ticker symbol is required") String ticker,
        @NotBlank(message = "Name is required") String name,
        @NotNull @Positive BigDecimal quantity,
        @NotNull @Positive BigDecimal buyPrice,
        BigDecimal currentPrice,
        LocalDate purchaseDate
) {}
