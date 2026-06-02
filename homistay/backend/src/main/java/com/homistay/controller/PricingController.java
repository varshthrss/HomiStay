package com.homistay.controller;

import com.homistay.dto.request.DynamicPricingConfigRequest;
import com.homistay.dto.request.SeasonalRateRequest;
import com.homistay.dto.response.DynamicPricingConfigResponse;
import com.homistay.dto.response.PricingBreakdownResponse;
import com.homistay.dto.response.SeasonalRateResponse;
import com.homistay.entity.DynamicPricingConfig;
import com.homistay.entity.Property;
import com.homistay.entity.SeasonalRate;
import com.homistay.exception.ResourceNotFoundException;
import com.homistay.exception.UnauthorizedException;
import com.homistay.repository.DynamicPricingConfigRepository;
import com.homistay.repository.PropertyRepository;
import com.homistay.repository.SeasonalRateRepository;
import com.homistay.service.PricingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Tag(name = "Pricing", description = "Dynamic pricing: seasonal rates & demand-based pricing")
public class PricingController {

    private final PricingService pricingService;
    private final SeasonalRateRepository seasonalRateRepository;
    private final DynamicPricingConfigRepository configRepository;
    private final PropertyRepository propertyRepository;

    // ── ── Public: Get price breakdown for a stay ──────────────────────────────

    @GetMapping("/api/properties/{propertyId}/pricing")
    @Operation(summary = "Get dynamic pricing breakdown for a date range (public)")
    public ResponseEntity<PricingBreakdownResponse> getPricingBreakdown(
            @PathVariable Long propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return ResponseEntity.ok(pricingService.calculatePrice(propertyId, checkIn, checkOut));
    }

    // ── ── Host: Manage Seasonal Rates ─────────────────────────────────────────

    @PostMapping("/api/host/pricing/seasons")
    @Operation(summary = "Create seasonal rate(s) for one or multiple properties", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<SeasonalRateResponse>> createSeasonalRate(
            @Valid @RequestBody SeasonalRateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        String type = req.getAdjustmentType() != null ? req.getAdjustmentType() : "PERCENTAGE";
        List<Long> targets = req.getPropertyIds() != null && !req.getPropertyIds().isEmpty()
                ? req.getPropertyIds()
                : req.getPropertyId() != null ? List.of(req.getPropertyId())
                : List.of();

        if (targets.isEmpty()) {
            throw new IllegalArgumentException("propertyId or propertyIds is required");
        }

        List<SeasonalRate> saved = new java.util.ArrayList<>();
        for (Long pid : targets) {
            Property property = propertyRepository.findById(pid)
                    .orElseThrow(() -> new ResourceNotFoundException("Property", pid));
            if (!property.getHost().getEmail().equals(userDetails.getUsername())) {
                throw new UnauthorizedException("You do not own property: " + pid);
            }
            seasonalRateRepository.findByPropertyId(pid).stream()
                .filter(s -> s.getName().equals(req.getName())
                    && s.getStartDate().equals(req.getStartDate())
                    && s.getEndDate().equals(req.getEndDate()))
                .findFirst().ifPresent(s -> {
                    throw new com.homistay.exception.BusinessException(
                        "Season '" + req.getName() + "' already exists for property: " + pid);
                });

            SeasonalRate rate = SeasonalRate.builder()
                    .property(property)
                    .name(req.getName().trim())
                    .startDate(req.getStartDate())
                    .endDate(req.getEndDate())
                    .adjustmentType(SeasonalRate.AdjustmentType.valueOf(type))
                    .adjustmentValue(req.getAdjustmentValue())
                    .isActive(true)
                    .build();

            saved.add(seasonalRateRepository.save(rate));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(
                saved.stream().map(this::mapToSeasonalResponse).collect(java.util.stream.Collectors.toList()));
    }

    @PutMapping("/api/host/pricing/seasons/{id}")
    @Operation(summary = "Update a seasonal rate (host only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<SeasonalRateResponse> updateSeasonalRate(
            @PathVariable Long id,
            @Valid @RequestBody SeasonalRateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        SeasonalRate rate = seasonalRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SeasonalRate", id));
        if (!rate.getProperty().getHost().getEmail().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You do not own this property");
        }

        rate.setName(req.getName());
        rate.setStartDate(req.getStartDate());
        rate.setEndDate(req.getEndDate());
        if (req.getAdjustmentType() != null) {
            rate.setAdjustmentType(SeasonalRate.AdjustmentType.valueOf(req.getAdjustmentType()));
        }
        if (req.getAdjustmentValue() != null) {
            rate.setAdjustmentValue(req.getAdjustmentValue());
        }

        SeasonalRate saved = seasonalRateRepository.save(rate);
        return ResponseEntity.ok(mapToSeasonalResponse(saved));
    }

    @DeleteMapping("/api/host/pricing/seasons/{id}")
    @Operation(summary = "Delete a seasonal rate (host only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteSeasonalRate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        SeasonalRate rate = seasonalRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SeasonalRate", id));
        if (!rate.getProperty().getHost().getEmail().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You do not own this property");
        }
        seasonalRateRepository.delete(rate);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/host/pricing/seasons")
    @Operation(summary = "List seasonal rates for a property (host only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<SeasonalRateResponse>> listSeasonalRates(
            @RequestParam Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));
        if (!property.getHost().getEmail().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You do not own this property");
        }

