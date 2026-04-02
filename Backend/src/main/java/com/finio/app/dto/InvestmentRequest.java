package com.finio.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InvestmentRequest {

    @NotBlank(message = "Ticker symbol is required")
    private String ticker;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull @Positive
    private BigDecimal quantity;

    @NotNull @Positive
    private BigDecimal buyPrice;

    private BigDecimal currentPrice;

    private LocalDate purchaseDate;
}
