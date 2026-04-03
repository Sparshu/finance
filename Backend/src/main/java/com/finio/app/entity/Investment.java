package com.finio.app.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "investments")
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Column(name = "buy_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal buyPrice;

    @Column(name = "current_price", precision = 12, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Investment() {}

    public Investment(Long id, User user, String ticker, String name, BigDecimal quantity,
                      BigDecimal buyPrice, BigDecimal currentPrice, LocalDate purchaseDate,
                      LocalDateTime createdAt) {
        this.id = id; this.user = user; this.ticker = ticker; this.name = name;
        this.quantity = quantity; this.buyPrice = buyPrice; this.currentPrice = currentPrice;
        this.purchaseDate = purchaseDate; this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    public Long getId()                              { return id; }
    public void setId(Long id)                       { this.id = id; }
    public User getUser()                            { return user; }
    public void setUser(User user)                   { this.user = user; }
    public String getTicker()                        { return ticker; }
    public void setTicker(String ticker)             { this.ticker = ticker; }
    public String getName()                          { return name; }
    public void setName(String name)                 { this.name = name; }
    public BigDecimal getQuantity()                  { return quantity; }
    public void setQuantity(BigDecimal quantity)     { this.quantity = quantity; }
    public BigDecimal getBuyPrice()                  { return buyPrice; }
    public void setBuyPrice(BigDecimal buyPrice)     { this.buyPrice = buyPrice; }
    public BigDecimal getCurrentPrice()              { return currentPrice; }
    public void setCurrentPrice(BigDecimal p)        { this.currentPrice = p; }
    public LocalDate getPurchaseDate()               { return purchaseDate; }
    public void setPurchaseDate(LocalDate d)         { this.purchaseDate = d; }
    public LocalDateTime getCreatedAt()              { return createdAt; }
    public void setCreatedAt(LocalDateTime t)        { this.createdAt = t; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id; private User user; private String ticker, name;
        private BigDecimal quantity, buyPrice, currentPrice;
        private LocalDate purchaseDate; private LocalDateTime createdAt;
        public Builder id(Long id)                       { this.id = id; return this; }
        public Builder user(User user)                   { this.user = user; return this; }
        public Builder ticker(String ticker)             { this.ticker = ticker; return this; }
        public Builder name(String name)                 { this.name = name; return this; }
        public Builder quantity(BigDecimal quantity)     { this.quantity = quantity; return this; }
        public Builder buyPrice(BigDecimal buyPrice)     { this.buyPrice = buyPrice; return this; }
        public Builder currentPrice(BigDecimal p)        { this.currentPrice = p; return this; }
        public Builder purchaseDate(LocalDate d)         { this.purchaseDate = d; return this; }
        public Builder createdAt(LocalDateTime t)        { this.createdAt = t; return this; }
        public Investment build() {
            return new Investment(id, user, ticker, name, quantity, buyPrice, currentPrice, purchaseDate, createdAt);
        }
    }
}
