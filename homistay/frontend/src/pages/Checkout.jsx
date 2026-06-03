import { useState } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { CreditCard, Lock, Tag, ChevronRight, CalendarDays, Users } from "lucide-react";
import { bookingsApi, normalizeBooking, isRealId } from "@/services/api";

function CheckoutPage() {
  const { properties, currentBooking, bookings, setBookings, user } = useAppContext();
  const [, setLocation] = useLocation();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    firstName: currentBooking?.guestName?.split(" ")[0] || user?.name?.split(" ")[0] || "",
    lastName: currentBooking?.guestName?.split(" ").slice(1).join(" ") || user?.name?.split(" ").slice(1).join(" ") || "",
    email: currentBooking?.guestEmail || user?.email || "",
    phone: currentBooking?.guestPhone || user?.phone || "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
    specialRequests: currentBooking?.specialRequests || "",
  });

  const property = properties.find((p) => p.id === currentBooking?.propertyId);

  if (!property || !currentBooking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">No active booking</h2>
        <p className="text-muted-foreground mb-6">Please select a property and dates first.</p>
        <Button onClick={() => setLocation("/search")}>Browse properties</Button>
      </div>
    );
  }

  const discount = promoApplied ? Math.round((currentBooking.totalPrice || 0) * 0.1) : 0;
  const finalTotal = (currentBooking.totalPrice || 0) - discount;

  // Validate expiry is MM/YY and in the future
  const isValidExpiry = (val) => {
    const m = val.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const month = parseInt(m[1], 10);
    const year = parseInt(m[2], 10) + 2000;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const expiry = new Date(year, month, 0);
    return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
  };

  // JS validation — avoids browser "please fill in this field" tooltip on non-visible fields
  const validate = () => {
    if (!form.firstName.trim()) return "Please enter your first name.";
    if (!form.lastName.trim()) return "Please enter your last name.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address.";
    if (!form.cardName.trim()) return "Please enter the name on your card.";
    if (form.cardNumber.replace(/\s/g, "").length < 13) return "Please enter a valid card number.";
    if (!isValidExpiry(form.expiry)) return "Please enter a valid expiry date (MM/YY) that is not in the past.";
    if (form.cvv.length != 3) return "Please enter a valid CVV.";
    return null;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitError("");

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      let newBooking;
      const propertyId = currentBooking.propertyId;

      if (isRealId(propertyId)) {
        // Real backend property — call the API
        const created = await bookingsApi.create({
          propertyId: Number(propertyId),
          checkIn: currentBooking.checkIn,
          checkOut: currentBooking.checkOut,
          guestsCount: currentBooking.guests || 1,
          adults: currentBooking.adults || currentBooking.guests || 1,
          children: currentBooking.children || 0,
          infants: currentBooking.infants || 0,
          pets: currentBooking.pets || 0,
          paymentMethod: "CARD",
          specialRequests: form.specialRequests,
          addons: currentBooking.addons || [],
        });
        newBooking = normalizeBooking(created);
        newBooking.guestEmail = form.email;
        newBooking.guestName = `${form.firstName} ${form.lastName}`;
        newBooking.totalPrice = finalTotal;
      } else {
        // Mock/demo property — create a local booking without API call
        await new Promise((r) => setTimeout(r, 800));
        newBooking = {
          id: `HMS-${Math.floor(1e5 + Math.random() * 9e5)}`,
          propertyId: propertyId,
          userId: user?.id || "",
          guestName: `${form.firstName} ${form.lastName}`,
          guestEmail: form.email,
          checkIn: currentBooking.checkIn || "",
          checkOut: currentBooking.checkOut || "",
          guests: currentBooking.guests || 1,
          adults: currentBooking.adults || currentBooking.guests || 1,
          children: currentBooking.children || 0,
          infants: currentBooking.infants || 0,
          pets: currentBooking.pets || 0,
          totalPrice: finalTotal,
          status: "confirmed",
          createdAt: new Date().toISOString(),
        };
      }

      setBookings([...bookings, newBooking]);
      setLocation(`/confirmation?id=${newBooking.id}`);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Booking failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromo = () => {
    if (promoCode.toUpperCase() === "WELCOME10") {
      setPromoApplied(true);
    } else {
      alert("Invalid promo code. Try WELCOME10 for 10% off.");
    }
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const formatCard = (val) =>
    val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (val) =>
    val.replace(/\D/g, "").replace(/^(.{2})/, "$1/").slice(0, 5);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          onClick={() => setLocation(`/property/${property.id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to property
        </button>

        <h1 className="font-serif text-3xl font-bold mb-8">Confirm and pay</h1>

        {/* Use div instead of form to prevent browser HTML5 validation tooltips */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3 space-y-8">
              {/* Guest Details */}
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4">Your details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => updateForm("firstName", e.target.value)}
                      className="rounded-xl"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => updateForm("lastName", e.target.value)}
                      className="rounded-xl"
                      data-testid="input-last-name"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      className="rounded-xl"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="phone">Phone number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      className="rounded-xl"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* Payment */}
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Payment information
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cardName">Name on card</Label>
                    <Input
                      id="cardName"
                      placeholder="As it appears on card"
                      value={form.cardName}
                      onChange={(e) => updateForm("cardName", e.target.value)}
                      className="rounded-xl"
                      data-testid="input-card-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={form.cardNumber}
                      onChange={(e) => updateForm("cardNumber", formatCard(e.target.value))}
                      className="rounded-xl"
                      inputMode="numeric"
                      data-testid="input-card-number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={form.expiry}
                        onChange={(e) => updateForm("expiry", formatExpiry(e.target.value))}
                        className="rounded-xl"
                        inputMode="numeric"
                        data-testid="input-expiry"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        value={form.cvv}
                        onChange={(e) => updateForm("cvv", e.target.value.replace(/\D/g, ""))}
                        className="rounded-xl"
                        inputMode="numeric"
                        data-testid="input-cvv"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    Your payment information is encrypted and secure.
                  </div>
                </div>
              </section>

              <Separator />

              {/* Promo Code */}
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" /> Promo code
                </h2>
                {promoApplied ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1">
                    WELCOME10 applied — 10% off
                  </Badge>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="rounded-xl"
                      data-testid="input-promo-code"
                    />
                    <Button type="button" variant="outline" onClick={handlePromo} data-testid="button-apply-promo">
                      Apply
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Try WELCOME10 for 10% off your first booking.</p>
              </section>

              <Separator />

              {/* Special Requests */}
              <section>
                <h2 className="font-serif text-xl font-semibold mb-4">Special requests</h2>
                <Textarea
                  placeholder="Any special requests, arrival time, dietary needs..."
                  value={form.specialRequests}
                  onChange={(e) => updateForm("specialRequests", e.target.value)}
                  className="rounded-xl min-h-[100px]"
                  data-testid="input-special-requests"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Special requests cannot be guaranteed but we will do our best.
                </p>
              </section>

              {submitError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive font-medium">{submitError}</p>
                </div>
              )}

              <Button
                type="button"
                size="lg"
                className="w-full rounded-xl h-14 text-base font-semibold"
                disabled={isSubmitting}
                onClick={handleSubmit}
                data-testid="button-confirm-booking"
              >
                {isSubmitting
                  ? "Processing..."
                  : `Confirm booking — $${finalTotal.toLocaleString()}`}
              </Button>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 bg-card border rounded-2xl p-6 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-24 h-20 object-cover rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground capitalize">
                      {property.type} · {property.category}
                    </p>
                    <p className="font-medium leading-snug line-clamp-2 text-sm">{property.title}</p>
                    <div className="mt-1">
                      <StarRating rating={property.rating} showNumber count={property.reviewCount} />
                    </div>
                  </div>
                </div>

                <Separator className="mb-4" />

                <h3 className="font-semibold mb-3">Booking details</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span>{currentBooking.checkIn} → {currentBooking.checkOut}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {currentBooking.adults ?? currentBooking.guests} adult{(currentBooking.adults ?? currentBooking.guests) > 1 ? "s" : ""}
                      {currentBooking.children ? `, ${currentBooking.children} child${currentBooking.children > 1 ? "ren" : ""}` : ""}
                      {currentBooking.infants ? `, ${currentBooking.infants} infant${currentBooking.infants > 1 ? "s" : ""}` : ""}
                      {currentBooking.pets ? `, ${currentBooking.pets} pet${currentBooking.pets > 1 ? "s" : ""}` : ""}
                    </span>
                  </div>
                </div>

                <Separator className="mb-4" />

                <h3 className="font-semibold mb-3">Price breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>${property.price} × {currentBooking.nights || 1} night{(currentBooking.nights || 1) > 1 ? "s" : ""}</span>
                    <span>${((currentBooking.totalPrice || 0) - property.cleaningFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cleaning fee</span>
                    <span>${property.cleaningFee}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (WELCOME10)</span>
                      <span>-${discount}</span>
                    </div>
                  )}
                  {currentBooking.addons?.length > 0 && property.addons?.length > 0 && (
                    <>
                      {currentBooking.addons.map((sel) => {
                        const addon = property.addons.find(a => Number(a.id) === sel.addonId);
                        if (!addon) return null;
                        return (
                          <div key={sel.addonId} className="flex justify-between text-sm text-muted-foreground">
                            <span>{addon.name}{sel.quantity > 1 ? ` ×${sel.quantity}` : ''}</span>
                            <span>+${(Number(addon.price) * sel.quantity).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total (USD)</span>
                    <span>${finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CheckoutPage };
