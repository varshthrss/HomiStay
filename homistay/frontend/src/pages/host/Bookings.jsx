import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, CalendarDays, Mail, Phone, MessageSquareText, ClipboardList, CheckCircle2, X, XCircle, Clock, Send, Home } from "lucide-react";
import { hostApi, bookingsApi, normalizeBooking } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const statusColors = {
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const modStatusColors = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DENIED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function HostBookingsPage() {
  const { user, properties } = useAppContext();
  const [, setLocation] = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const isHost = user?.role === "host" || user?.role === "admin";
  const hostProperties = (user ? properties : []).filter((p) => p.hostId === user?.id);

  // Host Notes (Feature 2)
  const [hostNotes, setHostNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Special Request Status (Feature 3)
  const [srStatusSaving, setSrStatusSaving] = useState(false);

  // Modifications (Feature 6)
  const [modifications, setModifications] = useState([]);
  const [modsLoading, setModsLoading] = useState(false);
  const [modResponseText, setModResponseText] = useState("");

  // Host cancel modal
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelResult, setCancelResult] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Messages modal
  const [msgBooking, setMsgBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgSending, setMsgSending] = useState(false);

  useEffect(() => {
    if (!isHost) return;
    setLoading(true);
    hostApi.myBookings(statusFilter === "all" ? null : statusFilter)
      .then(({ content }) => { if (content) setBookings(content.map(normalizeBooking)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isHost, statusFilter]);

  useEffect(() => {
    if (!selectedBooking) return;
    setHostNotes(selectedBooking.hostNotes || "");
    setNotesSaved(false);
    setModResponseText("");
    // Fetch modifications
    setModsLoading(true);
    const numericId = selectedBooking.id.startsWith("HMS-") ? selectedBooking.id.replace("HMS-", "") : selectedBooking.id;
    hostApi.getModifications(numericId)
      .then((data) => setModifications(data || []))
      .catch(() => setModifications([]))
      .finally(() => setModsLoading(false));
  }, [selectedBooking]);

  if (!isHost) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Host access required</h2>
        <Button onClick={() => setLocation("/")}>Go home</Button>
      </div>
    );
  }

  const filtered = bookings.filter((b) => {
    if (propertyFilter !== "all" && String(b.propertyId) !== propertyFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return b.guestName?.toLowerCase().includes(q) || b.id?.toLowerCase().includes(q);
  });

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesSaved(false);
    try {
      const numericId = selectedBooking.id.startsWith("HMS-") ? selectedBooking.id.replace("HMS-", "") : selectedBooking.id;
      const updated = await hostApi.updateHostNotes(numericId, hostNotes);
      setBookings((prev) => prev.map((b) => b.id === selectedBooking.id ? { ...b, hostNotes } : b));
      setSelectedBooking((prev) => ({ ...prev, hostNotes }));
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save note.");
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSrStatusChange = async (newStatus) => {
    setSrStatusSaving(true);
    try {
      const numericId = selectedBooking.id.startsWith("HMS-") ? selectedBooking.id.replace("HMS-", "") : selectedBooking.id;
      const updated = await hostApi.updateSpecialRequestStatus(numericId, newStatus);
      setBookings((prev) => prev.map((b) => b.id === selectedBooking.id ? { ...b, specialRequestStatus: newStatus } : b));
      setSelectedBooking((prev) => ({ ...prev, specialRequestStatus: newStatus }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setSrStatusSaving(false);
    }
  };

  const handleModResponse = async (mod, status) => {
    try {
      const numericId = selectedBooking.id.startsWith("HMS-") ? selectedBooking.id.replace("HMS-", "") : selectedBooking.id;
      await hostApi.respondToModification(numericId, mod.id, status, modResponseText || null);
      // Refresh modifications and bookings
      const updated = await hostApi.getModifications(numericId);
      setModifications(updated || []);
      // Refresh bookings to get updated dates/guests
      const { content } = await hostApi.myBookings(statusFilter === "all" ? null : statusFilter);
      if (content) setBookings(content.map(normalizeBooking));
      setModResponseText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond to modification.");
    }
  };

  const handleHostCancelConfirm = async () => {
    if (!cancelBooking) return;
    setCancelling(true);
    setCancelResult(null);
    try {
      const numericId = cancelBooking.id.startsWith("HMS-") ? cancelBooking.id.replace("HMS-", "") : cancelBooking.id;
      const updated = await bookingsApi.cancel(numericId);
      const norm = normalizeBooking(updated);
      setCancelResult({ refund: norm.refundAmount });
      setBookings((prev) =>
        prev.map((b) => b.id === cancelBooking.id ? { ...b, status: "cancelled", refundAmount: norm.refundAmount } : b)
      );
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to cancel booking.");
      setCancelBooking(null);
    } finally {
      setCancelling(false);
    }
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

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1">{bookings.length} total bookings</p>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["all", "confirmed", "cancelled"].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status]})
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Home className="w-4 h-4 text-muted-foreground" />
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-56 rounded-full h-9 text-sm">
                <SelectValue placeholder="All properties" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All properties</SelectItem>
                {hostProperties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by guest name or booking ID..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-2xl">
            <p className="font-serif text-xl font-bold mb-2">No bookings found</p>
            <p className="text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {["Guest", "Dates", "Guests", "Status", "Total"].map((h) => (
                      <th key={h} className={`text-left p-4 text-sm font-semibold text-muted-foreground ${h === "Total" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((booking) => (
                    <tr key={booking.id} onClick={() => setSelectedBooking(booking)}
                      className="hover:bg-muted/50 transition-colors cursor-pointer" title="Click to view details">
                      <td className="p-4">
                        <p className="font-medium text-sm text-primary hover:underline">{booking.guestName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{booking.id}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{booking.checkIn}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 pl-5">to {booking.checkOut}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{booking.guests}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[booking.status] || ""}`}>
                          {booking.status}
                        </span>
                        {booking.specialRequestStatus && booking.specialRequestStatus !== "PENDING" && (
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            SR: {booking.specialRequestStatus}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold">${booking.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Booking Details</DialogTitle>
              <DialogDescription>
                Booking ID: <span className="font-mono text-foreground font-semibold">{selectedBooking?.id}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="py-4 space-y-4">
                {/* Guest Profile */}
                <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedBooking.guestName ? selectedBooking.guestName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">{selectedBooking.guestName}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{selectedBooking.guestEmail || "No email provided"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{selectedBooking.guestPhone || "No phone number"}</span>
                    </p>
                  </div>
                </div>

                {/* Stay details */}
                <div className="grid grid-cols-2 gap-4 border border-border/50 p-4 rounded-xl">
                  <div>
                    <span className="text-xs text-muted-foreground block">Check-in</span>
                    <span className="text-sm font-semibold">{selectedBooking.checkIn}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Check-out</span>
                    <span className="text-sm font-semibold">{selectedBooking.checkOut}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[selectedBooking.status] || ""}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>

                {/* Guest distribution */}
                <div className="border border-border/50 p-4 rounded-xl space-y-2">
                  <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Guests ({selectedBooking.guests})</h5>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-muted p-2 rounded-lg">
                      <span className="block font-bold">{selectedBooking.adults}</span>
                      <span className="text-[10px] text-muted-foreground">Adults</span>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                      <span className="block font-bold">{selectedBooking.children}</span>
                      <span className="text-[10px] text-muted-foreground">Children</span>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                      <span className="block font-bold">{selectedBooking.infants}</span>
                      <span className="text-[10px] text-muted-foreground">Infants</span>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                      <span className="block font-bold">{selectedBooking.pets}</span>
                      <span className="text-[10px] text-muted-foreground">Pets</span>
                    </div>
                  </div>
                </div>

                {/* Special Requests + Status (Feature 3) */}
                <div className="border border-border/50 p-4 rounded-xl">
                  <span className="text-xs text-muted-foreground block font-semibold mb-1 uppercase tracking-wider">Special Requests</span>
                  <p className="text-sm italic text-foreground bg-muted/30 p-2.5 rounded-lg border border-dashed border-border/80 mb-3">
                    {selectedBooking.specialRequests ? `"${selectedBooking.specialRequests}"` : "No special requirements requested."}
                  </p>
                  {selectedBooking.specialRequests && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <select
                        value={selectedBooking.specialRequestStatus || "PENDING"}
                        onChange={(e) => handleSrStatusChange(e.target.value)}
                        disabled={srStatusSaving}
                        className="text-xs rounded-lg border border-input bg-background px-2 py-1"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="DECLINED">Declined</option>
                        <option value="NOTED">Noted</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Host Notes (Feature 2) */}
                <div className="border border-border/50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                      <MessageSquareText className="w-3.5 h-3.5" /> Note to Guest
                    </span>
                    <div className="flex items-center gap-2">
                      {notesSaved && <span className="text-xs text-green-600">Saved!</span>}
                      <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={handleSaveNotes} disabled={notesSaving}>
                        {notesSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Write a note to the guest (e.g. parking instructions, welcome message)..."
                    value={hostNotes}
                    onChange={(e) => setHostNotes(e.target.value)}
                    className="rounded-xl min-h-[80px] text-sm"
                  />
                </div>

                {/* Modification Requests (Feature 6) */}
                <div className="border border-border/50 p-4 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Modification Requests</span>
                  </div>
                  {modsLoading ? (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  ) : modifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No modification requests.</p>
                  ) : (
                    <div className="space-y-3">
                      {modifications.map((mod) => (
                        <div key={mod.id} className="bg-muted/30 rounded-xl p-3 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${modStatusColors[mod.status] || ""}`}>
                              {mod.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground">by {mod.requestedByName}</span>
                          </div>
                          <div className="text-xs space-y-1 mb-2">
                            {mod.newCheckIn && <p>New check-in: <span className="font-medium">{mod.newCheckIn}</span></p>}
                            {mod.newCheckOut && <p>New check-out: <span className="font-medium">{mod.newCheckOut}</span></p>}
                            {mod.newGuests && <p>New guests: <span className="font-medium">{mod.newGuests}</span></p>}
                            {mod.reason && <p className="italic text-muted-foreground">"{mod.reason}"</p>}
                          </div>
                          {mod.status === "PENDING" && (
                            <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
                              <input
                                placeholder="Response to guest (optional)"
                                value={modResponseText}
                                onChange={(e) => setModResponseText(e.target.value)}
                                className="flex h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 flex-1 text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => handleModResponse(mod, "APPROVED")}>
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs h-7 flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => handleModResponse(mod, "DENIED")}>
                                  <X className="w-3 h-3 mr-1" /> Deny
                                </Button>
                              </div>
                            </div>
                          )}
                          {mod.status !== "PENDING" && mod.hostResponse && (
                            <p className="text-xs mt-1 text-muted-foreground">Your response: "{mod.hostResponse}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add-ons summary (Feature 4) */}
                {selectedBooking.addons?.length > 0 && (
                  <div className="border border-border/50 p-4 rounded-xl">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-2">Add-ons booked</span>
                    <div className="space-y-1">
                      {selectedBooking.addons.map((a) => (
                        <div key={a.id} className="flex justify-between text-sm">
                          <span>{a.name}{a.quantity > 1 ? ` ×${a.quantity}` : ''}</span>
                          <span className="text-muted-foreground">+${a.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages to guest */}
                <div className="border border-border/50 p-4 rounded-xl">
                  <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => handleOpenMessages(selectedBooking)}>
                    <Send className="w-4 h-4" /> Messages with Guest
                  </Button>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="font-medium text-sm">Total payout:</span>
                  <span className="font-bold text-xl text-primary">${selectedBooking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {(selectedBooking?.status === "confirmed" || selectedBooking?.status === "pending") && (
                <Button variant="destructive" className="rounded-xl gap-1.5" onClick={() => { setCancelBooking(selectedBooking); setCancelResult(null); }}>
                  <XCircle className="w-4 h-4" /> Cancel booking
                </Button>
              )}
              <Button variant="outline" className="rounded-xl" onClick={() => setSelectedBooking(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Host Cancel Booking Modal */}
        <Dialog open={!!cancelBooking} onOpenChange={(open) => { if (!open && !cancelling) { setCancelBooking(null); setCancelResult(null); } }}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Cancel Guest Booking</DialogTitle>
              <DialogDescription>
                {cancelBooking?.guestName} — {cancelBooking?.checkIn} to {cancelBooking?.checkOut}
              </DialogDescription>
            </DialogHeader>
            {cancelResult ? (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Booking Cancelled</h3>
                <p className="text-sm text-muted-foreground mb-4">The guest has been notified and a full refund has been issued.</p>
                {cancelResult.refund > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Full refund issued to guest</p>
                    <p className="text-2xl font-bold text-primary">${cancelResult.refund.toLocaleString()}</p>
                  </div>
                )}
                <DialogFooter className="mt-6">
                  <Button className="rounded-xl w-full" onClick={() => { setCancelBooking(null); setCancelResult(null); setSelectedBooking(null); }}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm space-y-2">
                    <p className="font-semibold text-destructive">Full refund to guest</p>
                    <p className="text-muted-foreground">
                      Cancelling this booking will issue a <strong>full refund</strong> to the guest with no penalty.
                      The guest will be notified and the dates will be unblocked.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">This action is final and cannot be undone.</p>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => { setCancelBooking(null); setCancelResult(null); }} disabled={cancelling}>Keep booking</Button>
                  <Button variant="destructive" className="rounded-xl gap-1.5" disabled={cancelling} onClick={handleHostCancelConfirm}>
                    {cancelling ? "Cancelling..." : "Confirm cancellation"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Messages Modal */}
        <Dialog open={!!msgBooking} onOpenChange={(open) => !open && setMsgBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl h-[70vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Messages</DialogTitle>
              <DialogDescription>
                {msgBooking?.guestName} — {msgBooking?.checkIn} to {msgBooking?.checkOut}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-4 px-1">
              {msgLoading ? (
                <p className="text-center text-muted-foreground text-sm py-8">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No messages yet.</p>
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
      </div>
    </div>
  );
}

export { HostBookingsPage };
