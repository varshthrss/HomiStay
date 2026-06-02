import { useRef, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { StarRating } from "@/components/StarRating";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reviewsApi, isRealId, bookingsApi, normalizeBooking, propertiesApi, pricingApi } from "@/services/api";
import { format, differenceInDays } from "date-fns";
import {
  Wifi, Waves, ChefHat, Snowflake, ParkingSquare, Tv, Dumbbell, Flame,
  Bath, Wind, Check, CalendarDays, Users, ChevronLeft, ChevronRight,
  Share, Heart, MapPin, Star, Send, Copy,
} from "lucide-react";

const amenityIcons = {
  WiFi: Wifi, Pool: Waves, Kitchen: ChefHat, "Air conditioning": Snowflake,
  "Free parking": ParkingSquare, TV: Tv, Gym: Dumbbell, "Indoor fireplace": Flame,
  "Hot tub": Bath, Washer: Wind, Dryer: Wind, Workspace: MapPin,
  "Ocean view": MapPin, "Mountain view": MapPin, "City view": MapPin,
  "Garden view": MapPin, "Beach access": MapPin, "Patio or balcony": MapPin,
  "Rooftop terrace": MapPin, Breakfast: MapPin, Elevator: MapPin,
  Kayak: Waves, Sauna: Flame, BBQ: Flame,
};

function ReviewForm({ propertyId, user, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userBookings, setUserBookings] = useState([]);

  // Fetch user's bookings for this property so they can select one
  useEffect(() => {
    bookingsApi.myBookings(0, 50)
      .then(({ content }) => {
        if (content?.length) {
          const propBookings = content.filter(
            (b) => String(b.propertyId) === String(propertyId) && b.status === "CONFIRMED"
          );
          setUserBookings(propBookings);
          if (propBookings.length === 1) setBookingId(String(propBookings[0].id));
        }
      })
      .catch(() => {});
  }, [propertyId]);

  const handleSubmit = async () => {
    setError("");
    if (rating === 0) { setError("Please select a rating."); return; }
    if (!bookingId) { setError("Please enter your Booking ID."); return; }
    setSubmitting(true);
    try {
      const created = await reviewsApi.create({
        bookingId: Number(bookingId),
        rating,
        comment: comment.trim() || null,
      });
      onReviewSubmitted(created);
      setSuccess(true);
      setComment("");
      setRating(0);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
        <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-800 dark:text-green-200">Thank you for your review!</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSuccess(false)}>
          Write another review
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-serif text-xl font-semibold mb-4">Write a review</h3>
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        {/* Star Picker */}
        <div>
          <Label className="mb-2 block text-sm font-medium">Your rating</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
                data-testid={`review-star-${star}`}
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Great" : "Excellent"}
              </span>
            )}
          </div>
        </div>

        {/* Booking ID */}
        <div className="space-y-1.5">
          <Label htmlFor="reviewBookingId">Booking ID</Label>
          {userBookings.length > 0 ? (
            <select
              id="reviewBookingId"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
              data-testid="review-booking-select"
            >
              <option value="">Select your booking</option>
              {userBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Booking #{b.id} — {b.checkIn} to {b.checkOut}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="reviewBookingId"
              type="number"
              placeholder="Enter your booking ID (e.g. 5)"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="rounded-xl"
              data-testid="review-booking-input"
            />
          )}
          <p className="text-xs text-muted-foreground">You can find this on your booking confirmation page.</p>
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <Label htmlFor="reviewComment">Your review <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            id="reviewComment"
            placeholder="Tell others about your experience…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="rounded-xl min-h-[100px]"
            data-testid="review-comment"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2 rounded-xl"
          data-testid="button-submit-review"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
      </div>
    </div>
  );
}

function GuestRow({ label, desc, value, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="w-8 h-8 rounded-full" disabled={value <= min} onClick={() => onChange((v) => Math.max(min, v - 1))}>-</Button>
        <span className="w-5 text-center text-sm font-medium">{value}</span>
        <Button type="button" variant="outline" size="icon" className="w-8 h-8 rounded-full" disabled={value >= max} onClick={() => onChange((v) => Math.min(max, v + 1))}>+</Button>
      </div>
    </div>
  );
}

