package com.homistay.service;

import com.homistay.dto.request.BookingRequest;
import com.homistay.dto.request.ModificationRequest;
import com.homistay.dto.response.BookingAddonResponse;
import com.homistay.dto.response.BookingResponse;
import com.homistay.dto.response.MessageResponse;
import com.homistay.dto.response.ModificationResponse;
import com.homistay.dto.response.PageResponse;
import com.homistay.dto.response.PaymentResponse;
import com.homistay.entity.*;
import com.homistay.enums.BookingStatus;
import com.homistay.enums.PaymentStatus;
import com.homistay.exception.BusinessException;
import com.homistay.exception.ResourceNotFoundException;
import com.homistay.exception.UnauthorizedException;
import com.homistay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;
    private final PaymentRepository paymentRepository;
    private final PropertyAddonRepository propertyAddonRepository;
    private final BookingAddonRepository bookingAddonRepository;
    private final BookingModificationRepository bookingModificationRepository;
    private final BookingMessageRepository bookingMessageRepository;
    private final PricingService pricingService;

    /**
     * Creates a booking with PESSIMISTIC LOCK to prevent double booking.
     * The lock ensures no two concurrent requests can book the same dates.
     */
    @Transactional
    public BookingResponse createBooking(BookingRequest req, String guestEmail) {
        // Validate dates
        if (!req.getCheckOut().isAfter(req.getCheckIn())) {
            throw new BusinessException("Check-out must be after check-in");
        }
        if (req.getCheckIn().isBefore(LocalDate.now())) {
            throw new BusinessException("Check-in cannot be in the past");
        }

        Property property = propertyRepository.findById(java.util.Objects.requireNonNull(req.getPropertyId()))
                .orElseThrow(() -> new ResourceNotFoundException("Property", req.getPropertyId()));

        if (!property.getIsActive()) {
            throw new BusinessException("Property is not available for booking");
        }
        if (req.getGuestsCount() > property.getMaxGuests()) {
            throw new BusinessException("Exceeds max guests: " + property.getMaxGuests());
        }

        int children = req.getChildren() != null ? req.getChildren() : 0;
        int infants = req.getInfants() != null ? req.getInfants() : 0;
        int pets = req.getPets() != null ? req.getPets() : 0;

        if (children > 0 && !property.getAllowsChildren()) {
            throw new BusinessException("This property does not allow children");
        }
        if (infants > 0 && !property.getAllowsInfants()) {
            throw new BusinessException("This property does not allow infants");
        }
        if (pets > 0 && !property.getAllowsPets()) {
            throw new BusinessException("This property does not allow pets");
        }

        User guest = userRepository.findByEmail(guestEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if ((guest.getRole() == com.homistay.enums.Role.HOST || guest.getRole() == com.homistay.enums.Role.ADMIN)
                && property.getHost().getId().equals(guest.getId())) {
            throw new BusinessException("Hosts cannot book their own property");
        }

        // 🔒 PESSIMISTIC LOCK — prevents double booking
        List<Booking> overlapping = bookingRepository.findOverlappingBookingsWithLock(
                req.getPropertyId(), req.getCheckIn(), req.getCheckOut());

        if (!overlapping.isEmpty()) {
            throw new BusinessException("Property is already booked for these dates");
        }

        long nights = ChronoUnit.DAYS.between(req.getCheckIn(), req.getCheckOut());
        BigDecimal subtotal = pricingService.calculateSubtotal(req.getPropertyId(), req.getCheckIn(), req.getCheckOut());
        BigDecimal totalPrice = subtotal.add(
            property.getCleaningFee() != null ? property.getCleaningFee() : BigDecimal.ZERO);

        Booking booking = Booking.builder()
                .guest(guest).property(property)
                .checkIn(req.getCheckIn()).checkOut(req.getCheckOut())
                .guestsCount(req.getGuestsCount())
                .adults(req.getAdults() != null ? req.getAdults() : req.getGuestsCount())
                .children(req.getChildren() != null ? req.getChildren() : 0)
                .infants(req.getInfants() != null ? req.getInfants() : 0)
                .pets(req.getPets() != null ? req.getPets() : 0)
                .totalPrice(totalPrice)
                .status(BookingStatus.CONFIRMED)
                .specialRequests(req.getSpecialRequests())
                .build();

        Booking saved = bookingRepository.save(booking);

        // Save selected addons
        List<BookingAddon> savedAddons = new ArrayList<>();
        if (req.getAddons() != null && !req.getAddons().isEmpty()) {
            for (var sel : req.getAddons()) {
                PropertyAddon addon = propertyAddonRepository.findById(sel.getAddonId())
                    .orElseThrow(() -> new BusinessException("Addon not found: " + sel.getAddonId()));
                if (!addon.getIsActive()) {
                    throw new BusinessException("Addon is no longer available: " + addon.getName());
                }
                BigDecimal addonPrice = addon.getPrice().multiply(BigDecimal.valueOf(sel.getQuantity()));
                BookingAddon ba = BookingAddon.builder()
                    .booking(saved).addon(addon)
                    .quantity(sel.getQuantity())
                    .price(addonPrice)
                    .build();
                savedAddons.add(bookingAddonRepository.save(ba));
            }
            saved.setTotalPrice(saved.getTotalPrice().add(
                savedAddons.stream().map(BookingAddon::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add)
            ));
            bookingRepository.save(saved);
        }

        // Mark dates as unavailable
        blockDates(property, req.getCheckIn(), req.getCheckOut());

        // Simulate payment
        Payment payment = Payment.builder()
                .booking(saved).amount(saved.getTotalPrice())
                .status(PaymentStatus.PAID)
                .paymentMethod(req.getPaymentMethod())
                .transactionId("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paidAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);
        saved.setPayment(payment);

        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean isGuest = booking.getGuest().getEmail().equals(userEmail);
        boolean isHost  = booking.getProperty().getHost().getEmail().equals(userEmail);

        if (!isGuest && !isHost) {
            throw new UnauthorizedException("Not authorized to cancel this booking");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BusinessException("Booking is already cancelled");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel a completed booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Unblock dates
        availabilityRepository.deleteByPropertyIdAndDateBetween(
                booking.getProperty().getId(), booking.getCheckIn(), booking.getCheckOut());

        // Calculate refund
        BigDecimal refundAmount = BigDecimal.ZERO;
        if (booking.getPayment() != null) {
            LocalDate today = LocalDate.now();

            if (isHost) {
                // Host cancellation: full refund, no penalty
                refundAmount = booking.getTotalPrice();
                booking.getPayment().setStatus(PaymentStatus.REFUNDED);
            } else {
                long totalNights = ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
                long usedNights = ChronoUnit.DAYS.between(booking.getCheckIn(), today);
                if (usedNights < 0) usedNights = 0;
                if (usedNights > totalNights) usedNights = totalNights;

                if (usedNights == 0) {
                    // Cancel before check-in: 90% refund (10% service fee)
                    refundAmount = booking.getTotalPrice().multiply(BigDecimal.valueOf(0.9));
                    booking.getPayment().setStatus(PaymentStatus.REFUNDED);
                } else {
                    // Cancel during stay: refund unused nights with 30% penalty on remaining value
                    long unusedNights = totalNights - usedNights;
                    if (unusedNights > 0) {
                        BigDecimal nightlyRate = booking.getTotalPrice().divide(BigDecimal.valueOf(totalNights), 2, java.math.RoundingMode.HALF_UP);
                        BigDecimal unusedValue = nightlyRate.multiply(BigDecimal.valueOf(unusedNights));
                        refundAmount = unusedValue.multiply(BigDecimal.valueOf(0.7));
                    }
                    booking.getPayment().setStatus(PaymentStatus.PARTIALLY_REFUNDED);
                }
            }
            paymentRepository.save(booking.getPayment());
        }

        BookingResponse response = mapToResponse(booking);
        response.setRefundAmount(refundAmount);
        return response;
    }

    public BookingResponse getBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean allowed = booking.getGuest().getEmail().equals(userEmail)
                       || booking.getProperty().getHost().getEmail().equals(userEmail);
        if (!allowed) throw new UnauthorizedException("Access denied");

        return mapToResponse(booking);
    }

    public PageResponse<BookingResponse> getGuestBookings(String guestEmail, int page, int size) {
        User guest = userRepository.findByEmail(guestEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Booking> result = bookingRepository.findByGuestId(guest.getId(), pageable);
        return toPageResponse(result);
    }

    public PageResponse<BookingResponse> getHostBookings(String hostEmail, BookingStatus status,
                                                          int page, int size) {
        User host = userRepository.findByEmail(hostEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Booking> result = status != null
                ? bookingRepository.findByPropertyHostIdAndStatus(host.getId(), status, pageable)
                : bookingRepository.findByPropertyHostId(host.getId(), pageable);
        return toPageResponse(result);
    }

    // ── Feature 2: Host Notes ──────────────────────────────────────────

    @Transactional
    public BookingResponse updateHostNotes(Long bookingId, String notes, String hostEmail) {
        Booking booking = getBookingAndVerifyHost(bookingId, hostEmail);
        booking.setHostNotes(notes);
        return mapToResponse(bookingRepository.save(booking));
    }

    // ── Feature 3: Special Request Status ──────────────────────────────

    @Transactional
    public BookingResponse updateSpecialRequestStatus(Long bookingId, String status, String hostEmail) {
        if (status == null || !List.of("PENDING", "ACCEPTED", "DECLINED", "NOTED").contains(status)) {
            throw new BusinessException("Invalid status. Must be PENDING, ACCEPTED, DECLINED, or NOTED");
        }
        Booking booking = getBookingAndVerifyHost(bookingId, hostEmail);
        if (booking.getSpecialRequests() == null || booking.getSpecialRequests().isBlank()) {
            throw new BusinessException("No special requests to respond to");
        }
        booking.setSpecialRequestStatus(status);
        return mapToResponse(bookingRepository.save(booking));
    }

    // ── Feature 6: Booking Modifications ───────────────────────────────

    @Transactional
    public ModificationResponse requestModification(Long bookingId, ModificationRequest req, String guestEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        if (!booking.getGuest().getEmail().equals(guestEmail)) {
            throw new UnauthorizedException("Only the booking guest can request modifications");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Only confirmed bookings can be modified");
        }

        BookingModification mod = BookingModification.builder()
                .booking(booking)
                .requestedBy(booking.getGuest())
                .newCheckIn(req.getNewCheckIn())
                .newCheckOut(req.getNewCheckOut())
                .newGuests(req.getNewGuests())
                .reason(req.getReason())
                .status("PENDING")
                .build();

        return mapToModResponse(bookingModificationRepository.save(mod));
    }

    public List<ModificationResponse> getModificationsForBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean allowed = booking.getGuest().getEmail().equals(userEmail)
                       || booking.getProperty().getHost().getEmail().equals(userEmail);
        if (!allowed) throw new UnauthorizedException("Access denied");

        return bookingModificationRepository.findByBookingIdOrderByCreatedAtDesc(bookingId).stream()
                .map(this::mapToModResponse).collect(Collectors.toList());
    }

    @Transactional
    public ModificationResponse respondToModification(Long bookingId, Long modId, String status,
                                                       String hostResponse, String hostEmail) {
        if (status == null || !List.of("APPROVED", "DENIED").contains(status)) {
            throw new BusinessException("Status must be APPROVED or DENIED");
        }

        Booking booking = getBookingAndVerifyHost(bookingId, hostEmail);

        BookingModification mod = bookingModificationRepository.findById(java.util.Objects.requireNonNull(modId))
                .orElseThrow(() -> new ResourceNotFoundException("Modification", modId));

        if (!mod.getBooking().getId().equals(bookingId)) {
            throw new BusinessException("Modification does not belong to this booking");
        }
        if (!"PENDING".equals(mod.getStatus())) {
            throw new BusinessException("Modification is already " + mod.getStatus());
        }

        mod.setStatus(status);
        mod.setHostResponse(hostResponse);
        mod.setResolvedAt(LocalDateTime.now());
        bookingModificationRepository.save(mod);

        if ("APPROVED".equals(status)) {
            if (mod.getNewCheckIn() != null) booking.setCheckIn(mod.getNewCheckIn());
            if (mod.getNewCheckOut() != null) booking.setCheckOut(mod.getNewCheckOut());
            if (mod.getNewGuests() != null) {
                booking.setGuestsCount(mod.getNewGuests());
                if (booking.getAdults() != null && mod.getNewGuests() > 0) {
                    booking.setAdults(Math.min(mod.getNewGuests(), booking.getAdults()));
                }
            }
            // Recalculate price
            BigDecimal newSubtotal = pricingService.calculateSubtotal(
                booking.getProperty().getId(), booking.getCheckIn(), booking.getCheckOut());
            BigDecimal cleaningFee = booking.getProperty().getCleaningFee() != null
                ? booking.getProperty().getCleaningFee() : BigDecimal.ZERO;
            booking.setTotalPrice(newSubtotal.add(cleaningFee));
            bookingRepository.save(booking);
        }

        return mapToModResponse(mod);
    }

    // ── Booking Messages ──────────────────────────────────────────────

    @Transactional
    public MessageResponse sendMessage(Long bookingId, String text, String senderEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean isGuest = booking.getGuest().getEmail().equals(senderEmail);
        boolean isHost = booking.getProperty().getHost().getEmail().equals(senderEmail);
        if (!isGuest && !isHost) {
            throw new UnauthorizedException("Only the guest or host can message on this booking");
        }

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BookingMessage msg = BookingMessage.builder()
                .booking(booking)
                .sender(sender)
                .message(text)
                .createdAt(LocalDateTime.now())
                .build();

        return mapToMsgResponse(bookingMessageRepository.save(msg));
    }

    public List<MessageResponse> getMessages(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));

        boolean allowed = booking.getGuest().getEmail().equals(userEmail)
                       || booking.getProperty().getHost().getEmail().equals(userEmail);
        if (!allowed) throw new UnauthorizedException("Access denied");

        return bookingMessageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
                .map(this::mapToMsgResponse).collect(Collectors.toList());
    }

    private MessageResponse mapToMsgResponse(BookingMessage msg) {
        return MessageResponse.builder()
                .id(msg.getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .message(msg.getMessage())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    private Booking getBookingAndVerifyHost(Long bookingId, String hostEmail) {
        Booking booking = bookingRepository.findById(java.util.Objects.requireNonNull(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));
        if (!booking.getProperty().getHost().getEmail().equals(hostEmail)) {
            throw new UnauthorizedException("You do not own the property for this booking");
        }
        return booking;
    }

    private ModificationResponse mapToModResponse(BookingModification mod) {
        return ModificationResponse.builder()
                .id(mod.getId())
                .bookingId(mod.getBooking().getId())
                .requestedBy(mod.getRequestedBy().getId())
                .requestedByName(mod.getRequestedBy().getFullName())
                .newCheckIn(mod.getNewCheckIn())
                .newCheckOut(mod.getNewCheckOut())
                .newGuests(mod.getNewGuests())
                .reason(mod.getReason())
                .status(mod.getStatus())
                .hostResponse(mod.getHostResponse())
                .createdAt(mod.getCreatedAt())
                .resolvedAt(mod.getResolvedAt())
                .build();
    }

    private void blockDates(Property property, LocalDate checkIn, LocalDate checkOut) {
        LocalDate date = checkIn;

        while (date.isBefore(checkOut)) {

            LocalDate currentDate = date; // ✅ FIX: make it effectively final

            availabilityRepository.findByPropertyIdAndDateBetween(property.getId(), currentDate, currentDate)
                    .stream().findFirst().ifPresentOrElse(
                            a -> {
                                a.setIsAvailable(false);
                                a.setReason("BOOKED");
                                availabilityRepository.save(a);
                            },
                            () -> availabilityRepository.save(Availability.builder()
                                    .property(property)
                                    .date(currentDate)   // ✅ use fixed variable
                                    .isAvailable(false)
                                    .reason("BOOKED")
                                    .build())
                    );

            date = date.plusDays(1);
        }
    }

    public BookingResponse mapToResponse(Booking b) {
        long nights = ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut());
        String primaryImg = b.getProperty().getImages() != null && !b.getProperty().getImages().isEmpty()
                ? b.getProperty().getImages().get(0).getUrl() : null;

        PaymentResponse paymentResponse = b.getPayment() != null
                ? PaymentResponse.builder()
                    .id(b.getPayment().getId()).amount(b.getPayment().getAmount())
                    .status(b.getPayment().getStatus())
                    .paymentMethod(b.getPayment().getPaymentMethod())
                    .transactionId(b.getPayment().getTransactionId())
                    .paidAt(b.getPayment().getPaidAt()).build()
                : null;

        List<BookingAddon> addons = bookingAddonRepository.findByBookingId(b.getId());
        List<BookingAddonResponse> addonResponses = addons.stream()
            .map(ba -> BookingAddonResponse.builder()
                .id(ba.getId()).addonId(ba.getAddon().getId())
                .name(ba.getAddon().getName())
                .description(ba.getAddon().getDescription())
                .quantity(ba.getQuantity())
                .price(ba.getPrice())
                .build())
            .collect(Collectors.toList());

        return BookingResponse.builder()
                .id(b.getId()).guestId(b.getGuest().getId()).guestName(b.getGuest().getFullName())
                .guestEmail(b.getGuest().getEmail()).guestPhone(b.getGuest().getPhone())
                .propertyId(b.getProperty().getId()).propertyTitle(b.getProperty().getTitle())
                .propertyCity(b.getProperty().getCity()).propertyImage(primaryImg)
                .checkIn(b.getCheckIn()).checkOut(b.getCheckOut())
                .guestsCount(b.getGuestsCount()).nights((int) nights)
                .adults(b.getAdults()).children(b.getChildren())
                .infants(b.getInfants()).pets(b.getPets())
                .totalPrice(b.getTotalPrice()).refundAmount(BigDecimal.ZERO).status(b.getStatus())
                .payment(paymentResponse).createdAt(b.getCreatedAt())
                .specialRequests(b.getSpecialRequests())
                .specialRequestStatus(b.getSpecialRequestStatus())
                .hostNotes(b.getHostNotes())
                .checkInInstructions(b.getProperty().getCheckInInstructions())
                .addons(addonResponses)
                .build();
    }

    private PageResponse<BookingResponse> toPageResponse(Page<Booking> page) {
        return PageResponse.<BookingResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }
}
