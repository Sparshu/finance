package com.finio.app.dto;

import com.finio.app.entity.Investment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public record InvestmentResponse(Long id, String ticker, String name, BigDecimal quantity,
                                 BigDecimal buyPrice, BigDecimal currentPrice,
                                 BigDecimal currentValue, BigDecimal gainLoss,
                                 double gainLossPercent, LocalDate purchaseDate) {
    public static InvestmentResponse from(Investment inv) {
        BigDecimal curr  = inv.getCurrentPrice() != null ? inv.getCurrentPrice() : inv.getBuyPrice();
        BigDecimal value = curr.multiply(inv.getQuantity());
        BigDecimal cost  = inv.getBuyPrice().multiply(inv.getQuantity());
        BigDecimal gain  = value.subtract(cost);
        double pct = cost.compareTo(BigDecimal.ZERO) == 0 ? 0
                : gain.divide(cost, 4, RoundingMode.HALF_UP)
                      .multiply(BigDecimal.valueOf(100)).doubleValue();
        return new InvestmentResponse(
                inv.getId(), inv.getTicker(), inv.getName(), inv.getQuantity(),
                inv.getBuyPrice(), curr,
                value.setScale(2, RoundingMode.HALF_UP),
                gain.setScale(2, RoundingMode.HALF_UP),
                Math.round(pct * 100.0) / 100.0,
                inv.getPurchaseDate());
    }
}
