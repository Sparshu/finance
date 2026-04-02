package com.finio.app.dto;

import com.finio.app.entity.Budget;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BudgetResponse {
    private Long       id;
    private String     category;
    private BigDecimal limit;
    private BigDecimal spent;       // calculated from transactions
    private Integer    month;
    private Integer    year;

    public static BudgetResponse from(Budget b, BigDecimal spent) {
        return BudgetResponse.builder()
                .id(b.getId())
                .category(b.getCategory())
                .limit(b.getLimit())
                .spent(spent)
                .month(b.getMonth())
                .year(b.getYear())
                .build();
    }
}
