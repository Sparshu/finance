package com.finio.app.dto;

import java.math.BigDecimal;

public record DashboardResponse(BigDecimal totalIncome, BigDecimal totalExpense,
                                BigDecimal netBalance, BigDecimal totalInvestmentValue,
                                long transactionCount, long activeGoals, long upcomingBills) {
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private BigDecimal totalIncome, totalExpense, netBalance, totalInvestmentValue;
        private long transactionCount, activeGoals, upcomingBills;
        public Builder totalIncome(BigDecimal v)          { totalIncome = v; return this; }
        public Builder totalExpense(BigDecimal v)         { totalExpense = v; return this; }
        public Builder netBalance(BigDecimal v)           { netBalance = v; return this; }
        public Builder totalInvestmentValue(BigDecimal v) { totalInvestmentValue = v; return this; }
        public Builder transactionCount(long v)           { transactionCount = v; return this; }
        public Builder activeGoals(long v)                { activeGoals = v; return this; }
        public Builder upcomingBills(long v)              { upcomingBills = v; return this; }
        public DashboardResponse build() {
            return new DashboardResponse(totalIncome, totalExpense, netBalance,
                    totalInvestmentValue, transactionCount, activeGoals, upcomingBills);
        }
    }
}
