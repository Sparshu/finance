package com.finio.app.dto;

import com.finio.app.entity.Bill.BillStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record BillRequest(
        @NotBlank(message = "Bill name is required") String name,
        String icon,
        @NotNull @Positive BigDecimal amount,
        @NotNull @Min(1) @Max(31) Integer dueDay,
        BillStatus status
) {}
