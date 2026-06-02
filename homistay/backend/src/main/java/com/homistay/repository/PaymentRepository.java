package com.homistay.repository;

import com.homistay.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.booking.property.host.id = :hostId
          AND p.status = 'PAID'
    """)
    BigDecimal totalEarningsByHostId(@Param("hostId") Long hostId);

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.booking.property.host.id = :hostId
          AND p.status = 'PAID'
          AND p.paidAt >= :since
    """)
    BigDecimal earningsSince(@Param("hostId") Long hostId, @Param("since") java.time.LocalDateTime since);

    @Query(value = """
        SELECT TO_CHAR(p.paid_at, 'Mon') AS month,
               EXTRACT(YEAR FROM p.paid_at) AS year,
               COALESCE(SUM(p.amount), 0) AS amount
        FROM payments p
        JOIN bookings b ON b.id = p.booking_id
        JOIN properties prop ON prop.id = b.property_id
        WHERE prop.host_id = :hostId
          AND p.status = 'PAID'
          AND p.paid_at >= :since
        GROUP BY EXTRACT(YEAR FROM p.paid_at), TO_CHAR(p.paid_at, 'Mon')
        ORDER BY EXTRACT(YEAR FROM p.paid_at), MIN(p.paid_at)
    """, nativeQuery = true)
    List<Object[]> monthlyEarningsSince(@Param("hostId") Long hostId, @Param("since") java.time.LocalDateTime since);
}
