package com.homistay.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dynamic_pricing_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DynamicPricingConfig {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false, unique = true)
    private Property property;

    @Builder.Default private Boolean enabled = false;

    @Column(name = "min_price_multiplier", nullable = false)
    @Builder.Default private BigDecimal minPriceMultiplier = BigDecimal.valueOf(1.00);

    @Column(name = "max_price_multiplier", nullable = false)
    @Builder.Default private BigDecimal maxPriceMultiplier = BigDecimal.valueOf(2.00);

    @Column(name = "demand_threshold", nullable = false)
    @Builder.Default private Integer demandThreshold = 5;

    @Column(name = "lookback_months", nullable = false)
    @Builder.Default private Integer lookbackMonths = 3;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
