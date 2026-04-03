package com.finio.app.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private LocalDate date;

    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Transaction() {}

    public Transaction(Long id, User user, String name, BigDecimal amount,
                       TransactionType type, String category, LocalDate date,
                       String note, LocalDateTime createdAt) {
        this.id = id; this.user = user; this.name = name; this.amount = amount;
        this.type = type; this.category = category; this.date = date;
        this.note = note; this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Long getId()                           { return id; }
    public void setId(Long id)                    { this.id = id; }
    public User getUser()                         { return user; }
    public void setUser(User user)                { this.user = user; }
    public String getName()                       { return name; }
    public void setName(String name)              { this.name = name; }
    public BigDecimal getAmount()                 { return amount; }
    public void setAmount(BigDecimal amount)      { this.amount = amount; }
    public TransactionType getType()              { return type; }
    public void setType(TransactionType type)     { this.type = type; }
    public String getCategory()                   { return category; }
    public void setCategory(String category)      { this.category = category; }
    public LocalDate getDate()                    { return date; }
    public void setDate(LocalDate date)           { this.date = date; }
    public String getNote()                       { return note; }
    public void setNote(String note)              { this.note = note; }
    public LocalDateTime getCreatedAt()           { return createdAt; }
    public void setCreatedAt(LocalDateTime t)     { this.createdAt = t; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id; private User user; private String name;
        private BigDecimal amount; private TransactionType type;
        private String category; private LocalDate date; private String note;
        private LocalDateTime createdAt;
        public Builder id(Long id)                   { this.id = id; return this; }
        public Builder user(User user)               { this.user = user; return this; }
        public Builder name(String name)             { this.name = name; return this; }
        public Builder amount(BigDecimal amount)     { this.amount = amount; return this; }
        public Builder type(TransactionType type)    { this.type = type; return this; }
        public Builder category(String category)     { this.category = category; return this; }
        public Builder date(LocalDate date)          { this.date = date; return this; }
        public Builder note(String note)             { this.note = note; return this; }
        public Builder createdAt(LocalDateTime t)    { this.createdAt = t; return this; }
        public Transaction build() {
            return new Transaction(id, user, name, amount, type, category, date, note, createdAt);
        }
    }

    public enum TransactionType { INCOME, EXPENSE }
}
