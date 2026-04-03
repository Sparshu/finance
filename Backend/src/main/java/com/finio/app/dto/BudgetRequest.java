package com.finio.app.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotBlank(message = "Category is required") String category,
        @NotNull(message = "Limit amount is required") @Positive(message = "Limit must be positive") BigDecimal limit,
        @NotNull @Min(1) @Max(12) Integer month,
        @NotNull @Min(2000) Integer year
) {}
