package com.finio.app.service;

import com.finio.app.dto.AuthResponse;
import com.finio.app.dto.ChangePasswordRequest;
import com.finio.app.dto.UpdateProfileRequest;
import com.finio.app.entity.User;
import com.finio.app.repository.BillRepository;
import com.finio.app.repository.BudgetRepository;
import com.finio.app.repository.InvestmentRepository;
import com.finio.app.repository.NetWorthRepository;
import com.finio.app.repository.RecurringTransactionRepository;
import com.finio.app.repository.SavingsGoalRepository;
import com.finio.app.repository.TransactionRepository;
import com.finio.app.repository.UserRepository;
import com.finio.app.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository                 userRepository;
    private final PasswordEncoder                passwordEncoder;
    private final JwtService                     jwtService;
    private final BillRepository                 billRepository;
    private final BudgetRepository               budgetRepository;
    private final InvestmentRepository           investmentRepository;
    private final NetWorthRepository             netWorthRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final SavingsGoalRepository          savingsGoalRepository;
    private final TransactionRepository          transactionRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       BillRepository billRepository,
                       BudgetRepository budgetRepository,
                       InvestmentRepository investmentRepository,
                       NetWorthRepository netWorthRepository,
                       RecurringTransactionRepository recurringTransactionRepository,
                       SavingsGoalRepository savingsGoalRepository,
                       TransactionRepository transactionRepository) {
        this.userRepository                 = userRepository;
        this.passwordEncoder                = passwordEncoder;
        this.jwtService                     = jwtService;
        this.billRepository                 = billRepository;
        this.budgetRepository               = budgetRepository;
        this.investmentRepository           = investmentRepository;
        this.netWorthRepository             = netWorthRepository;
        this.recurringTransactionRepository = recurringTransactionRepository;
        this.savingsGoalRepository          = savingsGoalRepository;
        this.transactionRepository          = transactionRepository;
    }

    public AuthResponse updateProfile(UpdateProfileRequest request, User user) {
        user.setName(request.name().trim());
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .userId(user.getId())
                .build();
    }

    public void changePassword(ChangePasswordRequest request, User user) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(User user) {
        Long userId = user.getId();
        // Delete all child records before removing the user
        billRepository.deleteByUserId(userId);
        budgetRepository.deleteByUserId(userId);
        investmentRepository.deleteByUserId(userId);
        netWorthRepository.deleteByUserId(userId);
        recurringTransactionRepository.deleteByUserId(userId);
        savingsGoalRepository.deleteByUserId(userId);
        transactionRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }
}