package com.finio.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_transactions")
public class RecurringTransaction {

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
    private Transaction.TransactionType type;

    @Column(nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Frequency frequency;

    // Day of month for MONTHLY (1–31), day of week for WEEKLY (1=Mon–7=Sun)
    @Column(name = "day_of_period")
    private Integer dayOfPeriod;

    @Column(name = "next_run_date", nullable = false)
    private LocalDate nextRunDate;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private boolean active = true;

    private String note;

    @Column(name = "last_run_date")
    private LocalDate lastRunDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public enum Frequency { DAILY, WEEKLY, MONTHLY, YEARLY }

    // Getters & Setters
    public Long getId()                              { return id; }
    public void setId(Long id)                       { this.id = id; }
    public User getUser()                            { return user; }
    public void setUser(User user)                   { this.user = user; }
    public String getName()                          { return name; }
    public void setName(String name)                 { this.name = name; }
    public BigDecimal getAmount()                    { return amount; }
    public void setAmount(BigDecimal amount)         { this.amount = amount; }
    public Transaction.TransactionType getType()     { return type; }
    public void setType(Transaction.TransactionType t) { this.type = t; }
    public String getCategory()                      { return category; }
    public void setCategory(String category)         { this.category = category; }
    public Frequency getFrequency()                  { return frequency; }
    public void setFrequency(Frequency frequency)    { this.frequency = frequency; }
    public Integer getDayOfPeriod()                  { return dayOfPeriod; }
    public void setDayOfPeriod(Integer d)            { this.dayOfPeriod = d; }
    public LocalDate getNextRunDate()                { return nextRunDate; }
    public void setNextRunDate(LocalDate d)          { this.nextRunDate = d; }
    public LocalDate getStartDate()                  { return startDate; }
    public void setStartDate(LocalDate d)            { this.startDate = d; }
    public LocalDate getEndDate()                    { return endDate; }
    public void setEndDate(LocalDate d)              { this.endDate = d; }
    public boolean isActive()                        { return active; }
    public void setActive(boolean active)            { this.active = active; }
    public String getNote()                          { return note; }
    public void setNote(String note)                 { this.note = note; }
    public LocalDate getLastRunDate()                { return lastRunDate; }
    public void setLastRunDate(LocalDate d)          { this.lastRunDate = d; }
    public LocalDateTime getCreatedAt()              { return createdAt; }
    public void setCreatedAt(LocalDateTime t)        { this.createdAt = t; }
}