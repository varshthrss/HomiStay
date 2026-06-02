import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Check, MapPin, Minus, Plus, Star, Search,
} from "lucide-react";
import { Input } from "./ui/input";

// ── Haversine distance (km) ──────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Static trip data ─────────────────────────────────────────────────────────

const TRIP_DATA = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    emoji: "🌳",
    tagline: "Garden City of India",
    gradient: "from-emerald-600 to-teal-600",
    places: [
      { id: "lalbagh", name: "Lalbagh Botanical Garden", icon: "🌿", desc: "Famous for its glass house, rare plants, and flower shows.", lat: 12.95, lng: 77.59 },
      { id: "cubbon", name: "Cubbon Park", icon: "🌳", desc: "A large green park in the heart of the city, ideal for walks and relaxation.", lat: 12.975, lng: 77.59333 },
      { id: "palace", name: "Bangalore Palace", icon: "🏰", desc: "A historic palace inspired by England's Windsor Castle.", lat: 12.9987, lng: 77.592 },
      { id: "iskcon", name: "ISKCON Temple", icon: "🛕", desc: "One of India's largest and most visited Krishna temples.", lat: 13.00981, lng: 77.55109 },
      { id: "bannerghatta", name: "Bannerghatta Biological Park", icon: "🦁", desc: "Known for wildlife safaris, zoo, and butterfly park.", lat: 12.80083, lng: 77.57556 },
    ],
  },
  {
    id: "goa",
    name: "Goa",
    emoji: "🏖️",
    tagline: "Beach Paradise of India",
    gradient: "from-sky-500 to-cyan-600",
    places: [
      { id: "baga", name: "Baga Beach", icon: "🏖️", desc: "Famous for water sports, nightlife, and beach shacks.", lat: 15.55889, lng: 73.75333 },
      { id: "calangute", name: "Calangute Beach", icon: "🌊", desc: "Known as the \"Queen of Beaches.\"", lat: 15.54167, lng: 73.76194 },
      { id: "basilica", name: "Basilica of Bom Jesus", icon: "⛪", desc: "UNESCO World Heritage Site housing the remains of St. Francis Xavier.", lat: 15.5008722, lng: 73.9115111 },
      { id: "aguada", name: "Fort Aguada", icon: "🏰", desc: "A 17th-century Portuguese fort with stunning sea views.", lat: 15.488, lng: 73.763 },
      { id: "dudhsagar", name: "Dudhsagar Falls", icon: "💧", desc: "One of India's tallest and most spectacular waterfalls.", lat: 15.31277, lng: 74.31416 },
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    emoji: "🌆",
    tagline: "City of Dreams",
    gradient: "from-amber-500 to-orange-600",
    places: [
      { id: "gateway", name: "Gateway of India", icon: "🚪", desc: "Mumbai's most iconic monument overlooking the Arabian Sea.", lat: 18.92198, lng: 72.83466 },
      { id: "marine", name: "Marine Drive", icon: "🌊", desc: "Famous seaside promenade known as the \"Queen's Necklace.\"", lat: 18.944, lng: 72.823 },
      { id: "elephanta", name: "Elephanta Caves", icon: "🗿", desc: "UNESCO World Heritage Site with ancient rock-cut temples.", lat: 18.96333, lng: 72.93139 },
      { id: "juhu", name: "Juhu Beach", icon: "🏖️", desc: "Popular beach known for street food and sunsets.", lat: 19.1, lng: 72.83 },
      { id: "siddhivinayak", name: "Siddhivinayak Temple", icon: "🛕", desc: "One of India's most famous Ganesh temples.", lat: 19.01692, lng: 72.830409 },
    ],
  },
];

// ── Plan type styles ─────────────────────────────────────────────────────────

const PLAN_STYLES = {
  budget:  { icon: "💰", label: "Budget Plan",  badge: "bg-emerald-100 text-emerald-700 border-emerald-200", ring: "ring-emerald-500/20" },
  nearest: { icon: "📍", label: "Nearest Plan",  badge: "bg-blue-100 text-blue-700 border-blue-200", ring: "ring-blue-500/20" },
  best:    { icon: "⭐", label: "Best Overall",  badge: "bg-amber-100 text-amber-700 border-amber-200", ring: "ring-amber-500/20" },
};

// ── Component ────────────────────────────────────────────────────────────────

