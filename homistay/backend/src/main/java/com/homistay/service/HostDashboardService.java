package com.homistay.service;

import com.homistay.dto.response.BookingResponse;
import com.homistay.dto.response.HostDashboardResponse;
import com.homistay.entity.*;
import com.homistay.enums.BookingStatus;
import com.homistay.exception.ResourceNotFoundException;
import com.homistay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import com.homistay.dto.response.MonthlyEarningsResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HostDashboardService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;
    private final ReviewRepository reviewRepository;

    public HostDashboardResponse getDashboard(String hostEmail) {
        User host = userRepository.findByEmail(hostEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Property> properties = propertyRepository.findByHostIdAndIsActiveTrue(host.getId());
        int total = properties.size();

        // Get ALL bookings for this host (for accurate counts)
        Page<Booking> allBookings = bookingRepository.findByPropertyHostId(
                host.getId(), PageRequest.of(0, Integer.MAX_VALUE, Sort.by("createdAt").descending()));

        long pending   = allBookings.getContent().stream().filter(b -> b.getStatus() == BookingStatus.PENDING).count();
        long confirmed = allBookings.getContent().stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count();

        BigDecimal totalEarnings = paymentRepository.totalEarningsByHostId(host.getId());
        BigDecimal monthlyEarnings = paymentRepository.earningsSince(host.getId(), LocalDateTime.now().minusMonths(1));

        // Get recent 5 for the display
        List<BookingResponse> recentBookings = allBookings.getContent().stream()
                .limit(5)
                .map(bookingService::mapToResponse).collect(Collectors.toList());

        // Compute average rating across all host's properties
        List<Long> propertyIds = properties.stream().map(Property::getId).collect(Collectors.toList());
        Double averageRating = null;
        if (!propertyIds.isEmpty()) {
            averageRating = reviewRepository.averageRatingByPropertyIds(propertyIds);
        }

        return HostDashboardResponse.builder()
                .totalProperties(total).activeProperties(total)
                .totalBookings((int) allBookings.getTotalElements())
                .pendingBookings((int) pending).confirmedBookings((int) confirmed)
                .totalEarnings(totalEarnings != null ? totalEarnings : BigDecimal.ZERO)
                .monthlyEarnings(monthlyEarnings != null ? monthlyEarnings : BigDecimal.ZERO)
                .averageRating(averageRating)
                .recentBookings(recentBookings)
                .build();
    }

    public List<MonthlyEarningsResponse> getMonthlyEarnings(String hostEmail) {
        User host = userRepository.findByEmail(hostEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Object[]> rows = paymentRepository.monthlyEarningsSince(host.getId(), LocalDateTime.now().minusMonths(12));

        List<MonthlyEarningsResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            String month = (String) row[0];
            BigDecimal amount = (BigDecimal) row[2];
            result.add(MonthlyEarningsResponse.builder()
                    .month(month)
                    .amount(amount != null ? amount : BigDecimal.ZERO)
                    .build());
        }
        return result;
    }
}

