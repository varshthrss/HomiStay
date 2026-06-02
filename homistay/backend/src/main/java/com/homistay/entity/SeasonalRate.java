package com.homistay.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "seasonal_rates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SeasonalRate {

    public enum AdjustmentType { PERCENTAGE, FIXED_AMOUNT }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    private String name;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false)
    @Builder.Default private AdjustmentType adjustmentType = AdjustmentType.PERCENTAGE;

    @Column(name = "adjustment_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal adjustmentValue;

    @Column(name = "price_multiplier", precision = 10, scale = 2)
    @Builder.Default private BigDecimal priceMultiplier = BigDecimal.ONE;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