function TripPlanner({ open, onOpenChange }) {
  const { properties } = useAppContext();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
  const [nights, setNights] = useState(3);

  // Reset on close
  const handleOpenChange = useCallback(
    (val) => {
      if (!val) {
        setTimeout(() => {
          setStep(1);
          setCityQuery("");
          setSelectedCity(null);
          setSelectedPlaceIds([]);
          setNights(3);
        }, 250);
      }
      onOpenChange(val);
    },
    [onOpenChange]
  );

  // ── Derived data ──

  const filteredCities = useMemo(() => {
    if (!cityQuery.trim()) return TRIP_DATA;
    const q = cityQuery.trim().toLowerCase();
    return TRIP_DATA.filter(
      (c) => c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q)
    );
  }, [cityQuery]);

  const cityProperties = useMemo(() => {
    if (!selectedCity) return [];
    const cityName = selectedCity.name.toLowerCase();
    return properties.filter(
      (p) =>
        p.status === "active" &&
        p.location?.latitude != null &&
        p.location?.longitude != null &&
        (p.location.city?.toLowerCase() === cityName ||
         p.location.city?.toLowerCase().includes(cityName) ||
         cityName.includes(p.location.city?.toLowerCase()))
    );
  }, [properties, selectedCity]);

  const selectedPlaces = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.places.filter((p) => selectedPlaceIds.includes(p.id));
  }, [selectedCity, selectedPlaceIds]);

  // ── Plan generation ──

  const plans = useMemo(() => {
    if (step !== 3 || selectedPlaces.length === 0 || cityProperties.length === 0) return [];

    const scored = cityProperties.map((prop) => {
      const distances = selectedPlaces.map((place) => ({
        name: place.name,
        icon: place.icon,
        km: haversineKm(prop.location.latitude, prop.location.longitude, place.lat, place.lng),
      }));
      const avgDist = distances.reduce((s, d) => s + d.km, 0) / distances.length;
      const totalCost = prop.price * nights + prop.cleaningFee;
      return { property: prop, distances, avgDist, totalCost };
    });

    // Budget: cheapest
    const budget = [...scored].sort((a, b) => a.totalCost - b.totalCost)[0];

    // Nearest: smallest avg distance
    const nearest = [...scored].sort((a, b) => a.avgDist - b.avgDist)[0];

    // Best overall: weighted score (40% price, 60% distance)
    const maxP = Math.max(...scored.map((s) => s.totalCost));
    const minP = Math.min(...scored.map((s) => s.totalCost));
    const maxD = Math.max(...scored.map((s) => s.avgDist));
    const minD = Math.min(...scored.map((s) => s.avgDist));
    const best = [...scored].sort((a, b) => {
      const npa = maxP === minP ? 0 : (a.totalCost - minP) / (maxP - minP);
      const npb = maxP === minP ? 0 : (b.totalCost - minP) / (maxP - minP);
      const nda = maxD === minD ? 0 : (a.avgDist - minD) / (maxD - minD);
      const ndb = maxD === minD ? 0 : (b.avgDist - minD) / (maxD - minD);
      return 0.4 * npa + 0.6 * nda - (0.4 * npb + 0.6 * ndb);
    })[0];

    return [
      { type: "budget", ...budget },
      { type: "nearest", ...nearest },
      { type: "best", ...best },
    ];
  }, [step, selectedPlaces, cityProperties, nights]);

  // ── Handlers ──

  const pickCity = (city) => {
    setSelectedCity(city);
    setSelectedPlaceIds([]);
    setStep(2);
  };

  const togglePlace = (placeId) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const bookProperty = (propertyId) => {
    handleOpenChange(false);
    setTimeout(() => setLocation(`/property/${propertyId}`), 300);
  };

  // ── Step labels ──
  const STEPS = ["Choose City", "Select Places", "Your Plans"];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "rounded-2xl p-0 gap-0 overflow-hidden transition-all duration-300",
          step === 3 ? "sm:max-w-5xl" : "sm:max-w-2xl"
        )}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center">
              ✈️ Trip Planner
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 mt-4">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    i + 1 === step
                      ? "bg-primary text-primary-foreground shadow-md scale-110"
                      : i + 1 < step
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:inline",
                    i + 1 === step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className="w-6 sm:w-10 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {/* ── STEP 1: Choose City ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search cities..."
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  className="pl-10 rounded-xl h-11"
                  autoComplete="off"
                />
              </div>

              {filteredCities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No cities match your search</p>
                  <p className="text-sm mt-1">Try "Bengaluru", "Goa", or "Mumbai"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => pickCity(city)}
                      className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                      <div className={cn("bg-gradient-to-br p-6 h-44 flex flex-col justify-between text-white", city.gradient)}>
                        <span className="text-4xl drop-shadow-md">{city.emoji}</span>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">{city.name}</h3>
                          <p className="text-white/80 text-sm">{city.tagline}</p>
                          <p className="text-white/60 text-xs mt-1.5">
                            {city.places.length} places to explore →
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Select Places ── */}
          {step === 2 && selectedCity && (
            <div className="space-y-5">
              {/* Sub-header */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedCity.emoji} {selectedCity.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select the places you want to visit
                  </p>
                </div>
              </div>

              {/* Places list */}
              <div className="space-y-2">
                {selectedCity.places.map((place) => {
                  const isSelected = selectedPlaceIds.includes(place.id);
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => togglePlace(place.id)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      {/* Icon */}
                      <span className="text-2xl shrink-0 mt-[-2px]">{place.icon}</span>

                      {/* Text */}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{place.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {place.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {selectedPlaceIds.length} of {selectedCity.places.length} selected
                  {cityProperties.length > 0 && (
                    <span className="ml-2 text-xs">
                      · {cityProperties.length} {cityProperties.length === 1 ? "property" : "properties"} available
                    </span>
                  )}
                </p>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedPlaceIds.length === 0 || cityProperties.length === 0}
                  className="rounded-xl px-6"
                >
                  Generate Plans
                </Button>
              </div>

              {cityProperties.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-amber-800">
                    No properties available in {selectedCity.name} yet
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    We're working on adding more properties to this city.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Plans ── */}
          {step === 3 && selectedCity && (
            <div className="space-y-6">
              {/* Sub-header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedCity.emoji} Trip to {selectedCity.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlaces.length} {selectedPlaces.length === 1 ? "place" : "places"} selected
                    </p>
                  </div>
                </div>

                {/* Nights selector */}
                <div className="flex items-center gap-3 bg-muted/60 rounded-full px-4 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Nights:</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-7 h-7 rounded-full"
                    disabled={nights <= 1}
                    onClick={() => setNights((n) => Math.max(1, n - 1))}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-bold text-sm">{nights}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-7 h-7 rounded-full"
                    disabled={nights >= 30}
                    onClick={() => setNights((n) => Math.min(30, n + 1))}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Plan cards */}
              {plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const style = PLAN_STYLES[plan.type];
                    const prop = plan.property;
                    return (
                      <div
                        key={plan.type}
                        className={cn(
                          "border rounded-2xl overflow-hidden bg-card flex flex-col transition-all duration-300 hover:shadow-lg hover:ring-2",
                          style.ring
                        )}
                      >
                        {/* Badge */}
                        <div className={cn("px-4 py-2 text-center text-sm font-bold border-b", style.badge)}>
                          {style.icon} {style.label}
                        </div>

                        {/* Property image */}
                        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                          {prop.images?.[0] ? (
                            <img
                              src={prop.images[0]}
                              alt={prop.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
                              🏠
                            </div>
                          )}
                        </div>

                        {/* Property info */}
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="font-semibold text-sm line-clamp-1">{prop.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            {prop.rating > 0 && (
                              <div className="flex items-center gap-0.5 text-xs">
                                <Star className="w-3 h-3 fill-primary text-primary" />
                                <span className="font-medium">{prop.rating.toFixed(1)}</span>
                                {prop.reviewCount > 0 && (
                                  <span className="text-muted-foreground">({prop.reviewCount})</span>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              · {prop.location.city}
                            </span>
                          </div>

                          {/* Pricing */}
                          <div className="mt-3 pt-3 border-t space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-muted-foreground">Price per night</span>
                              <span className="font-semibold text-sm">${prop.price}</span>
                            </div>
                            {prop.cleaningFee > 0 && (
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs text-muted-foreground">Cleaning fee</span>
                                <span className="text-sm">${prop.cleaningFee}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-baseline pt-1 border-t border-dashed">
                              <span className="text-xs font-medium">Total ({nights} {nights === 1 ? "night" : "nights"})</span>
                              <span className="font-bold text-base text-primary">${plan.totalCost}</span>
                            </div>
                          </div>

                          {/* Distances */}
                          <div className="mt-3 pt-3 border-t flex-1">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Distances
                            </p>
                            <div className="space-y-1.5">
                              {plan.distances.map((d) => (
                                <div key={d.name} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground truncate mr-2 flex items-center gap-1">
                                    <span>{d.icon}</span>
                                    <span className="truncate">{d.name}</span>
                                  </span>
                                  <span className="font-medium shrink-0">{d.km.toFixed(1)} km</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed text-xs">
                              <span className="font-medium text-muted-foreground">Avg distance</span>
                              <span className="font-bold text-primary">{plan.avgDist.toFixed(1)} km</span>
                            </div>
                          </div>

                          {/* CTA */}
                          <Button
                            className="w-full mt-4 rounded-xl"
                            onClick={() => bookProperty(prop.id)}
                          >
                            Book this property
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No plans could be generated</p>
                  <p className="text-sm mt-1">No properties with coordinates found in {selectedCity.name}.</p>
                </div>
              )}

              {/* Note about same property */}
              {plans.length === 3 &&
                plans[0].property.id === plans[1].property.id &&
                plans[1].property.id === plans[2].property.id && (
                  <p className="text-center text-xs text-muted-foreground bg-muted/50 rounded-xl py-2 px-4">
                    All plans recommend the same property — it's the best (and only) option in {selectedCity.name}!
                  </p>
                )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { TripPlanner };
