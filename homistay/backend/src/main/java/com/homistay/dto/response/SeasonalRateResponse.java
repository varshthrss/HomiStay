package com.homistay.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class SeasonalRateResponse {
    private Long id;
    private Long propertyId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String adjustmentType;
    private BigDecimal adjustmentValue;
    private Boolean isActive;
}
