package com.finio.app.dto;

import com.finio.app.entity.NetWorthEntry;
import com.finio.app.entity.NetWorthEntry.EntryType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NetWorthResponse(
        Long id,
        String name,
        EntryType type,
        String category,
        BigDecimal amount,
        LocalDate date,
        String note,
        String monthLabel  // e.g. "March 2025" — only set for MONTHLY_SAVINGS entries
) {
    public static NetWorthResponse from(NetWorthEntry e) {
        String monthLabel = null;
        if (e.getType() == EntryType.MONTHLY_SAVINGS && e.getDate() != null) {
            monthLabel = e.getDate().getMonth().getDisplayName(
                java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
                + " " + e.getDate().getYear();
        }
        return new NetWorthResponse(
                e.getId(), e.getName(), e.getType(),
                e.getCategory(), e.getAmount(), e.getDate(), e.getNote(),
                monthLabel
        );
    }
}