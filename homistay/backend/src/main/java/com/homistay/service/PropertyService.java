package com.homistay.service;

import com.homistay.dto.request.AddonRequest;
import com.homistay.dto.request.PropertyRequest;
import com.homistay.dto.request.PropertySearchRequest;
import com.homistay.dto.request.AvailabilityBlockRequest;
import com.homistay.dto.response.AddonResponse;
import com.homistay.exception.BusinessException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import com.homistay.dto.response.PageResponse;
import com.homistay.dto.response.PropertyResponse;
import com.homistay.entity.*;
import com.homistay.exception.ResourceNotFoundException;
import com.homistay.exception.UnauthorizedException;
import com.homistay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final AvailabilityRepository availabilityRepository;
    private final BookingRepository bookingRepository;
    private final PropertyAddonRepository propertyAddonRepository;
    private final SeasonalRateRepository seasonalRateRepository;

    @Transactional(readOnly = true)
    public PageResponse<PropertyResponse> search(PropertySearchRequest req) {

        // 🔥 ADD THIS BLOCK RIGHT HERE
        if (req.getCity() != null && req.getCity().isBlank()) {
            req.setCity(null);
        }

        Sort sort = req.getSortDir().equalsIgnoreCase("desc")
                ? Sort.by(req.getSortBy()).descending()
                : Sort.by(req.getSortBy()).ascending();

        Pageable pageable = PageRequest.of(req.getPage(), req.getSize(), sort);

        Page<Property> page = propertyRepository.searchAvailable(
                req.getCity(), req.getType(), req.getMinPrice(), req.getMaxPrice(),
                req.getGuests(), req.getCheckIn(), req.getCheckOut(), pageable);

        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PropertyResponse getById(Long id) {
        return getById(id, null);
    }

    @Transactional(readOnly = true)
    public PropertyResponse getById(Long id, String userEmail) {
        Property p = propertyRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Property", id));
        return mapToResponse(p, userEmail);
    }

    @Transactional
    public PropertyResponse create(PropertyRequest req, String hostEmail) {
        User host = userRepository.findByEmail(hostEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Property property = Property.builder()
                .host(host).title(req.getTitle()).description(req.getDescription())
                .type(req.getType()).city(req.getCity()).country(req.getCountry())
                .address(req.getAddress()).latitude(req.getLatitude()).longitude(req.getLongitude())
                .cleaningFee(req.getCleaningFee() != null ? req.getCleaningFee() : java.math.BigDecimal.ZERO)
                .pricePerNight(req.getPricePerNight()).maxGuests(req.getMaxGuests())
                .bedrooms(req.getBedrooms()).bathrooms(req.getBathrooms())
                .amenities(req.getAmenities()).isActive(true)
                .allowsChildren(req.getAllowsChildren() != null ? req.getAllowsChildren() : true)
                .allowsInfants(req.getAllowsInfants() != null ? req.getAllowsInfants() : true)
                .allowsPets(req.getAllowsPets() != null ? req.getAllowsPets() : false)
                .houseRules(req.getHouseRules())
                .guestRequirements(req.getGuestRequirements())
                .checkInInstructions(req.getCheckInInstructions())
                .build();

        Property saved = propertyRepository.save(property);

        if (req.getImageUrls() != null) {
            List<PropertyImage> images = req.getImageUrls().stream()
                    .map(url -> PropertyImage.builder()
                            .property(saved).url(url)
                            .isPrimary(req.getImageUrls().indexOf(url) == 0)
                            .displayOrder(req.getImageUrls().indexOf(url))
                            .build())
                    .collect(Collectors.toList());
            saved.setImages(images);
            propertyRepository.save(saved);
        }

        return mapToResponse(saved, hostEmail);
    }

    @Transactional
    public PropertyResponse update(Long id, PropertyRequest req, String hostEmail) {
        Property p = getPropertyAndVerifyOwner(id, hostEmail);
        p.setTitle(req.getTitle()); p.setDescription(req.getDescription());
        p.setType(req.getType()); p.setCity(req.getCity()); p.setCountry(req.getCountry());
        p.setAddress(req.getAddress()); p.setLatitude(req.getLatitude()); p.setLongitude(req.getLongitude());
        p.setCleaningFee(req.getCleaningFee() != null ? req.getCleaningFee() : java.math.BigDecimal.ZERO);
        p.setPricePerNight(req.getPricePerNight()); p.setMaxGuests(req.getMaxGuests());
        p.setBedrooms(req.getBedrooms()); p.setBathrooms(req.getBathrooms());
        p.setAmenities(req.getAmenities());
        if (req.getAllowsChildren() != null) p.setAllowsChildren(req.getAllowsChildren());
        if (req.getAllowsInfants() != null) p.setAllowsInfants(req.getAllowsInfants());
        if (req.getAllowsPets() != null) p.setAllowsPets(req.getAllowsPets());
        p.setHouseRules(req.getHouseRules());
        if (req.getGuestRequirements() != null) p.setGuestRequirements(req.getGuestRequirements());
        if (req.getCheckInInstructions() != null) p.setCheckInInstructions(req.getCheckInInstructions());
        if (req.getIsActive() != null) {
            p.setIsActive(req.getIsActive());
        }
        return mapToResponse(propertyRepository.save(p), hostEmail);
    }

    @Transactional
    public void delete(Long id, String hostEmail) {
        Property p = getPropertyAndVerifyOwner(id, hostEmail);
        propertyRepository.delete(p);
    }

    @Transactional(readOnly = true)
    public PageResponse<PropertyResponse> getHostProperties(String hostEmail, int page, int size) {
        User host = userRepository.findByEmail(hostEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Property> result = propertyRepository.findByHostId(host.getId(), pageable);
        List<PropertyResponse> content = result.getContent().stream()
                .map(p -> mapToResponse(p, hostEmail))
                .collect(Collectors.toList());
        return PageResponse.<PropertyResponse>builder()
                .content(content)
                .page(result.getNumber()).size(result.getSize())
                .totalElements(result.getTotalElements()).totalPages(result.getTotalPages())
                .last(result.isLast()).build();
    }

    private Property getPropertyAndVerifyOwner(Long id, String email) {
        Property p = propertyRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Property", id));
        if (!p.getHost().getEmail().equals(email)) {
            throw new UnauthorizedException("You do not own this property");
        }
        return p;
    }

    public PropertyResponse mapToResponse(Property p) {
        return mapToResponse(p, null);
    }

    public PropertyResponse mapToResponse(Property p, String userEmail) {
        Double avgRating = reviewRepository.averageRatingByPropertyId(p.getId());
        List<Review> reviews = p.getReviews() != null ? p.getReviews() : List.of();

        String primaryImage = p.getImages() != null
                ? p.getImages().stream().filter(PropertyImage::getIsPrimary)
                    .map(PropertyImage::getUrl).findFirst()
                    .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl())
                : null;

        List<String> imageUrls = p.getImages() != null
                ? p.getImages().stream().map(PropertyImage::getUrl).collect(Collectors.toList())
                : List.of();

        List<String> amenityList = p.getAmenities() != null
                ? Arrays.asList(p.getAmenities().split(","))
                : List.of();

        String checkInInstructions = null;
        if (userEmail != null && p.getHost().getEmail().equals(userEmail)) {
            checkInInstructions = p.getCheckInInstructions();
        }

        BigDecimal effectivePricePerNight = p.getPricePerNight();
        String seasonName = null;
        List<SeasonalRate> activeSeasons = seasonalRateRepository.findActiveByPropertyIdAndDate(p.getId(), LocalDate.now());
        if (!activeSeasons.isEmpty()) {
            SeasonalRate season = activeSeasons.get(0);
            seasonName = season.getName();
            BigDecimal adjVal = season.getAdjustmentValue() != null ? season.getAdjustmentValue() : BigDecimal.ZERO;
            if (season.getAdjustmentType() == SeasonalRate.AdjustmentType.PERCENTAGE) {
                effectivePricePerNight = p.getPricePerNight()
                        .multiply(BigDecimal.ONE.add(adjVal.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                        .setScale(2, RoundingMode.HALF_UP);
            } else {
                effectivePricePerNight = p.getPricePerNight()
                        .add(adjVal)
                        .setScale(2, RoundingMode.HALF_UP);
            }
        }

        return PropertyResponse.builder()
                .id(p.getId()).hostId(p.getHost().getId())
                .hostName(p.getHost().getFullName()).hostAvatar(p.getHost().getAvatarUrl())
                .title(p.getTitle()).description(p.getDescription()).type(p.getType())
                .city(p.getCity()).country(p.getCountry()).address(p.getAddress())
                .latitude(p.getLatitude()).longitude(p.getLongitude())
                .pricePerNight(p.getPricePerNight()).maxGuests(p.getMaxGuests())
                .bedrooms(p.getBedrooms()).bathrooms(p.getBathrooms())
                .amenities(amenityList).imageUrls(imageUrls).primaryImageUrl(primaryImage)
                .averageRating(avgRating).reviewCount(reviews.size())
                .isActive(p.getIsActive()).createdAt(p.getCreatedAt())
                .allowsChildren(p.getAllowsChildren())
                .allowsInfants(p.getAllowsInfants())
                .allowsPets(p.getAllowsPets())
                .cleaningFee(p.getCleaningFee())
                .effectivePricePerNight(effectivePricePerNight)
                .seasonName(seasonName)
                .houseRules(p.getHouseRules())
                .guestRequirements(p.getGuestRequirements())
                .checkInInstructions(checkInInstructions)
                .hostBio(p.getHost().getBio())
                .hostJoinedAt(p.getHost().getCreatedAt())
                .addons(propertyAddonRepository.findByPropertyId(p.getId()).stream()
                    .map(a -> AddonResponse.builder()
                        .id(a.getId()).propertyId(p.getId())
                        .name(a.getName()).description(a.getDescription())
                        .price(a.getPrice()).isActive(a.getIsActive())
                        .build())
                    .collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getBlockedDates(Long propertyId) {
        return availabilityRepository.findBlockedDatesByPropertyId(propertyId);
    }

    @Transactional
    public void toggleAvailability(Long propertyId, AvailabilityBlockRequest req, String hostEmail) {
        Property property = getPropertyAndVerifyOwner(propertyId, hostEmail);

        LocalDate start = req.getStartDate();
        LocalDate end = req.getEndDate();

        if (end.isBefore(start)) {
            throw new BusinessException("End date must be on or after start date");
        }

        if (req.getBlock()) {
            // Check for overlapping active bookings
            if (bookingRepository.hasOverlappingBookings(propertyId, start, end)) {
                throw new BusinessException("Cannot block these dates: they conflict with an existing booking.");
            }

            // Block dates: create Availability records with reason HOST_BLOCKED
            LocalDate curr = start;
            while (!curr.isAfter(end)) {
                LocalDate finalCurr = curr;
                availabilityRepository.findByPropertyIdAndDateBetween(propertyId, finalCurr, finalCurr)
                        .stream().findFirst().ifPresentOrElse(
                                a -> {
                                    if (!"BOOKED".equals(a.getReason())) {
                                        a.setIsAvailable(false);
                                        a.setReason("HOST_BLOCKED");
                                        availabilityRepository.save(a);
                                    }
                                },
                                () -> availabilityRepository.save(Availability.builder()
                                        .property(property)
                                        .date(finalCurr)
                                        .isAvailable(false)
                                        .reason("HOST_BLOCKED")
                                        .build())
                        );
                curr = curr.plusDays(1);
            }
        } else {
            // Unblock dates: delete HOST_BLOCKED availability records
            availabilityRepository.deleteHostBlocksByPropertyIdAndDateBetween(propertyId, start, end);
        }
    }

    // ── Feature 4: Add-on CRUD ─────────────────────────────────────────

    public List<AddonResponse> getPropertyAddons(Long propertyId, String hostEmail) {
        Property p = getPropertyAndVerifyOwner(propertyId, hostEmail);
        return propertyAddonRepository.findByPropertyId(p.getId()).stream()
                .map(a -> AddonResponse.builder()
                        .id(a.getId()).propertyId(p.getId())
                        .name(a.getName()).description(a.getDescription())
                        .price(a.getPrice()).isActive(a.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public AddonResponse createAddon(Long propertyId, AddonRequest req, String hostEmail) {
        Property p = getPropertyAndVerifyOwner(propertyId, hostEmail);
        PropertyAddon addon = PropertyAddon.builder()
                .property(p)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .build();
        PropertyAddon saved = propertyAddonRepository.save(addon);
        return AddonResponse.builder()
                .id(saved.getId()).propertyId(p.getId())
                .name(saved.getName()).description(saved.getDescription())
                .price(saved.getPrice()).isActive(saved.getIsActive())
                .build();
    }

    @Transactional
    public void deleteAddon(Long propertyId, Long addonId, String hostEmail) {
        Property p = getPropertyAndVerifyOwner(propertyId, hostEmail);
        PropertyAddon addon = propertyAddonRepository.findById(java.util.Objects.requireNonNull(addonId))
                .orElseThrow(() -> new ResourceNotFoundException("Addon", addonId));
        if (!addon.getProperty().getId().equals(p.getId())) {
            throw new UnauthorizedException("Addon does not belong to this property");
        }
        propertyAddonRepository.delete(addon);
    }

    private PageResponse<PropertyResponse> toPageResponse(Page<Property> page) {
        return PageResponse.<PropertyResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }
}
