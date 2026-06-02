package com.homistay.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class MonthlyEarningsResponse {
    private String month;
    private BigDecimal amount;
}
