package com.finio.app.dto;

import com.finio.app.entity.Bill;
import com.finio.app.entity.Bill.BillStatus;

import java.math.BigDecimal;

public record BillResponse(Long id, String name, String icon, BigDecimal amount,
                           Integer dueDay, BillStatus status) {
    public static BillResponse from(Bill b) {
        return new BillResponse(b.getId(), b.getName(), b.getIcon(),
                b.getAmount(), b.getDueDay(), b.getStatus());
    }
}
