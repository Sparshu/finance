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

    /**
     * Tracks when the last overspend alert was sent for this budget.
     * Null means no alert has been sent yet.
     * A new alert is only sent if this is null OR more than 10 days have passed.
     */
    @Column(name = "overspend_alert_sent_at")
    private LocalDateTime overspendAlertSentAt;

    public Budget() {}

    public Budget(Long id, User user, String category, BigDecimal limit,
                  Integer month, Integer year, LocalDateTime createdAt) {
        this.id = id; this.user = user; this.category = category;
        this.limit = limit; this.month = month; this.year = year;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Long getId()                                       { return id; }
    public void setId(Long id)                               { this.id = id; }
    public User getUser()                                    { return user; }
    public void setUser(User user)                           { this.user = user; }
    public String getCategory()                              { return category; }
    public void setCategory(String category)                 { this.category = category; }
    public BigDecimal getLimit()                             { return limit; }
    public void setLimit(BigDecimal limit)                   { this.limit = limit; }
    public Integer getMonth()                                { return month; }
    public void setMonth(Integer month)                      { this.month = month; }
    public Integer getYear()                                 { return year; }
    public void setYear(Integer year)                        { this.year = year; }
    public LocalDateTime getCreatedAt()                      { return createdAt; }
    public void setCreatedAt(LocalDateTime t)                { this.createdAt = t; }
    public LocalDateTime getOverspendAlertSentAt()           { return overspendAlertSentAt; }
    public void setOverspendAlertSentAt(LocalDateTime t)     { this.overspendAlertSentAt = t; }

    /**
     * Returns true if an alert should be sent:
     * — never sent before, OR last sent more than 10 days ago.
     */
    public boolean shouldSendAlert() {
        if (overspendAlertSentAt == null) return true;
        return overspendAlertSentAt.isBefore(LocalDateTime.now().minusDays(10));
    }

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