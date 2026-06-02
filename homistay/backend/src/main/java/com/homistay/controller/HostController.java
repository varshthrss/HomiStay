package com.homistay.controller;

import com.homistay.dto.request.AddonRequest;
import com.homistay.dto.request.AvailabilityBlockRequest;
import com.homistay.dto.response.AddonResponse;
import jakarta.validation.Valid;
import com.homistay.dto.response.BookingResponse;
import com.homistay.dto.response.HostDashboardResponse;
import com.homistay.dto.response.MonthlyEarningsResponse;
import com.homistay.dto.response.PageResponse;
import com.homistay.dto.response.PropertyResponse;
import com.homistay.enums.BookingStatus;
import com.homistay.service.BookingService;
import com.homistay.service.HostDashboardService;
import com.homistay.service.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/host")
@RequiredArgsConstructor
@Tag(name = "Host Dashboard", description = "Host-only: dashboard, properties, bookings, earnings")
@SecurityRequirement(name = "bearerAuth")
public class HostController {

    private final HostDashboardService dashboardService;
    private final BookingService bookingService;
    private final PropertyService propertyService;

    @GetMapping("/dashboard")
    @Operation(summary = "Host dashboard — stats + recent bookings")
    public ResponseEntity<HostDashboardResponse> dashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dashboardService.getDashboard(userDetails.getUsername()));
    }

    @GetMapping("/earnings/monthly")
    @Operation(summary = "Monthly earnings breakdown for the past 12 months")
    public ResponseEntity<List<MonthlyEarningsResponse>> monthlyEarnings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dashboardService.getMonthlyEarnings(userDetails.getUsername()));
    }

    @GetMapping("/properties")
    @Operation(summary = "Host's own property listings (paginated)")
    public ResponseEntity<PageResponse<PropertyResponse>> myProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(propertyService.getHostProperties(userDetails.getUsername(), page, size));
    }

    @GetMapping("/bookings")
    @Operation(summary = "All bookings on host's properties (paginated, filterable by status)")
    public ResponseEntity<PageResponse<BookingResponse>> myBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getHostBookings(
                userDetails.getUsername(), status, page, size));
    }

    @PostMapping("/properties/{id}/availability")
    @Operation(summary = "Block or unblock dates for a property listing (HOST only)")
    public ResponseEntity<Void> toggleAvailability(
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityBlockRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        propertyService.toggleAvailability(id, req, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Feature 2: Host Notes ──────────────────────────────────────────

    @PatchMapping("/bookings/{id}/notes")
    @Operation(summary = "Host sends a note to the guest for a booking")
    public ResponseEntity<BookingResponse> updateHostNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String notes = body.get("hostNotes");
        return ResponseEntity.ok(bookingService.updateHostNotes(id, notes, userDetails.getUsername()));
    }

    // ── Feature 3: Special Request Status ──────────────────────────────

    @PatchMapping("/bookings/{id}/special-request-status")
    @Operation(summary = "Host sets status of guest's special request")
    public ResponseEntity<BookingResponse> updateSpecialRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String status = body.get("status");
        return ResponseEntity.ok(bookingService.updateSpecialRequestStatus(id, status, userDetails.getUsername()));
    }

    // ── Feature 4: Add-on CRUD ─────────────────────────────────────────

    @GetMapping("/properties/{propertyId}/addons")
    @Operation(summary = "List addons for a property")
    public ResponseEntity<List<AddonResponse>> listAddons(
            @PathVariable Long propertyId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(propertyService.getPropertyAddons(propertyId, userDetails.getUsername()));
    }

    @PostMapping("/properties/{propertyId}/addons")
    @Operation(summary = "Create an addon for a property")
    public ResponseEntity<AddonResponse> createAddon(
            @PathVariable Long propertyId,
            @Valid @RequestBody AddonRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(propertyService.createAddon(propertyId, req, userDetails.getUsername()));
    }

    @DeleteMapping("/properties/{propertyId}/addons/{addonId}")
    @Operation(summary = "Delete an addon")
    public ResponseEntity<Void> deleteAddon(
            @PathVariable Long propertyId,
            @PathVariable Long addonId,
            @AuthenticationPrincipal UserDetails userDetails) {
        propertyService.deleteAddon(propertyId, addonId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── Feature 6: Booking Modifications (host approve/deny) ──────────

    @GetMapping("/bookings/{id}/modifications")
    @Operation(summary = "View modification requests for a booking")
    public ResponseEntity<List<com.homistay.dto.response.ModificationResponse>> getModifications(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getModificationsForBooking(id, userDetails.getUsername()));
    }

    @PatchMapping("/bookings/{bookingId}/modifications/{modId}")
    @Operation(summary = "Host approves or denies a modification request")
    public ResponseEntity<com.homistay.dto.response.ModificationResponse> respondToModification(
            @PathVariable Long bookingId,
            @PathVariable Long modId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String status = body.get("status");
        String response = body.get("hostResponse");
        return ResponseEntity.ok(bookingService.respondToModification(bookingId, modId, status, response, userDetails.getUsername()));
    }
}
