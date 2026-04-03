package com.finio.app.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    private String icon;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_day", nullable = false)
    private Integer dueDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillStatus status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Bill() {}

    public Bill(Long id, User user, String name, String icon, BigDecimal amount,
                Integer dueDay, BillStatus status, LocalDateTime createdAt) {
        this.id = id; this.user = user; this.name = name; this.icon = icon;
        this.amount = amount; this.dueDay = dueDay; this.status = status;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = BillStatus.UPCOMING;
    }

    public Long getId()                       { return id; }
    public void setId(Long id)                { this.id = id; }
    public User getUser()                     { return user; }
    public void setUser(User user)            { this.user = user; }
    public String getName()                   { return name; }
    public void setName(String name)          { this.name = name; }
    public String getIcon()                   { return icon; }
    public void setIcon(String icon)          { this.icon = icon; }
    public BigDecimal getAmount()             { return amount; }
    public void setAmount(BigDecimal amount)  { this.amount = amount; }
    public Integer getDueDay()                { return dueDay; }
    public void setDueDay(Integer dueDay)     { this.dueDay = dueDay; }
    public BillStatus getStatus()             { return status; }
    public void setStatus(BillStatus status)  { this.status = status; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id; private User user; private String name, icon;
        private BigDecimal amount; private Integer dueDay; private BillStatus status;
        private LocalDateTime createdAt;
        public Builder id(Long id)                { this.id = id; return this; }
        public Builder user(User user)            { this.user = user; return this; }
        public Builder name(String name)          { this.name = name; return this; }
        public Builder icon(String icon)          { this.icon = icon; return this; }
        public Builder amount(BigDecimal amount)  { this.amount = amount; return this; }
        public Builder dueDay(Integer dueDay)     { this.dueDay = dueDay; return this; }
        public Builder status(BillStatus status)  { this.status = status; return this; }
        public Builder createdAt(LocalDateTime t) { this.createdAt = t; return this; }
        public Bill build() { return new Bill(id, user, name, icon, amount, dueDay, status, createdAt); }
    }

    public enum BillStatus { UPCOMING, DUE, PAID }
}
