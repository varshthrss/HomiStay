package com.homistay.dto.response;

import com.homistay.enums.PropertyType;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class PropertyResponse {
    private Long id;
    private Long hostId;
    private String hostName;
    private String hostAvatar;
    private String title;
    private String description;
    private PropertyType type;
    private String city;
    private String country;
    private String address;
    private Double latitude;
    private Double longitude;
    private BigDecimal pricePerNight;
    private Integer maxGuests;
    private Integer bedrooms;
    private Integer bathrooms;
    private List<String> amenities;
    private List<String> imageUrls;
    private String primaryImageUrl;
    private Double averageRating;
    private Integer reviewCount;
    private Boolean isActive;
    private Boolean allowsChildren;
    private Boolean allowsInfants;
    private Boolean allowsPets;
    private LocalDateTime createdAt;
    private java.math.BigDecimal cleaningFee;
    private java.math.BigDecimal effectivePricePerNight;
    private String seasonName;
    private String houseRules;
    private String guestRequirements;
    private String checkInInstructions;
    private String hostBio;
    private java.time.LocalDateTime hostJoinedAt;
    private List<AddonResponse> addons;
}