        List<SeasonalRate> rates = seasonalRateRepository.findByPropertyId(propertyId);
        return ResponseEntity.ok(rates.stream().map(this::mapToSeasonalResponse).collect(Collectors.toList()));
    }

    // ── ── Host: Manage Dynamic Pricing Config ─────────────────────────────────

    @PutMapping("/api/host/pricing/config")
    @Operation(summary = "Save dynamic pricing config (host only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DynamicPricingConfigResponse> saveConfig(
            @Valid @RequestBody DynamicPricingConfigRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        Property property = propertyRepository.findById(req.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", req.getPropertyId()));
        if (!property.getHost().getEmail().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You do not own this property");
        }

        DynamicPricingConfig config = configRepository.findByPropertyId(req.getPropertyId())
                .orElse(DynamicPricingConfig.builder().property(property).build());

        if (req.getEnabled() != null) config.setEnabled(req.getEnabled());
        if (req.getMinPriceMultiplier() != null) config.setMinPriceMultiplier(req.getMinPriceMultiplier());
        if (req.getMaxPriceMultiplier() != null) config.setMaxPriceMultiplier(req.getMaxPriceMultiplier());
        if (req.getDemandThreshold() != null) config.setDemandThreshold(req.getDemandThreshold());
        if (req.getLookbackMonths() != null) config.setLookbackMonths(req.getLookbackMonths());
        config.setUpdatedAt(java.time.LocalDateTime.now());

        DynamicPricingConfig saved = configRepository.save(config);
        return ResponseEntity.ok(mapToConfigResponse(saved));
    }

    @GetMapping("/api/host/pricing/config/{propertyId}")
    @Operation(summary = "Get dynamic pricing config (host only)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DynamicPricingConfigResponse> getConfig(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", propertyId));
        if (!property.getHost().getEmail().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You do not own this property");
        }

        DynamicPricingConfig config = configRepository.findByPropertyId(propertyId)
                .orElse(null);
        if (config == null) {
            return ResponseEntity.ok(DynamicPricingConfigResponse.builder()
                    .propertyId(propertyId)
                    .enabled(false)
                    .minPriceMultiplier(java.math.BigDecimal.valueOf(1.00))
                    .maxPriceMultiplier(java.math.BigDecimal.valueOf(2.00))
                    .demandThreshold(5)
                    .lookbackMonths(3)
                    .build());
        }
        return ResponseEntity.ok(mapToConfigResponse(config));
    }

    // ── ── Mappers ─────────────────────────────────────────────────────────────

    private SeasonalRateResponse mapToSeasonalResponse(SeasonalRate r) {
        return SeasonalRateResponse.builder()
                .id(r.getId())
                .propertyId(r.getProperty().getId())
                .name(r.getName())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .adjustmentType(r.getAdjustmentType().name())
                .adjustmentValue(r.getAdjustmentValue())
                .isActive(r.getIsActive())
                .build();
    }

    private DynamicPricingConfigResponse mapToConfigResponse(DynamicPricingConfig c) {
        return DynamicPricingConfigResponse.builder()
                .id(c.getId())
                .propertyId(c.getProperty().getId())
                .enabled(c.getEnabled())
                .minPriceMultiplier(c.getMinPriceMultiplier())
                .maxPriceMultiplier(c.getMaxPriceMultiplier())
                .demandThreshold(c.getDemandThreshold())
                .lookbackMonths(c.getLookbackMonths())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
