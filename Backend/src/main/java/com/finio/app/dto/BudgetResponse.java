package com.finio.app.dto;

import com.finio.app.entity.Budget;

import java.math.BigDecimal;

public record BudgetResponse(Long id, String category, BigDecimal limit, BigDecimal spent,
                             Integer month, Integer year) {
    public static BudgetResponse from(Budget b, BigDecimal spent) {
        return new BudgetResponse(b.getId(), b.getCategory(), b.getLimit(),
                spent, b.getMonth(), b.getYear());
    }
}
