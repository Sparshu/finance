package com.finio.app.service;

import com.finio.app.dto.TransactionRequest;
import com.finio.app.dto.TransactionResponse;
import com.finio.app.entity.Transaction;
import com.finio.app.entity.Transaction.TransactionType;
import com.finio.app.entity.User;
import com.finio.app.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionResponse create(TransactionRequest req, User user) {
        Transaction tx = Transaction.builder()
                .user(user)
                .name(req.getName())
                .amount(req.getAmount())
                .type(req.getType())
                .category(req.getCategory())
                .date(req.getDate())
                .note(req.getNote())
                .build();
        return TransactionResponse.from(transactionRepository.save(tx));
    }

    public List<TransactionResponse> getAll(User user) {
        return transactionRepository
                .findByUserIdOrderByDateDesc(user.getId())
                .stream().map(TransactionResponse::from).toList();
    }

    public List<TransactionResponse> getByType(User user, TransactionType type) {
        return transactionRepository
                .findByUserIdAndTypeOrderByDateDesc(user.getId(), type)
                .stream().map(TransactionResponse::from).toList();
    }

    public List<TransactionResponse> getByDateRange(User user, LocalDate from, LocalDate to) {
        return transactionRepository
                .findByUserIdAndDateBetweenOrderByDateDesc(user.getId(), from, to)
                .stream().map(TransactionResponse::from).toList();
    }

    public TransactionResponse update(Long id, TransactionRequest req, User user) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!tx.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");

        tx.setName(req.getName());
        tx.setAmount(req.getAmount());
        tx.setType(req.getType());
        tx.setCategory(req.getCategory());
        tx.setDate(req.getDate());
        tx.setNote(req.getNote());
        return TransactionResponse.from(transactionRepository.save(tx));
    }

    public void delete(Long id, User user) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!tx.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        transactionRepository.delete(tx);
    }
}
