package com.finio.app.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "savings_goals")
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    private String icon;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "saved_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal savedAmount;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Comma-separated list of milestone percentages already emailed.
     * e.g. "25,50" means 25% and 50% emails have been sent, 75% and 100% have not.
     * Null or empty means no milestones have been sent yet.
     */
    @Column(name = "milestones_sent", length = 20)
    private String milestonesSent;

    public SavingsGoal() {}

    public SavingsGoal(Long id, User user, String name, String icon, BigDecimal targetAmount,
                       BigDecimal savedAmount, LocalDate targetDate, LocalDateTime createdAt) {
        this.id = id; this.user = user; this.name = name; this.icon = icon;
        this.targetAmount = targetAmount; this.savedAmount = savedAmount;
        this.targetDate = targetDate; this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.savedAmount == null) this.savedAmount = BigDecimal.ZERO;
    }

    public Long getId()                              { return id; }
    public void setId(Long id)                       { this.id = id; }
    public User getUser()                            { return user; }
    public void setUser(User user)                   { this.user = user; }
    public String getName()                          { return name; }
    public void setName(String name)                 { this.name = name; }
    public String getIcon()                          { return icon; }
    public void setIcon(String icon)                 { this.icon = icon; }
    public BigDecimal getTargetAmount()              { return targetAmount; }
    public void setTargetAmount(BigDecimal amount)   { this.targetAmount = amount; }
    public BigDecimal getSavedAmount()               { return savedAmount; }
    public void setSavedAmount(BigDecimal amount)    { this.savedAmount = amount; }
    public LocalDate getTargetDate()                 { return targetDate; }
    public void setTargetDate(LocalDate d)           { this.targetDate = d; }
    public LocalDateTime getCreatedAt()              { return createdAt; }
    public void setCreatedAt(LocalDateTime t)        { this.createdAt = t; }
    public String getMilestonesSent()                { return milestonesSent; }
    public void setMilestonesSent(String s)          { this.milestonesSent = s; }

    // ── Milestone helpers ─────────────────────────────────────────────────────

    /** Returns the set of milestones already emailed, e.g. {25, 50} */
    public Set<Integer> getSentMilestonesAsSet() {
        if (milestonesSent == null || milestonesSent.isBlank()) return new HashSet<>();
        return Arrays.stream(milestonesSent.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toCollection(HashSet::new));
    }

    /** Marks a milestone as sent and persists it to the comma-separated string */
    public void markMilestoneSent(int milestone) {
        Set<Integer> sent = getSentMilestonesAsSet();
        sent.add(milestone);
        this.milestonesSent = sent.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    /** Returns true if this milestone has NOT been sent yet */
    public boolean isMilestoneNotYetSent(int milestone) {
        return !getSentMilestonesAsSet().contains(milestone);
    }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private Long id; private User user; private String name, icon;
        private BigDecimal targetAmount, savedAmount; private LocalDate targetDate;
        private LocalDateTime createdAt;
        public Builder id(Long id)                     { this.id = id; return this; }
        public Builder user(User user)                 { this.user = user; return this; }
        public Builder name(String name)               { this.name = name; return this; }
        public Builder icon(String icon)               { this.icon = icon; return this; }
        public Builder targetAmount(BigDecimal amount) { this.targetAmount = amount; return this; }
        public Builder savedAmount(BigDecimal amount)  { this.savedAmount = amount; return this; }
        public Builder targetDate(LocalDate d)         { this.targetDate = d; return this; }
        public Builder createdAt(LocalDateTime t)      { this.createdAt = t; return this; }
        public SavingsGoal build() {
            return new SavingsGoal(id, user, name, icon, targetAmount, savedAmount, targetDate, createdAt);
        }
    }
}