package com.finio.app.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category;

    @Column(name = "budget_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal limit;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Budget() {}

    public Budget(Long id, User user, String category, BigDecimal limit,
                  Integer month, Integer year, LocalDateTime createdAt) {
        this.id = id; this.user = user; this.category = category;
        this.limit = limit; this.month = month; this.year = year;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Long getId()                       { return id; }
    public void setId(Long id)                { this.id = id; }
    public User getUser()                     { return user; }
    public void setUser(User user)            { this.user = user; }
    public String getCategory()               { return category; }
    public void setCategory(String category)  { this.category = category; }
    public BigDecimal getLimit()              { return limit; }
    public void setLimit(BigDecimal limit)    { this.limit = limit; }
    public Integer getMonth()                 { return month; }
    public void setMonth(Integer month)       { this.month = month; }
    public Integer getYear()                  { return year; }
    public void setYear(Integer year)         { this.year = year; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id; private User user; private String category;
        private BigDecimal limit; private Integer month, year; private LocalDateTime createdAt;
        public Builder id(Long id)                { this.id = id; return this; }
        public Builder user(User user)            { this.user = user; return this; }
        public Builder category(String category)  { this.category = category; return this; }
        public Builder limit(BigDecimal limit)    { this.limit = limit; return this; }
        public Builder month(Integer month)       { this.month = month; return this; }
        public Builder year(Integer year)         { this.year = year; return this; }
        public Builder createdAt(LocalDateTime t) { this.createdAt = t; return this; }
        public Budget build() { return new Budget(id, user, category, limit, month, year, createdAt); }
    }
}
