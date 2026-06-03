package com.homistay.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class SeasonalRateRequest {
    private Long propertyId;
    private List<Long> propertyIds;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String adjustmentType;
    private BigDecimal adjustmentValue;
    private Boolean isActive;
}
