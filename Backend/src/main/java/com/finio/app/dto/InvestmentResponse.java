package com.finio.app.dto;

import com.finio.app.entity.Investment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InvestmentResponse {
    private Long       id;
    private String     ticker;
    private String     name;
    private BigDecimal quantity;
    private BigDecimal buyPrice;
    private BigDecimal currentPrice;
    private BigDecimal currentValue;
    private BigDecimal gainLoss;
    private double     gainLossPercent;
    private LocalDate  purchaseDate;

    public static InvestmentResponse from(Investment inv) {
        BigDecimal curr  = inv.getCurrentPrice() != null ? inv.getCurrentPrice() : inv.getBuyPrice();
        BigDecimal value = curr.multiply(inv.getQuantity());
        BigDecimal cost  = inv.getBuyPrice().multiply(inv.getQuantity());
        BigDecimal gain  = value.subtract(cost);
        double     pct   = cost.compareTo(BigDecimal.ZERO) == 0 ? 0
                : gain.divide(cost, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();

        return InvestmentResponse.builder()
                .id(inv.getId())
                .ticker(inv.getTicker())
                .name(inv.getName())
                .quantity(inv.getQuantity())
                .buyPrice(inv.getBuyPrice())
                .currentPrice(curr)
                .currentValue(value.setScale(2, RoundingMode.HALF_UP))
                .gainLoss(gain.setScale(2, RoundingMode.HALF_UP))
                .gainLossPercent(Math.round(pct * 100.0) / 100.0)
                .purchaseDate(inv.getPurchaseDate())
                .build();
    }
}
