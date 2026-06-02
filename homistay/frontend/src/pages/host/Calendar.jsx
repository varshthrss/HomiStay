import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays, Lock, Unlock, ShieldAlert, MessageSquareText } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO, addMonths, subMonths, isSameMonth, isToday, subDays } from "date-fns";
import { propertiesApi, hostApi, normalizeBooking, bookingsApi } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function getDayStatus(day, bookings, propertyId, blockedDates) {
  // 1. Check bookings (occupied from check-in to check-out - 1)
  for (const booking of bookings) {
    if (String(booking.propertyId) !== String(propertyId) || booking.status === "cancelled") continue;
    const start = parseISO(booking.checkIn);
    const end = subDays(parseISO(booking.checkOut), 1);
    if (isWithinInterval(day, { start, end })) {
      return booking.status === "confirmed" ? "confirmed" : "pending";
    }
  }

  // 2. Check manual host blocks
  const dateStr = format(day, "yyyy-MM-dd");
  if (blockedDates?.includes(dateStr)) {
    return "host_blocked";
  }

  return "available";
}

function HostCalendarPage() {
  const { user, properties } = useAppContext();
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1));
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Modals state
  const [selectedDay, setSelectedDay] = useState(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Form state
  const [bulkStart, setBulkStart] = useState("");
  const [bulkEnd, setBulkEnd] = useState("");
  const [bulkBlock, setBulkBlock] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const hostProps = properties.filter((p) => p.hostId === user?.id);
  const activePropertyId = selectedPropertyId || (hostProps[0]?.id ?? "");

  const fetchBlockedDates = useCallback(() => {
    if (!activePropertyId) return;
    setLoadingBlocked(true);
    propertiesApi.getBlockedDates(activePropertyId)
      .then((data) => {
        setBlockedDates(data || []);
      })
      .catch(() => setBlockedDates([]))
      .finally(() => setLoadingBlocked(false));
  }, [activePropertyId]);

  const fetchBookings = useCallback(() => {
    if (!activePropertyId) return;
    setLoadingBookings(true);
    hostApi.myBookings("all", 0, 100)
      .then((res) => {
        const list = res.content || [];
        setBookings(list.map(normalizeBooking));
      })
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [activePropertyId]);

  useEffect(() => {
    fetchBlockedDates();
    fetchBookings();
  }, [fetchBlockedDates, fetchBookings]);

  if (!user || user.role !== "host") {
    return <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Host access required</h2>
        <Button onClick={() => setLocation("/")}>Go home</Button>
      </div>;
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = startOfMonth(currentMonth).getDay();
  const cells = Array(firstDayOffset).fill(null).concat(days);

  const statusStyles = {
    confirmed: "bg-primary/20 text-primary font-semibold rounded-lg cursor-pointer hover:bg-primary/30",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-semibold rounded-lg cursor-pointer hover:bg-amber-200/50",
    host_blocked: "bg-neutral-200 text-neutral-500 line-through dark:bg-neutral-800 dark:text-neutral-400 rounded-lg cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-700",
    available: "hover:bg-muted/60 rounded-lg cursor-pointer text-foreground border border-dashed border-border/50"
  };

  const legend = [
    { color: "bg-primary/20", label: "Confirmed" },
    { color: "bg-amber-200", label: "Pending" },
    { color: "bg-neutral-200 line-through text-neutral-500", label: "Host Blocked" },
    { color: "bg-background border border-dashed", label: "Available" }
  ];

  const handleDayClick = (day, status) => {
    setSelectedDay({ day, status });
    setIsManageOpen(true);
    setActionError("");
  };

  const handleSingleToggle = async () => {
    setActionLoading(true);
    setActionError("");
    const dateStr = format(selectedDay.day, "yyyy-MM-dd");
    const willBlock = selectedDay.status === "available";
    try {
      await hostApi.toggleAvailability(activePropertyId, dateStr, dateStr, willBlock);
      fetchBlockedDates();
      fetchBookings();
      setIsManageOpen(false);
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || "Failed to update availability.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkStart || !bulkEnd) {
      setActionError("Please select both start and end dates.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await hostApi.toggleAvailability(activePropertyId, bulkStart, bulkEnd, bulkBlock);
      fetchBlockedDates();
      fetchBookings();
      setIsBulkOpen(false);
      setBulkStart("");
      setBulkEnd("");
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || "Failed to update availability.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    if (!window.confirm("Are you sure you want to cancel this booking? This will refund the guest according to the policy.")) return;
    setActionLoading(true);
    setActionError("");
    try {
      const numericId = activeBooking.id.startsWith("HMS-") ? activeBooking.id.replace("HMS-", "") : activeBooking.id;
      await bookingsApi.cancel(numericId);
      fetchBookings();
      fetchBlockedDates();
      setIsManageOpen(false);
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setActionLoading(false);
    }
  };

  // Find booking details if the clicked day falls under a booking
  let activeBooking = null;
  if (selectedDay && (selectedDay.status === "confirmed" || selectedDay.status === "pending")) {
    activeBooking = bookings.find(
      (b) =>
        b.propertyId === activePropertyId &&
        b.status !== "cancelled" &&
        isWithinInterval(selectedDay.day, {
          start: parseISO(b.checkIn),
          end: subDays(parseISO(b.checkOut), 1),
        })
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold animate-in fade-in duration-300">Calendar</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Manage availability and blocks for your properties</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 h-8 text-xs" onClick={() => { setIsBulkOpen(true); setActionError(""); }}>
              <CalendarDays className="w-3.5 h-3.5" /> Block / Unblock Range
            </Button>
            {hostProps.length > 0 && (
              <Select value={String(activePropertyId)} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="w-56 rounded-full" data-testid="select-property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {hostProps.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {hostProps.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-xl font-bold mb-2">No properties yet</p>
            <p className="text-muted-foreground">Add a property to manage its calendar.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-4 shadow-sm relative">
            {loadingBlocked && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center rounded-2xl z-10">
                <span className="text-sm font-medium">Updating availability map…</span>
              </div>
            )}

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-base font-semibold">{format(currentMonth, "MMM yyyy")}</h2>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="rounded-full h-7 w-7" onClick={() => setCurrentMonth((m) => subMonths(m, 1))} data-testid="button-prev-month">
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full h-7 text-xs px-2" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="icon" className="rounded-full h-7 w-7" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} data-testid="button-next-month">
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const status = getDayStatus(day, bookings, activePropertyId, blockedDates);
                return (
                  <div
                    key={i}
                    className={`h-8 flex items-center justify-center text-xs transition-colors ${statusStyles[status]} ${isToday(day) ? "ring-2 ring-primary" : ""} ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                    onClick={() => handleDayClick(day, status)}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t flex-wrap">
              {legend.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Selected property info */}
            {activePropertyId && (
              <div className="mt-3 pt-3 border-t">
                {(() => {
                  const prop = hostProps.find((p) => p.id === activePropertyId);
                  const propBookings = bookings.filter((b) => b.propertyId === activePropertyId && b.status !== "cancelled");
                  return prop ? (
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <img src={prop.images[0]} alt={prop.title} className="w-12 h-10 object-cover rounded-lg" />
                        <div>
                          <p className="font-medium text-sm">{prop.title}</p>
                          <p className="text-xs text-muted-foreground">{prop.location.city}, {prop.location.country}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{propBookings.length}</span> upcoming booking{propBookings.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day Availability Management Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Manage Date: {selectedDay && format(selectedDay.day, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              Check details or toggle calendar availability for this date.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-xl border border-destructive/20 text-xs font-medium">
              {actionError}
            </div>
          )}

          <div className="py-4">
            {activeBooking ? (
              <div className="bg-muted/40 border rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between font-semibold border-b pb-2 mb-2">
                  <span>Guest: {activeBooking.guestName}</span>
                  <span className="capitalize text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                    {activeBooking.status}
                  </span>
                </div>
                <p><strong>Stay:</strong> {activeBooking.checkIn} to {activeBooking.checkOut} ({activeBooking.guests} guests)</p>
                <p><strong>Contact:</strong> {activeBooking.guestEmail || "No email provided"} {activeBooking.guestPhone ? `| ${activeBooking.guestPhone}` : ""}</p>
                <p><strong>Price:</strong> ${activeBooking.totalPrice.toLocaleString()}</p>
                {activeBooking.specialRequests && (
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2 italic">
                    <strong>Special Request:</strong> "{activeBooking.specialRequests}"
                  </p>
                )}
                {activeBooking.hostNotes && (
                  <div className="flex items-start gap-1.5 text-xs text-primary mt-2 border-t pt-2">
                    <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span><strong>Host note:</strong> {activeBooking.hostNotes}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Booked dates cannot be manually blocked or unblocked.</span>
                </div>
              </div>
            ) : selectedDay && (selectedDay.status === "available" || selectedDay.status === "host_blocked") ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border p-3 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">Availability status</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDay.status === "available" ? "Open for bookings" : "Blocked by Host"}
                    </p>
                  </div>
                  {selectedDay.status === "available" ? (
                    <Lock className="w-5 h-5 text-green-600" />
                  ) : (
                    <Unlock className="w-5 h-5 text-neutral-400" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedDay.status === "available"
                    ? "Blocking this date will prevent guests from selecting or booking it."
                    : "Unblocking this date will allow guests to select and book it again."}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <div className="flex gap-2 w-full justify-between">
              {activeBooking && (
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  disabled={actionLoading}
                  onClick={handleCancelBooking}
                >
                  {actionLoading ? "Processing..." : "Cancel Booking"}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" className="rounded-xl" onClick={() => setIsManageOpen(false)}>
                  Close
                </Button>
                {!activeBooking && selectedDay && (
                  <Button
                    variant={selectedDay.status === "available" ? "destructive" : "default"}
                    className="rounded-xl"
                    disabled={actionLoading}
                    onClick={handleSingleToggle}
                  >
                    {actionLoading ? "Processing..." : selectedDay.status === "available" ? "Block Date" : "Unblock Date"}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Availability Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <form onSubmit={handleBulkSubmit}>
            <DialogHeader>
              <DialogTitle className="font-serif text-lg">Manage Range Availability</DialogTitle>
              <DialogDescription>
                Select a date range to block or unblock rooms on your listing.
              </DialogDescription>
            </DialogHeader>

            {actionError && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-xl border border-destructive/20 text-xs font-medium mt-4">
                {actionError}
              </div>
            )}

            <div className="space-y-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bulkStart">Start Date</Label>
                  <input
                    id="bulkStart"
                    type="date"
                    required
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bulkEnd">End Date</Label>
                  <input
                    id="bulkEnd"
                    type="date"
                    required
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Availability Action</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="bulkAction"
                      checked={bulkBlock === true}
                      onChange={() => setBulkBlock(true)}
                      className="accent-primary"
                    />
                    Block dates
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="bulkAction"
                      checked={bulkBlock === false}
                      onChange={() => setBulkBlock(false)}
                      className="accent-primary"
                    />
                    Unblock (make available)
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsBulkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={actionLoading}>
                {actionLoading ? "Applying..." : "Apply Range Action"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { HostCalendarPage };
