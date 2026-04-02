package com.finio.app.dto;

import com.finio.app.entity.Bill.BillStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BillRequest {

    @NotBlank(message = "Bill name is required")
    private String name;

    private String icon;

    @NotNull @Positive
    private BigDecimal amount;

    @NotNull @Min(1) @Max(31)
    private Integer dueDay;

    private BillStatus status;
}
