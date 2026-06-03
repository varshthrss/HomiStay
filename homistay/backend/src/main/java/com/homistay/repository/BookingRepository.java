package com.homistay.repository;

import com.homistay.entity.Booking;
import com.homistay.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByGuestId(Long guestId, Pageable pageable);

    Page<Booking> findByPropertyHostId(Long hostId, Pageable pageable);

    Page<Booking> findByPropertyHostIdAndStatus(Long hostId, BookingStatus status, Pageable pageable);

    /** Pessimistic lock — prevents two threads booking the same dates simultaneously */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT b FROM Booking b
        WHERE b.property.id = :propertyId
          AND b.status IN ('PENDING','CONFIRMED')
          AND b.checkIn < :checkOut
          AND b.checkOut > :checkIn
    """)
    List<Booking> findOverlappingBookingsWithLock(
        @Param("propertyId") Long propertyId,
        @Param("checkIn")    LocalDate checkIn,
        @Param("checkOut")   LocalDate checkOut
    );

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.property.id = :propertyId
          AND b.guest.id = :guestId
          AND b.status = 'COMPLETED'
    """)
    boolean hasCompletedStay(@Param("propertyId") Long propertyId,
                             @Param("guestId")    Long guestId);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.property.id = :propertyId
          AND b.status IN ('PENDING','CONFIRMED')
          AND b.checkIn < :endDate
          AND b.checkOut > :startDate
    """)
    boolean hasOverlappingBookings(
        @Param("propertyId") Long propertyId,
        @Param("startDate")  LocalDate startDate,
        @Param("endDate")    LocalDate endDate
    );

    @Query("""
        SELECT COUNT(b) FROM Booking b
        WHERE b.property.id = :propertyId
          AND b.status IN ('CONFIRMED','COMPLETED')
          AND b.createdAt >= :since
    """)
    long countConfirmedBookingsSince(
        @Param("propertyId") Long propertyId,
        @Param("since")      java.time.LocalDateTime since
    );
}
