package com.finio.app.service;

import com.finio.app.dto.DashboardResponse;
import com.finio.app.entity.Bill.BillStatus;
import com.finio.app.entity.Investment;
import com.finio.app.entity.Transaction.TransactionType;
import com.finio.app.entity.User;
import com.finio.app.repository.BillRepository;
import com.finio.app.repository.InvestmentRepository;
import com.finio.app.repository.SavingsGoalRepository;
import com.finio.app.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final InvestmentRepository  investmentRepository;
    private final SavingsGoalRepository goalRepository;
    private final BillRepository        billRepository;

    public DashboardService(TransactionRepository transactionRepository,
                            InvestmentRepository investmentRepository,
                            SavingsGoalRepository goalRepository,
                            BillRepository billRepository) {
        this.transactionRepository = transactionRepository;
        this.investmentRepository  = investmentRepository;
        this.goalRepository        = goalRepository;
        this.billRepository        = billRepository;
    }

    public DashboardResponse getSummary(User user) {
        Long userId = user.getId();
        BigDecimal totalIncome  = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.INCOME);
        BigDecimal totalExpense = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.EXPENSE);
        BigDecimal netBalance   = totalIncome.subtract(totalExpense);

        List<Investment> investments = investmentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        BigDecimal investmentValue = investments.stream()
                .map(inv -> {
                    BigDecimal price = inv.getCurrentPrice() != null ? inv.getCurrentPrice() : inv.getBuyPrice();
                    return price.multiply(inv.getQuantity());
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long txCount       = transactionRepository.findByUserIdOrderByDateDesc(userId).size();
        long activeGoals   = goalRepository.findByUserIdOrderByCreatedAtDesc(userId).size();
        long upcomingBills = billRepository.findByUserIdAndStatus(userId, BillStatus.UPCOMING).size()
                           + billRepository.findByUserIdAndStatus(userId, BillStatus.DUE).size();

        return DashboardResponse.builder()
                .totalIncome(totalIncome).totalExpense(totalExpense).netBalance(netBalance)
                .totalInvestmentValue(investmentValue).transactionCount(txCount)
                .activeGoals(activeGoals).upcomingBills(upcomingBills).build();
    }
}