function PropertyDetailsPage() {
  const { id } = useParams();
  const { properties, setCurrentBooking, user, wishlist, toggleWishlist } = useAppContext();
  const [, setLocation] = useLocation();
  const isHost = user?.role === "host" || user?.role === "admin";
  const [currentImg, setCurrentImg] = useState(0);
  const [dates, setDates] = useState({});
  const [blockedDates, setBlockedDates] = useState([]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [dateError, setDateError] = useState("");
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [acknowledgedRequirements, setAcknowledgedRequirements] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [guestInfo, setGuestInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const property = properties.find((p) => String(p.id) === String(id));

  // Fetch blocked dates
  useEffect(() => {
    if (!isRealId(id)) return;
    propertiesApi.getBlockedDates(id)
      .then((data) => {
        setBlockedDates(data || []);
      })
      .catch(() => setBlockedDates([]));
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!isRealId(id)) return;
    reviewsApi.getPropertyReviews(id, 0, 50)
      .then((data) => {
        setReviews(data.content || []);
      })
      .catch(() => setReviews([]));
  }, [id]);

  // Fetch user's confirmed bookings for this property (for check-in details)
  useEffect(() => {
    setUserBookings([]);
    if (!user || !isRealId(id)) return;
    bookingsApi.myBookings(0, 50)
      .then(({ content }) => {
        if (content?.length) {
          const propBookings = content
            .map(normalizeBooking)
            .filter((b) => String(b.propertyId) === String(id) && (b.status === "confirmed" || b.status === "completed"));
          setUserBookings(propBookings);
        }
      })
      .catch(() => {});
  }, [user, id]);

  // Fetch dynamic pricing breakdown when dates or property changes
  useEffect(() => {
    if (!dates.from || !dates.to || !isRealId(id)) {
      setPricingBreakdown(null);
      return;
    }
    let from, to;
    try {
      from = format(dates.from, "yyyy-MM-dd");
      to = format(dates.to, "yyyy-MM-dd");
    } catch {
      setPricingBreakdown(null);
      return;
    }
    pricingApi.getBreakdown(id, from, to)
      .then(setPricingBreakdown)
      .catch((err) => {
        console.error("Pricing breakdown fetch failed:", err);
        setPricingBreakdown(null);
      });
  }, [id, dates.from, dates.to]);

  useEffect(() => {
    if (user) {
      setGuestInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Phase 1: Fetch coordinates from property database fields or fallback to Nominatim address search
  useEffect(() => {
    setMapReady(false);
    setMapCoords(null);
    if (typeof window.L === "undefined" || !property) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Try to use database lat/lng coordinates if populated
    if (property.location?.latitude != null && property.location?.longitude != null) {
      setMapCoords({ lat: property.location.latitude, lng: property.location.longitude });
      setMapReady(true);
      return;
    }

    const address = [
      property.location?.address,
      property.location?.city,
      property.location?.country,
    ].filter(Boolean).join(", ");

    if (!address) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.length === 0) return;
        setMapCoords({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        setMapReady(true);
      })
      .catch(() => {});
  }, [property]);

  // Phase 2: Initialize the Leaflet map once the DOM element exists
  useEffect(() => {
    if (!mapReady || !mapCoords || typeof window.L === "undefined") return;
    const el = mapContainerRef.current;
    if (!el) return;

    try {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Merge default options for Leaflet icon paths in Vite / React environment
      delete window.L.Icon.Default.prototype._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = window.L.map(el).setView([mapCoords.lat, mapCoords.lng], 14);
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      window.L.marker([mapCoords.lat, mapCoords.lng]).addTo(map);
      mapRef.current = map;
    } catch (e) {
      console.error("Map initialization failed:", e);
      setMapReady(false);
    }
  }, [mapReady, mapCoords]);

  // If the property is not found/loaded, return a loading/error state
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground font-serif">Property not found</p>
      </div>
    );
  }

  // Define booking pricing and helper variables
  const nights = dates.from && dates.to ? Math.ceil((dates.to - dates.from) / (1000 * 60 * 60 * 24)) : 0;
  const totalGuests = adults + children;

  // Let's use pricingBreakdown if available, otherwise calculate fallback values
  const basePrice = pricingBreakdown?.effectivePricePerNight != null
    ? Number(pricingBreakdown.effectivePricePerNight)
    : (pricingBreakdown?.basePricePerNight != null ? Number(pricingBreakdown.basePricePerNight) : (property ? Number(property.price) : 0));

  const fallbackPrice = pricingBreakdown?.effectivePricePerNight != null
    ? Number(pricingBreakdown.effectivePricePerNight)
    : (property?.effectivePrice != null ? Number(property.effectivePrice) : (property ? Number(property.price) : 0));

  const subtotal = pricingBreakdown?.subtotal != null
    ? Number(pricingBreakdown.subtotal)
    : fallbackPrice * nights;

  // Add-ons calculation: check which ones are selected in selectedAddons
  const addonCost = Object.entries(selectedAddons)
    .filter(([, selected]) => selected)
    .reduce((sum, [addonId]) => {
      const addon = property?.addons?.find((a) => String(a.id) === String(addonId));
      return sum + (addon ? Number(addon.price) : 0);
    }, 0);

  // Total booking cost
  const total = subtotal + (property ? Number(property.cleaningFee) : 0) + addonCost;

  // Similar properties list
  const similarProps = property
    ? properties.filter((p) => String(p.id) !== String(id) && p.category === property.category).slice(0, 2)
    : [];

  const handleContinueToGuestDetails = () => {
    setDateError("");
    if (!user) {
      alert("Please log in to continue booking.");
      return;
    }
    if (!dates.from || !dates.to) {
      setDateError("Please select check-in and check-out dates.");
      return;
    }
    if (dates.to <= dates.from) {
      setDateError("Check-out must be after check-in.");
      return;
    }
    // Check if range contains any blocked/booked dates
    const d = new Date(dates.from);
    while (d < dates.to) {
      const formatted = format(d, "yyyy-MM-dd");
      if (blockedDates.includes(formatted)) {
        setDateError("The selected dates contain unavailable nights. Please choose another range.");
        return;
      }
      d.setDate(d.getDate() + 1);
    }
    setBookingStep(2);
  };

  const handleReserve = () => {
    setDateError("");
    if (!guestInfo.fullName.trim()) {
      setDateError("Please enter guest name.");
      return;
    }
    if (!guestInfo.email.trim() || !guestInfo.email.includes("@")) {
      setDateError("Please enter a valid email.");
      return;
    }
    if (property.guestRequirements && !acknowledgedRequirements) {
      setDateError("Please acknowledge the host's guest requirements.");
      return;
    }
    setCurrentBooking({
      propertyId: property.id,
      userId: user.id,
      checkIn: format(dates.from, "yyyy-MM-dd"),
      checkOut: format(dates.to, "yyyy-MM-dd"),
      guests: totalGuests,
      adults,
      children,
      infants,
      pets,
      totalPrice: total,
      guestName: guestInfo.fullName,
      guestEmail: guestInfo.email,
      guestPhone: guestInfo.phone,
      specialRequests: guestInfo.specialRequests,
      addons: Object.entries(selectedAddons).filter(([, q]) => q > 0).map(([addonId, quantity]) => ({ addonId: Number(addonId), quantity })),
    });
    setLocation("/checkout");
  };

  const displayReviews = reviews.length > 0 ? reviews : property?.reviews || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{property.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StarRating rating={property.rating} showNumber count={property.reviewCount} />
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{property.location.city}, {property.location.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px]">
            <div
              className="col-span-2 row-span-2 relative cursor-pointer"
              onClick={() => setCurrentImg(0)}
            >
              <img
                src={property.images[currentImg] || property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {property.images.slice(1, 5).map((img, i) => (
              <div key={i} className="relative cursor-pointer" onClick={() => setCurrentImg(i + 1)}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full opacity-90"
              onClick={() => setCurrentImg((prev) => Math.max(0, prev - 1))}
              data-testid="button-prev-image"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full opacity-90"
              onClick={() => setCurrentImg((prev) => Math.min(property.images.length - 1, prev + 1))}
              data-testid="button-next-image"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-serif text-xl font-semibold capitalize">
                Entire {property.type} hosted by {property.hostName || "Host"}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                <span>{property.bedrooms} bedroom{property.bedrooms > 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}</span>
                <span>·</span>
                <span>Up to {property.maxGuests} guests</span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-serif text-xl font-semibold mb-3">About this place</h3>
              <p className="text-foreground/80 leading-relaxed">{property.description}</p>
            </div>

            <Separator />

            <div>
              <h3 className="font-serif text-xl font-semibold mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-3">
                {property.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Where you'll be */}
            {property.location?.address || property.location?.city || property.location?.country ? (
              <>
                <Separator />
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-4">Where you'll be</h3>
                  <div ref={mapContainerRef} className="w-full h-[400px] rounded-2xl z-0 bg-muted border overflow-hidden relative" />
                  <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5 capitalize">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {property.location?.city}, {property.location?.country}
                  </p>
                </div>
              </>
            ) : null}

            {displayReviews.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <StarRating rating={
                      displayReviews.length > 0
                        ? displayReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / displayReviews.length
                        : property.rating
                    } showNumber />
                    <span className="font-semibold">{displayReviews.length} review{displayReviews.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-6">
                    {displayReviews.map((review, i) => (
                      <div key={review.id || i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 font-bold text-sm">
                          {(review.guestName || review.name || review.reviewerName || "G")[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm mb-1">
                            {review.guestName || review.name || review.reviewerName}
                          </p>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {review.comment || review.text || review.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Write a Review Form */}
            {user && isRealId(id) && (
              <>
                <Separator />
                <ReviewForm
                  propertyId={id}
                  user={user}
                  onReviewSubmitted={(newReview) => {
                    setReviews((prev) => [newReview, ...prev]);
                  }}
                />
              </>
            )}

            <Separator />
            <div>
              <h3 className="font-serif text-xl font-semibold mb-6">Meet your host</h3>
              <div className="bg-card border rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition-shadow duration-300">
                {/* Left Mini Profile Block */}
                <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-2xl w-full md:w-64 border shrink-0">
                  <div className="relative">
                    <img
                      src={property.hostAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(property.hostName || "Host")}&background=random`}
                      alt={property.hostName}
                      className="w-24 h-24 rounded-full object-cover shadow-sm border border-border"
                    />
                    <div className="absolute bottom-0 right-1 bg-primary text-primary-foreground p-1 rounded-full text-xs shadow-md">
                      ★
                    </div>
                  </div>
                  <h4 className="font-serif text-2xl font-bold mt-4 leading-tight">{property.hostName || "Host"}</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Host</p>
                  
                  <div className="flex justify-around w-full mt-6 pt-4 border-t text-xs">
                    <div className="text-center">
                      <p className="font-bold text-base leading-none">
                        {displayReviews.length}
                      </p>
                      <p className="text-muted-foreground mt-1">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-base leading-none">
                        {property.rating ? property.rating.toFixed(1) : "New"}
                      </p>
                      <p className="text-muted-foreground mt-1">Rating</p>
                    </div>
                  </div>
                </div>

                {/* Right Info Block */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-1">
                    <h5 className="font-bold text-lg text-foreground font-serif">About {property.hostName || "your host"}</h5>
                    <p className="text-xs text-muted-foreground">
                      Joined in {property.hostJoinedAt ? format(new Date(property.hostJoinedAt), "MMMM yyyy") : "May 2026"}
                    </p>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                    {property.hostBio || "This host hasn't written a biography yet. They are dedicated to providing excellent stays and local hospitality to all guests visiting the area."}
                  </p>
                  
                  <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-foreground font-serif">Response rate</p>
                      <p className="text-muted-foreground">100%</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground font-serif">Response time</p>
                      <p className="text-muted-foreground">Within an hour</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />
            <div>
              <h3 className="font-serif text-xl font-semibold mb-6">Things to know</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* House Rules */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-foreground">House rules</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Max guests: {property.maxGuests} guests</li>
                    <li>Allows children: {property.allowsChildren ? "Yes" : "No"}</li>
                    <li>Allows infants: {property.allowsInfants ? "Yes" : "No"}</li>
                    <li>Allows pets: {property.allowsPets ? "Yes" : "No"}</li>
                    {property.houseRules ? (
                      <li className="text-foreground font-medium mt-3 border-t pt-2 max-w-[280px] whitespace-pre-line leading-relaxed">
                        {property.houseRules}
                      </li>
                    ) : (
                      <li className="italic text-xs">No custom host rules specified.</li>
                    )}
                  </ul>
                </div>

                {/* Safety & Property */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-foreground">Safety & property</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Smoke alarm installed</li>
                    <li>Carbon monoxide alarm installed</li>
                    <li>First aid kit available</li>
                    <li>Security cameras on property</li>
                  </ul>
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-foreground">Cancellation policy</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Free cancellation for 24 hours. Cancel up to 7 days before check-in for a full refund.
                  </p>
                </div>
              </div>
            </div>

            {property.guestRequirements && (
              <div>
                <h3 className="font-serif text-xl font-semibold mb-4">Guest requirements</h3>
                <div className="bg-muted/30 rounded-xl p-4">
                  <ul className="space-y-2 text-sm">
                    {property.guestRequirements.split(", ").filter(Boolean).map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {user && userBookings.length > 0 && userBookings[0].checkInInstructions && (
              <>
                <Separator />
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-4">Check-in details</h3>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                    <p className="text-sm whitespace-pre-line leading-relaxed">{(userBookings[0].checkInInstructions || '').replace(/\\n/g, '\n')}</p>
                    <p className="text-xs text-muted-foreground mt-3 italic">This information is private and only visible to confirmed guests.</p>
                  </div>
                </div>
              </>
            )}

            {similarProps.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-6">Similar places</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {similarProps.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1 sticky top-24">
            <div className="bg-card border rounded-2xl p-6 shadow-lg max-h-[calc(100vh-7rem)] overflow-y-auto">
              {/* Share & Save */}
              <div className="flex items-center justify-end gap-1 mb-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2"><Share className="w-3.5 h-3.5" /> Share</Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-4 rounded-xl">
                    <p className="text-sm font-medium mb-2">Share this property</p>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/property/${id}`}
                        className="text-xs rounded-lg h-9 flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-lg"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/property/${id}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {!isHost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 text-xs h-8 px-2 ${wishlist?.includes(String(property.id)) ? "text-rose-500 hover:text-rose-600" : ""}`}
                    onClick={() => toggleWishlist(property.id)}
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlist?.includes(String(property.id)) ? "fill-rose-500 text-rose-500" : ""}`} />
                    {wishlist?.includes(String(property.id)) ? "Saved" : "Save"}
                  </Button>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-6 flex-wrap">
                {property.seasonName && property.effectivePrice && property.effectivePrice !== property.price ? (
                  <>
                    <span className="font-serif text-2xl font-bold">${property.effectivePrice}</span>
                    <span className="text-muted-foreground">/night</span>
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">{property.seasonName}</span>
                    <span className="text-xs text-muted-foreground line-through">${property.price}</span>
                  </>
                ) : (
                  <>
                    <span className="font-serif text-2xl font-bold">${property.price}</span>
                    <span className="text-muted-foreground">/night</span>
                  </>
                )}
              </div>

              {/* Step indicator */}
              {bookingStep === 2 && (
                <div className="flex items-center gap-2 mb-4 text-xs font-medium">
                  <button onClick={() => { setBookingStep(1); setDateError(""); }} className="text-primary hover:underline transition-colors">
                    ← Back to dates
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-primary font-semibold">Guest Details</span>
                </div>
              )}

              {bookingStep === 1 ? (
                <>
                  {/* Step 1: Dates & Guests */}
                  <div className="border rounded-xl overflow-hidden mb-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b"
                          data-testid="button-select-dates"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                              Dates
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {dates.from && dates.to
                              ? `${format(dates.from, "MMM d")} — ${format(dates.to, "MMM d")}`
                              : "Select dates"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dates?.from}
                          selected={dates}
                          onSelect={(range) => { setDates(range || {}); setDateError(""); }}
                          numberOfMonths={2}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (date < today) return true;
                            const formatted = format(date, "yyyy-MM-dd");
                            return blockedDates.includes(formatted);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="p-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full text-left">
                            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-0.5 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Guests
                            </div>
                            <span className="text-sm font-medium">
                              {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4" align="start">
                          <div className="space-y-4">
                            <GuestRow label="Adults" desc="Ages 13+" value={adults} min={1} max={Math.min(property.maxGuests, adults + Math.max(0, property.maxGuests - (adults + children + infants + pets)))} onChange={setAdults} />
                            <GuestRow label="Children" desc="Ages 2-12" value={children} min={0} max={property.allowsChildren ? Math.min(property.maxGuests, children + Math.max(0, property.maxGuests - (adults + children + infants + pets))) : 0} onChange={setChildren} />
                            <GuestRow label="Infants" desc="Under 2" value={infants} min={0} max={property.allowsInfants ? Math.min(5, infants + Math.max(0, property.maxGuests - (adults + children + infants + pets))) : 0} onChange={setInfants} />
                            <GuestRow label="Pets" desc="Service animals welcome" value={pets} min={0} max={property.allowsPets ? Math.min(5, pets + Math.max(0, property.maxGuests - (adults + children + infants + pets))) : 0} onChange={setPets} />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {dateError && (
                    <p className="text-sm text-destructive mb-2 font-medium">{dateError}</p>
                  )}

                  <Button
                    className="w-full h-12 text-base font-semibold rounded-xl mb-4"
                    onClick={handleContinueToGuestDetails}
                    data-testid="button-continue-guest"
                  >
                    Continue
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mb-4">
                    You won't be charged yet
                  </p>
                </>
              ) : (
                <>
                  {/* Step 2: Guest Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <span>{format(dates.from, "MMM d")} — {format(dates.to, "MMM d")}</span>
                      <span className="text-muted-foreground">·</span>
                      <Users className="w-4 h-4 shrink-0" />
                      <span>{totalGuests} guest{totalGuests > 1 ? "s" : ""}{infants > 0 ? `, ${infants} infant${infants > 1 ? "s" : ""}` : ""}{pets > 0 ? `, ${pets} pet${pets > 1 ? "s" : ""}` : ""}</span>
                    </div>
                  </div>

                  {/* Price breakdown — visible immediately so users see cost before filling the form */}
                  {nights > 0 && (
                    <div className="space-y-3 border-t border-b py-4 mb-4">
                      {pricingBreakdown ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Base: ${Number(pricingBreakdown.basePricePerNight)} × {nights} night{nights > 1 ? "s" : ""}</span>
                            <span>${(Number(pricingBreakdown.basePricePerNight) * nights).toLocaleString()}</span>
                          </div>
                          {pricingBreakdown.seasonalMultiplier && Number(pricingBreakdown.seasonalMultiplier) !== 1 && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Season rate ({pricingBreakdown.seasonName || "Seasonal"}):</span>
                              <span className="text-amber-600 font-medium">
                                +{(Math.round((Number(pricingBreakdown.seasonalMultiplier) - 1) * 100))}%
                              </span>
                            </div>
                          )}
                          {pricingBreakdown.nightlyBreakdown?.some(n => n.fixedAmount > 0) && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Season fixed add ({pricingBreakdown.seasonName || "Seasonal"}):</span>
                              <span className="text-amber-600 font-medium">
                                +${Number(pricingBreakdown.nightlyBreakdown.find(n => n.fixedAmount > 0)?.fixedAmount || 0).toFixed(0)}/night
                              </span>
                            </div>
                          )}
                          {pricingBreakdown.demandMultiplier && Number(pricingBreakdown.demandMultiplier) !== 1 && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Demand adjustment:</span>
                              <span className={Number(pricingBreakdown.demandMultiplier) > 1 ? "text-rose-500 font-medium" : "text-emerald-600 font-medium"}>
                                {Number(pricingBreakdown.demandMultiplier) > 1 ? "+" : ""}{(Math.round((Number(pricingBreakdown.demandMultiplier) - 1) * 100))}%
                              </span>
                            </div>
                          )}
                          {pricingBreakdown.effectivePricePerNight && Number(pricingBreakdown.effectivePricePerNight) !== Number(pricingBreakdown.basePricePerNight) && (
                            <div className="flex justify-between text-xs text-primary font-medium border-t border-dashed pt-2">
                              <span>Dynamic price / night:</span>
                              <span>${Number(pricingBreakdown.effectivePricePerNight).toLocaleString()}</span>
                            </div>
                          )}
                          <Separator className="my-1 border-dashed" />
                          <div className="flex justify-between text-sm font-medium">
                            <span>Accommodation subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Base: ${Number(property.price)} × {nights} night{nights > 1 ? "s" : ""}</span>
                            <span>${(Number(property.price) * nights).toLocaleString()}</span>
                          </div>
                          {property.effectivePrice != null && Number(property.effectivePrice) !== Number(property.price) && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Seasonal rate{property.seasonName ? ` (${property.seasonName})` : ""}:</span>
                              <span className="text-amber-600 font-medium">
                                {Number(property.effectivePrice) > Number(property.price) ? "+" : ""}
                                ${(Number(property.effectivePrice) - Number(property.price)).toFixed(0)}/night
                              </span>
                            </div>
                          )}
                          <Separator className="my-1 border-dashed" />
                          <div className="flex justify-between text-sm font-medium">
                            <span>Accommodation subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Cleaning fee</span>
                        <span>${property.cleaningFee}</span>
                      </div>
                      {addonCost > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Add-ons</span>
                          <span>+${addonCost.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Add-ons selection (shown in step 2 after dates selected) */}
                  {property.addons?.length > 0 && (
                    <div className="border rounded-xl p-3 mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Optional extras</p>
                      <div className="space-y-2">
                        {property.addons.filter(a => a.isActive).map((addon) => (
                          <label key={addon.id} className="flex items-center justify-between cursor-pointer text-sm">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={!!selectedAddons[addon.id]}
                                onChange={(e) => setSelectedAddons(prev => ({ ...prev, [addon.id]: e.target.checked ? 1 : undefined }))}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <div>
                                <p className="font-medium">{addon.name}</p>
                                {addon.description && <p className="text-xs text-muted-foreground">{addon.description}</p>}
                              </div>
                            </div>
                            <span className="font-semibold text-xs">+${addon.price}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guest form fields */}
                  <div className="space-y-3 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Name *</label>
                      <input
                        type="text"
                        value={guestInfo.fullName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, fullName: e.target.value })}
                        placeholder="Enter guest name"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        data-testid="input-guest-name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email *</label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        placeholder="guest@example.com"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        data-testid="input-guest-email"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone <span className="normal-case font-normal">(optional)</span></label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        data-testid="input-guest-phone"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Special Requests <span className="normal-case font-normal">(optional)</span></label>
                      <textarea
                        value={guestInfo.specialRequests}
                        onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                        placeholder="Early check-in, dietary needs..."
                        rows={2}
                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        data-testid="input-guest-requests"
                      />
                    </div>
                  </div>

                  {dateError && (
                    <p className="text-sm text-destructive mb-2 font-medium">{dateError}</p>
                  )}

                  {property.guestRequirements && (
                    <label className="flex items-start gap-2 mb-3 cursor-pointer">
                      <input type="checkbox" checked={acknowledgedRequirements}
                        onChange={(e) => setAcknowledgedRequirements(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I acknowledge and agree to the host's guest requirements: <span className="text-foreground font-medium">{property.guestRequirements}</span>
                      </span>
                    </label>
                  )}

                  <Button
                    className="w-full h-12 text-base font-semibold rounded-xl mb-4"
                    onClick={handleReserve}
                    data-testid="button-reserve"
                  >
                    Proceed to Payment
                  </Button>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PropertyDetailsPage };
