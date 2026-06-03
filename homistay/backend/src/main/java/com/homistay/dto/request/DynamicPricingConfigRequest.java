package com.homistay.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DynamicPricingConfigRequest {
    private Long propertyId;
    private Boolean enabled;
    private BigDecimal minPriceMultiplier;
    private BigDecimal maxPriceMultiplier;
    private Integer demandThreshold;
    private Integer lookbackMonths;
}
