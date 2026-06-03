import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Users, Search, Home, ArrowRight, XCircle, MessageSquareText, ClipboardList, PackageOpen, Edit3, CheckCircle2, X, Clock, Send } from "lucide-react";
import { bookingsApi, normalizeBooking } from "@/services/api";

const statusColors = {
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  // pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const specialRequestStatusColors = {
  // PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DECLINED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  NOTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

function MyBookingsPage() {
  const { user, bookings: contextBookings, properties } = useAppContext();
  const [, setLocation] = useLocation();
  const [apiBookings, setApiBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);

  // Cancel booking modal
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelResult, setCancelResult] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Check-in details modal
  const [checkinBooking, setCheckinBooking] = useState(null);
  const [checkinProperty, setCheckinProperty] = useState(null);

  // Modification modal
  const [modBooking, setModBooking] = useState(null);
  const [modDateError, setModDateError] = useState("");
  const [modForm, setModForm] = useState({ newCheckIn: "", newCheckOut: "", newGuests: "", reason: "" });
  const [modSubmitting, setModSubmitting] = useState(false);

  // Messages modal
  const [msgBooking, setMsgBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgSending, setMsgSending] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    bookingsApi
      .myBookings()
      .then(({ content }) => {
        if (content?.length) setApiBookings(content.map(normalizeBooking));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const getCancelPreview = (booking) => {
    const now = new Date();
    const checkIn = new Date(booking.checkIn + "T00:00:00");
    const checkOut = new Date(booking.checkOut + "T00:00:00");
    const totalNights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const usedNights = Math.max(0, Math.min(totalNights, Math.round((now - checkIn) / (1000 * 60 * 60 * 24))));
    const nightlyRate = booking.totalPrice / totalNights;

    if (usedNights === 0) {
      return { refund: Math.round(booking.totalPrice * 0.9), penalty: Math.round(booking.totalPrice * 0.1), label: "Early cancellation (before check-in)" };
    }
    const unusedNights = totalNights - usedNights;
    const refund = Math.round(nightlyRate * unusedNights * 0.7);
    const penalty = Math.round(nightlyRate * unusedNights * 0.3);
    return { refund, penalty, usedNights, unusedNights, label: "Mid-stay cancellation" };
  };

  const handleCancelConfirm = async () => {
    if (!cancelBooking) return;
    setCancelling(true);
    setCancelResult(null);
    try {
      const numericId = cancelBooking.id.startsWith("HMS-") ? cancelBooking.id.replace("HMS-", "") : cancelBooking.id;
      const updated = await bookingsApi.cancel(numericId);
      const norm = normalizeBooking(updated);
      setCancelResult({ refund: norm.refundAmount });
      setApiBookings((prev) =>
        prev.map((b) => b.id === cancelBooking.id ? { ...b, status: "cancelled", refundAmount: norm.refundAmount } : b)
      );
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to cancel booking.");
      setCancelBooking(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenCheckin = (booking) => {
    const prop = properties.find((p) => p.id === booking.propertyId || String(p.id) === String(booking.propertyId));
    setCheckinBooking(booking);
    setCheckinProperty(prop);
  };

  const handleOpenMessages = async (booking) => {
    const numericId = booking.id.startsWith("HMS-") ? booking.id.replace("HMS-", "") : booking.id;
    setMsgBooking(booking);
    setMessages([]);
    setMsgText("");
    setMsgLoading(true);
    try {
      const data = await bookingsApi.getMessages(numericId);
      setMessages(data || []);
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  };

  const handleSendMessage = async () => {
    const text = msgText.trim();
    if (!text || !msgBooking) return;
    const numericId = msgBooking.id.startsWith("HMS-") ? msgBooking.id.replace("HMS-", "") : msgBooking.id;
    setMsgSending(true);
    try {
      const sent = await bookingsApi.sendMessage(numericId, text);
      setMessages((prev) => [...prev, sent]);
      setMsgText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message.");
    } finally { setMsgSending(false); }
  };

  const handleModSubmit = async () => {
    setModDateError("");
    if (!modForm.newCheckIn && !modForm.newCheckOut && !modForm.newGuests) {
      setModDateError("Please change at least one field (dates or guests).");
      return;
    }
    setModSubmitting(true);
    try {
      const numericId = modBooking.id.startsWith("HMS-") ? modBooking.id.replace("HMS-", "") : modBooking.id;
      const payload = {};
      if (modForm.newCheckIn) payload.newCheckIn = modForm.newCheckIn;
      if (modForm.newCheckOut) payload.newCheckOut = modForm.newCheckOut;
      if (modForm.newGuests) payload.newGuests = Number(modForm.newGuests);
      payload.reason = modForm.reason;
      await bookingsApi.requestModification(numericId, payload);
      setModBooking(null);
      setModForm({ newCheckIn: "", newCheckOut: "", newGuests: "", reason: "" });
      alert("Modification request submitted. The host will review it shortly.");
    } catch (err) {
      setModDateError(err.response?.data?.message || err.response?.data?.error || "Failed to submit modification.");
    } finally {
      setModSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Sign in to see your bookings</h2>
        <p className="text-muted-foreground mb-6">Please log in to view your booking history.</p>
        <Button onClick={() => setLocation("/")}>Go home</Button>
      </div>
    );
  }

  const contextUserBookings = contextBookings.filter(
    (b) => b.userId === user.id || b.guestEmail === user.email
  );
  const apiIds = new Set(apiBookings.map((b) => b.id));
  const merged = [
    ...apiBookings,
    ...contextUserBookings.filter((b) => !apiIds.has(b.id)),
  ];

  const filtered =
    filter === "all" ? merged : merged.filter((b) => b.status === filter);

  const counts = {
    all: merged.length,
    confirmed: merged.filter((b) => b.status === "confirmed").length,
    // pending: merged.filter((b) => b.status === "pending").length,
    cancelled: merged.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {merged.length} booking{merged.length !== 1 ? "s" : ""} in total
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["all", "confirmed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
              data-testid={`filter-${s}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl">
            <Home className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-serif text-xl font-bold mb-2">No bookings yet</p>
            <p className="text-muted-foreground mb-6">
              Explore properties and plan your next stay.
            </p>
            <Button onClick={() => setLocation("/search")} className="gap-2">
              <Search className="w-4 h-4" /> Browse properties
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const property = properties.find(
                (p) => p.id === booking.propertyId || String(p.id) === String(booking.propertyId)
              );
              const canCancel = booking.status === "confirmed" ;
              return (
                <div
                  key={booking.id}
                  className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`booking-card-${booking.id}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {property?.images?.[0] || booking.propertyImage ? (
                      <img
                        src={property?.images?.[0] || booking.propertyImage}
                        alt={property?.title || booking.propertyTitle}
                        className="w-full sm:w-40 h-36 sm:h-auto object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-full sm:w-40 h-36 bg-muted flex items-center justify-center shrink-0">
                        <Home className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold leading-snug">
                            {property?.title || booking.propertyTitle || `Property #${booking.propertyId}`}
                          </p>
                          {(property?.location || booking.propertyCity) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {property
                                  ? `${property.location.city}, ${property.location.country}`
                                  : booking.propertyCity}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge className={statusColors[booking.status] || ""}>
                          {booking.status}
                        </Badge>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{booking.checkIn} → {booking.checkOut}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      {/* Host Notes (Feature 2) */}
                      {booking.hostNotes && (
                        <div className="mb-3 bg-primary/5 border border-primary/10 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquareText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-primary mb-0.5">Message from host</p>
                              <p className="text-sm">{booking.hostNotes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Special Request Status (Feature 3) */}
                      {booking.specialRequests && (
                        <div className="mb-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Special request:</span>
                          <span className="text-xs italic">"{booking.specialRequests}"</span>
                          <Badge className={specialRequestStatusColors[booking.specialRequestStatus] || "bg-muted"}>
                            {booking.specialRequestStatus}
                          </Badge>
                        </div>
                      )}

                      {/* Selected Add-ons (Feature 4) */}
                      {booking.addons?.length > 0 && (
                        <div className="mb-3 bg-muted/30 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                            <PackageOpen className="w-3.5 h-3.5" />
                            <span>Add-ons booked</span>
                          </div>
                          <div className="space-y-1">
                            {booking.addons.map((a) => (
                              <div key={a.id} className="flex justify-between text-sm">
                                <span>{a.name}{a.quantity > 1 ? ` ×${a.quantity}` : ''}</span>
                                <span className="text-muted-foreground">+${a.price.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono">{booking.id}</p>
                          <p className="font-bold">${booking.totalPrice.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Check-in Details button (Feature 1) */}
                          {(booking.status === "confirmed" || booking.status === "completed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 rounded-lg"
                              onClick={() => handleOpenCheckin(booking)}
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              Check-in details
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-lg"
                              onClick={() => { setCancelBooking(booking); setCancelResult(null); }}
                              data-testid={`button-cancel-${booking.id}`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </Button>
                          )}
                          {/* Modification Request (Feature 6) */}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 rounded-lg"
                              onClick={() => { setModBooking(booking); setModForm({ newCheckIn: "", newCheckOut: "", newGuests: "", reason: "" }); setModDateError(""); }}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Modify
                            </Button>
                          )}
                          {(booking.status === "confirmed" || booking.status === "completed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 rounded-lg"
                              onClick={() => handleOpenMessages(booking)}
                            >
                              <Send className="w-3.5 h-3.5" />
                              Messages
                            </Button>
                          )}
                          {property && (
                            <Link href={`/property/${property.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
                                View property <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Booking Modal */}
        <Dialog open={!!cancelBooking} onOpenChange={(open) => { if (!open && !cancelling) { setCancelBooking(null); setCancelResult(null); } }}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Cancel Booking</DialogTitle>
              <DialogDescription>
                {cancelBooking?.id} — {cancelBooking?.checkIn} to {cancelBooking?.checkOut}
              </DialogDescription>
            </DialogHeader>
            {cancelResult ? (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Booking Cancelled</h3>
                <p className="text-sm text-muted-foreground mb-4">Your booking has been cancelled successfully.</p>
                {cancelResult.refund > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Refund issued</p>
                    <p className="text-2xl font-bold text-primary">${cancelResult.refund.toLocaleString()}</p>
                  </div>
                )}
                <DialogFooter className="mt-6">
                  <Button className="rounded-xl w-full" onClick={() => { setCancelBooking(null); setCancelResult(null); }}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  {cancelBooking && (() => {
                    const preview = getCancelPreview(cancelBooking);
                    return (
                      <>
                        <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total paid</span>
                            <span className="font-semibold">${cancelBooking.totalPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{preview.label}</span>
                            <span className="text-destructive">-${preview.penalty.toLocaleString()}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">Refund amount</span>
                            <span className="font-bold text-primary">${preview.refund.toLocaleString()}</span>
                          </div>
                          {preview.usedNights > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              You've used {preview.usedNights} of {preview.usedNights + preview.unusedNights} nights. 
                              Unused nights refunded minus a cancellation fee.
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cancellation is final and cannot be undone.
                        </p>
                      </>
                    );
                  })()}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => { setCancelBooking(null); setCancelResult(null); }} disabled={cancelling}>Keep booking</Button>
                  <Button className="rounded-xl gap-1.5" disabled={cancelling} onClick={handleCancelConfirm}>
                    {cancelling ? "Cancelling..." : "Confirm cancellation"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Check-in Details Modal (Feature 1) */}
        <Dialog open={!!checkinBooking} onOpenChange={(open) => !open && setCheckinBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Check-in Details</DialogTitle>
              <DialogDescription>
                {checkinProperty?.title || checkinBooking?.propertyTitle}
              </DialogDescription>
            </DialogHeader>
            {checkinBooking?.checkInInstructions ? (
              <div className="py-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <p className="text-sm whitespace-pre-line leading-relaxed">{(checkinBooking.checkInInstructions || '').replace(/\\n/g, '\n')}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">This information is private to confirmed guests.</p>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p>No check-in instructions provided by the host.</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" className="rounded-xl w-full" onClick={() => setCheckinBooking(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modification Request Modal (Feature 6) */}
        <Dialog open={!!modBooking} onOpenChange={(open) => !open && setModBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Request Modification</DialogTitle>
              <DialogDescription>
                {modBooking?.id} — {modBooking?.checkIn} to {modBooking?.checkOut}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">New check-in</label>
                  <input type="date" value={modForm.newCheckIn} onChange={(e) => setModForm(f => ({ ...f, newCheckIn: e.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">New check-out</label>
                  <input type="date" value={modForm.newCheckOut} onChange={(e) => setModForm(f => ({ ...f, newCheckOut: e.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">New guest count <span className="font-normal">(optional)</span></label>
                <input type="number" min="1" value={modForm.newGuests} onChange={(e) => setModForm(f => ({ ...f, newGuests: e.target.value }))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Reason for change *</label>
                <textarea value={modForm.reason} onChange={(e) => setModForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Let the host know why you need to change..." />
              </div>
              {modDateError && <p className="text-xs text-destructive">{modDateError}</p>}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setModBooking(null)}>Cancel</Button>
              <Button className="rounded-xl" disabled={modSubmitting} onClick={handleModSubmit}>
                {modSubmitting ? "Submitting..." : "Submit request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Messages Modal */}
        <Dialog open={!!msgBooking} onOpenChange={(open) => !open && setMsgBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl h-[70vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Messages</DialogTitle>
              <DialogDescription>
                {msgBooking?.propertyTitle} — {msgBooking?.checkIn} to {msgBooking?.checkOut}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-4 px-1">
              {msgLoading ? (
                <p className="text-center text-muted-foreground text-sm py-8">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Send a message to your host!</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === Number(user?.id) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.senderId === Number(user?.id) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-xs opacity-70 mb-1">{m.senderName}</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      <p className="text-xs opacity-50 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t">
              <input
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                disabled={msgSending}
              />
              <Button size="sm" className="rounded-xl gap-1.5" onClick={handleSendMessage} disabled={msgSending || !msgText.trim()}>
                <Send className="w-3.5 h-3.5" /> {msgSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setLocation("/search")} className="gap-2">
            <Search className="w-4 h-4" /> Find more stays
          </Button>
        </div>
      </div>
    </div>
  );
}

export { MyBookingsPage };
