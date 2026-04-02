package com.finio.app.dto;

import com.finio.app.entity.Bill;
import com.finio.app.entity.Bill.BillStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BillResponse {
    private Long       id;
    private String     name;
    private String     icon;
    private BigDecimal amount;
    private Integer    dueDay;
    private BillStatus status;

    public static BillResponse from(Bill b) {
        return BillResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .icon(b.getIcon())
                .amount(b.getAmount())
                .dueDay(b.getDueDay())
                .status(b.getStatus())
                .build();
    }
}
