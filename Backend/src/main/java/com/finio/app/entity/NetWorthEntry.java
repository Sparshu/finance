package com.finio.app.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "net_worth_entries")
public class NetWorthEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryType type; // ASSET or LIABILITY

    @Column(nullable = false)
    private String category; // Cash, Property, Vehicle, Loan, Credit Card, etc.

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public NetWorthEntry() {}

    public enum EntryType { ASSET, LIABILITY, MONTHLY_SAVINGS }

    public Long getId()                         { return id; }
    public void setId(Long id)                  { this.id = id; }
    public User getUser()                       { return user; }
    public void setUser(User user)              { this.user = user; }
    public String getName()                     { return name; }
    public void setName(String name)            { this.name = name; }
    public EntryType getType()                  { return type; }
    public void setType(EntryType type)         { this.type = type; }
    public String getCategory()                 { return category; }
    public void setCategory(String category)    { this.category = category; }
    public BigDecimal getAmount()               { return amount; }
    public void setAmount(BigDecimal amount)    { this.amount = amount; }
    public LocalDate getDate()                  { return date; }
    public void setDate(LocalDate date)         { this.date = date; }
    public String getNote()                     { return note; }
    public void setNote(String note)            { this.note = note; }
    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime t)   { this.createdAt = t; }
}