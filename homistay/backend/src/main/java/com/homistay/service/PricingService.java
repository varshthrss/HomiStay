package com.homistay.service;

import com.homistay.dto.response.PricingBreakdownResponse;
import com.homistay.entity.*;
import com.homistay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final SeasonalRateRepository seasonalRateRepository;
    private final DynamicPricingConfigRepository configRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;

    private static final BigDecimal ONE = BigDecimal.valueOf(1.00);

    private record DefaultSeason(String name, Month startMonth, int startDay, Month endMonth, int endDay, BigDecimal multiplier) {
        public boolean contains(LocalDate date) {
            LocalDate start = LocalDate.of(date.getYear(), startMonth, startDay);
            LocalDate end = LocalDate.of(date.getYear(), endMonth, endDay);
            if (end.isBefore(start)) {
                end = end.plusYears(1);
            }
            return !date.isBefore(start) && !date.isAfter(end);
        }
    }

    private static final List<DefaultSeason> DEFAULT_SEASONS = List.of(
        new DefaultSeason("Summer Peak", Month.JUNE, 1, Month.AUGUST, 31, BigDecimal.valueOf(1.50)),
        new DefaultSeason("Winter Holidays", Month.DECEMBER, 15, Month.DECEMBER, 31, BigDecimal.valueOf(2.00)),
        new DefaultSeason("Winter Holidays", Month.JANUARY, 1, Month.JANUARY, 5, BigDecimal.valueOf(2.00)),
        new DefaultSeason("Spring Break", Month.MARCH, 15, Month.APRIL, 15, BigDecimal.valueOf(1.30)),
        new DefaultSeason("Autumn/Fall", Month.SEPTEMBER, 15, Month.NOVEMBER, 15, BigDecimal.valueOf(1.20))
    );

    public PricingBreakdownResponse calculatePrice(Long propertyId, LocalDate checkIn, LocalDate checkOut) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights < 1) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }

        BigDecimal basePricePerNight = property.getPricePerNight();
        BigDecimal cleaningFee = property.getCleaningFee() != null ? property.getCleaningFee() : BigDecimal.ZERO;

        // Get seasonal rates for the date range
        List<SeasonalRate> activeSeasons = seasonalRateRepository
                .findActiveByPropertyIdAndDateRange(propertyId, checkIn, checkOut);

        // Get or create dynamic pricing config
        DynamicPricingConfig config = configRepository.findByPropertyId(propertyId).orElse(null);

        // Calculate effective nightly prices
        List<Map<String, Object>> nightlyBreakdown = new ArrayList<>();
        BigDecimal totalBeforeFees = BigDecimal.ZERO;
        BigDecimal maxSeasonalMultiplier = ONE;
        BigDecimal maxDemandMultiplier = ONE;
        BigDecimal maxFixedAmount = BigDecimal.ZERO;
        String seasonName = null;

        LocalDate date = checkIn;
        while (date.isBefore(checkOut)) {
            BigDecimal nightPrice = basePricePerNight;
            BigDecimal dateSeasonalMultiplier = ONE;
            BigDecimal dateFixedAmount = BigDecimal.ZERO;

            // Apply hardcoded default seasons first
            for (DefaultSeason ds : DEFAULT_SEASONS) {
                if (ds.contains(date)) {
                    dateSeasonalMultiplier = ds.multiplier();
                    if (seasonName == null) seasonName = ds.name();
                    break;
                }
            }

            // Then apply DB seasonal rates (override defaults)
            for (SeasonalRate season : activeSeasons) {
                if (!date.isBefore(season.getStartDate()) && !date.isAfter(season.getEndDate())) {
                    seasonName = season.getName();
                    BigDecimal adjVal = season.getAdjustmentValue() != null ? season.getAdjustmentValue() : BigDecimal.ZERO;
                    if (season.getAdjustmentType() == SeasonalRate.AdjustmentType.PERCENTAGE) {
                        dateSeasonalMultiplier = ONE.add(
                            adjVal.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                        dateFixedAmount = BigDecimal.ZERO;
                    } else {
                        dateSeasonalMultiplier = ONE;
                        dateFixedAmount = adjVal;
                    }
                    break;
                }
            }

            // Apply seasonal adjustment
            nightPrice = nightPrice.multiply(dateSeasonalMultiplier).setScale(2, RoundingMode.HALF_UP);
            nightPrice = nightPrice.add(dateFixedAmount).setScale(2, RoundingMode.HALF_UP);

            // Apply demand-based multiplier
            BigDecimal dateDemandMultiplier = ONE;
            if (config == null || Boolean.TRUE.equals(config.getEnabled())) {
                dateDemandMultiplier = calculateDemandMultiplier(propertyId, config);
            }
            nightPrice = nightPrice.multiply(dateDemandMultiplier).setScale(2, RoundingMode.HALF_UP);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", date.toString());
            entry.put("basePrice", basePricePerNight);
            entry.put("seasonalMultiplier", dateSeasonalMultiplier);
            entry.put("fixedAmount", dateFixedAmount);
            entry.put("demandMultiplier", dateDemandMultiplier);
            entry.put("effectivePrice", nightPrice);
            nightlyBreakdown.add(entry);

            totalBeforeFees = totalBeforeFees.add(nightPrice);
            if (dateSeasonalMultiplier.compareTo(maxSeasonalMultiplier) > 0) maxSeasonalMultiplier = dateSeasonalMultiplier;
            if (dateDemandMultiplier.compareTo(maxDemandMultiplier) > 0) maxDemandMultiplier = dateDemandMultiplier;
            if (dateFixedAmount.compareTo(maxFixedAmount) > 0) maxFixedAmount = dateFixedAmount;
            date = date.plusDays(1);
        }

        BigDecimal effectivePricePerNight = totalBeforeFees.divide(BigDecimal.valueOf(nights), 2, RoundingMode.HALF_UP);
        BigDecimal subtotal = totalBeforeFees;
        BigDecimal total = subtotal.add(cleaningFee);

        return PricingBreakdownResponse.builder()
                .basePricePerNight(basePricePerNight)
                .nights((int) nights)
                .baseTotal(basePricePerNight.multiply(BigDecimal.valueOf(nights)))
                .seasonalMultiplier(maxSeasonalMultiplier)
                .demandMultiplier(maxDemandMultiplier)
                .effectivePricePerNight(effectivePricePerNight)
                .subtotal(subtotal)
                .cleaningFee(cleaningFee)
                .addOnsTotal(BigDecimal.ZERO)
                .total(total)
                .nightlyBreakdown(nightlyBreakdown)
                .seasonName(seasonName)
                .build();
    }

    public BigDecimal calculateTotalPrice(Long propertyId, LocalDate checkIn, LocalDate checkOut) {
        return calculatePrice(propertyId, checkIn, checkOut).getTotal();
    }

    public BigDecimal calculateSubtotal(Long propertyId, LocalDate checkIn, LocalDate checkOut) {
        return calculatePrice(propertyId, checkIn, checkOut).getSubtotal();
    }

    private BigDecimal calculateDemandMultiplier(Long propertyId, DynamicPricingConfig config) {
        int lookbackMonths;
        int demandThreshold;
        BigDecimal minMultiplier;
        BigDecimal maxMultiplier;

        if (config != null) {
            if (!Boolean.TRUE.equals(config.getEnabled())) {
                return ONE;
            }
            lookbackMonths = config.getLookbackMonths();
            demandThreshold = config.getDemandThreshold();
            minMultiplier = config.getMinPriceMultiplier();
            maxMultiplier = config.getMaxPriceMultiplier();
        } else {
            lookbackMonths = 3;
            demandThreshold = 5;
            minMultiplier = BigDecimal.valueOf(1.00);
            maxMultiplier = BigDecimal.valueOf(1.50);
        }

        LocalDateTime since = LocalDateTime.now().minusMonths(lookbackMonths);
        long bookingCount = bookingRepository.countConfirmedBookingsSince(propertyId, since);

        if (bookingCount >= demandThreshold) {
            double ratio = Math.min(1.0, (double) bookingCount / (demandThreshold * 2));
            BigDecimal range = maxMultiplier.subtract(minMultiplier);
            BigDecimal multiplier = minMultiplier
                    .add(range.multiply(BigDecimal.valueOf(ratio)))
                    .setScale(2, RoundingMode.HALF_UP);
            return multiplier;
        }

        return ONE;
    }
}
