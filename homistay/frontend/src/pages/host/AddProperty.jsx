import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Home, MapPin, List, DollarSign, ChevronLeft, ChevronRight, Plus, X, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi, propertiesApi, normalizeProperty, normalizeUser } from "@/services/api";

const STEPS = [
  { id: 1, label: "Property Type", icon: Home },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Details", icon: List },
  { id: 4, label: "Amenities", icon: CheckCircle2 },
  { id: 5, label: "Pricing", icon: DollarSign },
];

const PROPERTY_TYPES = [
  { value: "entire", label: "Entire home", desc: "Guests have the whole place to themselves" },
  { value: "private", label: "Private room", desc: "Guests have their own room in a home you share" },
  { value: "shared", label: "Shared room", desc: "Guests sleep in a room or common area shared with others" },
];

const CATEGORIES = [
  { value: "mountain", label: "Mountain" },
  { value: "city", label: "City" },
  { value: "countryside", label: "Countryside" },
  { value: "cabin", label: "Cabin" },
  { value: "villa", label: "Villa" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
  "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Guatemala", "Guinea", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palestine", "Panama",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "San Marino", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vatican City", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const ALL_AMENITIES = [
  "WiFi", "Pool", "Kitchen", "Air conditioning", "Free parking", "Washer", "Dryer",
  "TV", "Gym", "Hot tub", "Indoor fireplace", "Ocean view", "Mountain view",
  "Patio or balcony", "Breakfast", "Pet-friendly", "Workspace", "Elevator",
  "Sauna", "Barbecue grill", "Bicycle", "Kayak",
];

const initial = {
  type: "", category: "", customCategory: "", address: "", city: "", state: "", pincode: "", country: "",
  title: "", description: "", bedrooms: "1", bathrooms: "1", maxGuests: "2",
  amenities: [], customAmenities: [], price: "", cleaningFee: "", minNights: "1", houseRules: "",
  guestRequirements: "", checkInInstructions: "",
  imageUrls: "", allowsChildren: true, allowsInfants: true, allowsPets: false,
};

function SearchableSelect({ options, value, onChange, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const ref = useRef(null);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Label>{label} *</Label>
      <div className="relative mt-1.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex h-10 w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          autoComplete="off"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors", option === value && "bg-primary/5 font-medium")}
              onClick={() => { onChange(option); setQuery(option); setOpen(false); }}
            >
              <MapPin className="w-3.5 h-3.5 inline mr-2 text-muted-foreground" />
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPropertyPage() {
  const { id } = useParams();
  const { user, setUser, properties, setProperties } = useAppContext();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [mapState, setMapState] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState("");
  const geoTimeoutRef = useRef(null);
  const isHost = user?.role === "host" || user?.role === "admin";
  const isEdit = !!id;

  useEffect(() => {
    if (!id || !properties.length) return;
    const existing = properties.find((p) => String(p.id) === String(id));
    if (!existing) return;
    setForm({
      type: existing.type,
      category: existing.category === "beach" ? "other" : existing.category,
      customCategory: existing.category === "beach" ? existing.category : "",
      address: existing.location?.address || "",
      city: existing.location?.city || "",
      state: existing.location?.state || "",
      pincode: existing.location?.pincode || "",
      country: existing.location?.country || "",
      title: existing.title,
      description: existing.description,
      bedrooms: String(existing.bedrooms),
      bathrooms: String(existing.bathrooms),
      maxGuests: String(existing.maxGuests),
      amenities: (existing.amenities || []).filter((a) => !a.startsWith("Custom:")),
      customAmenities: (existing.amenities || []).filter((a) => a.startsWith("Custom:")).map((a) => a.replace("Custom:", "")) || [],
      price: String(existing.price),
      cleaningFee: String(existing.cleaningFee || ""),
      minNights: "1",
      allowsChildren: existing.allowsChildren !== false,
      allowsInfants: existing.allowsInfants !== false,
      allowsPets: existing.allowsPets === true,
      houseRules: existing.houseRules || "",
      guestRequirements: existing.guestRequirements || "",
      checkInInstructions: existing.checkInInstructions || "",
      imageUrls: existing.images?.join("\n") || "",
    });
  }, [id, properties]);

  const [upgrading, setUpgrading] = useState(false);
  const [hostBio, setHostBio] = useState(user?.bio || "");
  const [hostPhone, setHostPhone] = useState(user?.phone || "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [upgradeError, setUperror] = useState("");

  if (!isHost) {
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-3">Become a Host</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Sign up as a host to list your property and start earning.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode: "signup", asHost: true } }))}>
              Sign up as Host
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}>Go home</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-2">Become a Host</h2>
          <p className="text-muted-foreground">
            Your current account is a guest account. Fill in your host details below to start listing properties.
            Your existing bookings and profile will be preserved.
          </p>
        </div>
        <div className="bg-card border rounded-2xl p-8 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="host-name">Name</Label>
            <Input id="host-name" value={user.name || ""} disabled className="rounded-xl bg-muted/30" />
            <p className="text-xs text-muted-foreground">Your existing account name</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="host-email">Email</Label>
            <Input id="host-email" value={user.email || ""} disabled className="rounded-xl bg-muted/30" />
            <p className="text-xs text-muted-foreground">Same email, extended to host privileges</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="host-phone">Phone number <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="host-phone" placeholder="+1 555-123-4567" value={hostPhone} onChange={(e) => setHostPhone(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="host-bio">About you as a host <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea id="host-bio" placeholder="Tell guests a bit about yourself and why you love hosting..." value={hostBio} onChange={(e) => setHostBio(e.target.value)} className="rounded-xl min-h-[100px]" />
          </div>
          <Separator />
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
            />
            <span className="text-sm text-muted-foreground">
              I confirm that I want to upgrade my account to a host account. I understand that I will still have access to my guest bookings and profile, but I will not be able to book my own properties.
            </span>
          </label>
          {upgradeError && <p className="text-sm text-destructive font-medium">{upgradeError}</p>}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              disabled={!agreeTerms || upgrading}
              onClick={async () => {
                setUperror("");
                setUpgrading(true);
                try {
                  const updatedUser = await authApi.upgradeToHost();
                  if (hostBio || hostPhone) {
                    await authApi.updateProfile({ bio: hostBio || undefined, phone: hostPhone || undefined });
                  }
                  setUser(normalizeUser({ ...updatedUser, bio: hostBio, phone: hostPhone }));
                } catch (e) {
                  setUperror(e.response?.data?.message || "Upgrade failed. Please try again.");
                  setUpgrading(false);
                  return;
                }
                setUpgrading(false);
              }}
            >
              {upgrading ? "Upgrading..." : "Confirm & Become a Host"}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleAmenity = (amenity) => {
    update("amenities",
      form.amenities.includes(amenity)
        ? form.amenities.filter((a) => a !== amenity)
        : [...form.amenities, amenity]
    );
  };

  const addCustomAmenity = () => {
    const val = form.customAmenityInput?.trim();
    if (!val || form.customAmenities.includes(val)) return;
    update("customAmenities", [...form.customAmenities, val]);
    update("customAmenityInput", "");
  };

  const removeCustomAmenity = (val) => {
    update("customAmenities", form.customAmenities.filter((a) => a !== val));
  };

  const geocodeAddress = useCallback(async () => {
    const addr = [form.address, form.city, form.country].filter(Boolean).join(", ");
    if (!addr) return;
    setGeocoding(true);
    setGeoError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapState({ lat: Number(lat), lng: Number(lon) });
        setGeoError("");
      } else {
        setGeoError("Could not find this location. Please refine the address.");
        setMapState(null);
      }
    } catch {
      setGeoError("Geocoding failed. Check your address or try again.");
    } finally {
      setGeocoding(false);
    }
  }, [form.address, form.city, form.country]);

  // Auto-geocode when address fields change or entering step 2 (debounced)
  useEffect(() => {
    if (geoTimeoutRef.current) clearTimeout(geoTimeoutRef.current);
    const addr = [form.address, form.country].filter(Boolean).join(", ");
    if (!addr || step !== 2) return;
    geoTimeoutRef.current = setTimeout(() => {
      geocodeAddress();
    }, 800);
    return () => { if (geoTimeoutRef.current) clearTimeout(geoTimeoutRef.current); };
  }, [form.address, form.city, form.country, step]);

  const canNext = () => {
    const e = validate();
    setFormErrors(e);
    switch (step) {
      case 1: return !!form.type && !!form.category;
      case 2: return !!form.address && !!form.country && !!form.pincode && !!mapState;
      case 3: return !!form.title && !!form.description;
      case 4: return form.amenities.length + form.customAmenities.length >= 3;
      case 5: return !!form.price && Number(form.price) > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    const e = validate();
    setFormErrors(e);
    const stepFields = { 1: ["type", "category", "customCategory"], 2: ["address", "city", "country", "pincode"], 3: ["title", "description"], 4: ["amenities"], 5: ["price", "cleaningFee"] };
    const hasStepErr = stepFields[step]?.some((f) => e[f]);
    if (!hasStepErr) setStep((s) => s + 1);
  };

  const validate = () => {
    const errors = {};
    if (!form.type) errors.type = "Select a property type";
    if (!form.category) errors.category = "Select a category";
    if (form.category === "other" && !form.customCategory?.trim()) errors.customCategory = "Enter your custom category";
    if (!form.address?.trim()) errors.address = "Enter the street address";
    if (!form.country?.trim()) errors.country = "Select or type a country";
    if (!form.city?.trim()) errors.city = "Enter the city";
    if (!form.pincode?.trim()) errors.pincode = "Enter pincode";
    else if (!/^\d{4,10}$/.test(form.pincode.trim())) errors.pincode = "Enter a valid pincode (4-10 digits)";
    if (!mapState && step === 2) errors.location = "Please verify your address location first (click 'Verify address').";
    if (!form.title?.trim()) errors.title = "Enter a title";
    if (!form.description?.trim()) errors.description = "Enter a description";
    if (form.amenities.length + form.customAmenities.length < 3) errors.amenities = "Select or add at least 3 amenities";
    const price = Number(form.price);
    if (!form.price?.trim() || isNaN(price) || price <= 0) errors.price = "Enter a valid price greater than 0";
    const cleaning = Number(form.cleaningFee);
    if (form.cleaningFee?.trim() && (isNaN(cleaning) || cleaning < 0)) errors.cleaningFee = "Cleaning fee cannot be negative";
    const bedrooms = Number(form.bedrooms);
    if (isNaN(bedrooms) || bedrooms < 1) errors.bedrooms = "Must be at least 1";
    const bathrooms = Number(form.bathrooms);
    if (isNaN(bathrooms) || bathrooms < 1) errors.bathrooms = "Must be at least 1";
    const maxGuests = Number(form.maxGuests);
    if (isNaN(maxGuests) || maxGuests < 1) errors.maxGuests = "Must be at least 1";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const imageUrlsArray = form.imageUrls
        ? form.imageUrls.split(/[\n,]+/).map(url => url.trim()).filter(url => url.length > 0)
        : [];

      const allAmenities = [...form.amenities, ...form.customAmenities];

      const payload = {
        title: form.title, description: form.description,
        type: form.type.toUpperCase(), city: form.city, country: form.country,
        address: form.address,
        pricePerNight: Number(form.price),
        cleaningFee: Number(form.cleaningFee) || 0,
        maxGuests: Number(form.maxGuests), bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms), amenities: allAmenities.join(","),
        imageUrls: imageUrlsArray,
        latitude: mapState?.lat || null,
        longitude: mapState?.lng || null,
        allowsChildren: form.allowsChildren,
        allowsInfants: form.allowsInfants,
        allowsPets: form.allowsPets,
        houseRules: form.houseRules,
        guestRequirements: form.guestRequirements,
        checkInInstructions: form.checkInInstructions,
      };

      if (isEdit) {
        const updated = await propertiesApi.update(id, payload);
        setProperties(properties.map((p) => String(p.id) === String(id) ? normalizeProperty(updated) : p));
      } else {
        const created = await propertiesApi.create(payload);
        setProperties([...properties, normalizeProperty(created)]);
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.response?.data?.error || "Failed to save property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const err = (field) => formErrors[field] ? <p className="text-xs text-destructive mt-1">{formErrors[field]}</p> : null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">{isEdit ? "Property updated!" : "Property listed!"}</h1>
          <p className="text-muted-foreground mb-8">{isEdit ? "Your changes are now live." : "Your property is now live and accepting bookings."}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/host/properties")}>View my properties</Button>
            {!isEdit && (
              <Button variant="outline" onClick={() => { setForm(initial); setStep(1); setSubmitted(false); setMapState(null); }}>List another</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h1 className="font-serif text-3xl font-bold">{isEdit ? "Edit your property" : "List your property"}</h1>
            <Button type="button" variant="outline" size="sm" onClick={() => setLocation("/host/properties")} className="rounded-full">
              Back to properties
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                  step > s.id ? "bg-primary text-primary-foreground"
                    : step === s.id ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground")}>
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className={cn("text-xs font-medium hidden sm:block", step === s.id ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                {i < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 rounded", step > s.id ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-sm min-h-[400px] flex flex-col">
          {step === 1 && (
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-semibold mb-2">What type of place is it?</h2>
              <p className="text-muted-foreground text-sm mb-6">Choose the option that best describes your space.</p>
              <div className="space-y-3 mb-8">
                {PROPERTY_TYPES.map((type) => (
                  <button key={type.value} type="button" onClick={() => update("type", type.value)}
                    className={cn("w-full text-left p-4 border rounded-xl transition-all", form.type === type.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/20")}>
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{type.desc}</p>
                  </button>
                ))}
                {err("type")}
              </div>
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.value} type="button" onClick={() => update("category", cat.value)}
                    className={cn("p-3 border rounded-xl text-sm font-medium text-center transition-all", form.category === cat.value ? "border-primary bg-primary/5 ring-1 ring-primary text-primary" : "hover:border-foreground/20")}>
                    {cat.label}
                  </button>
                ))}
              </div>
              {form.category === "other" && (
                <div className="mt-3">
                  <Input placeholder="Enter your custom category" value={form.customCategory || ""} onChange={(e) => update("customCategory", e.target.value)} className="rounded-xl" />
                </div>
              )}
              {err("customCategory")}
              {err("category")}
            </div>
          )}

          {step === 2 && (
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-semibold mb-2">Where is your place?</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address">Street address *</Label>
                  <Input id="address" placeholder="123 Main Street" value={form.address} onChange={(e) => update("address", e.target.value)} className="rounded-xl" />
                  {err("address")}
                </div>
                <SearchableSelect
                  label="Country"
                  placeholder="Search countries…"
                  options={COUNTRIES}
                  value={form.country}
                  onChange={(v) => update("country", v)}
                  err={err}
                />
                {err("country")}
                <div className="space-y-1.5">
                  <Label htmlFor="state">State / Region</Label>
                  <Input id="state" placeholder="e.g. Karnataka" value={form.state} onChange={(e) => update("state", e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" placeholder="e.g. Bengaluru" value={form.city} onChange={(e) => update("city", e.target.value)} className="rounded-xl" />
                    {err("city")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode / Zip *</Label>
                    <Input id="pincode" placeholder="560001" value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 10))} className="rounded-xl" inputMode="numeric" />
                    {err("pincode")}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-semibold">Location preview</Label>
                    <Button type="button" variant="outline" size="sm" onClick={geocodeAddress} disabled={geocoding || !form.address || !form.country} className="gap-2 rounded-lg">
                      {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      {geocoding ? "Verifying…" : "Verify address"}
                    </Button>
                  </div>
                  {geoError && <p className="text-xs text-destructive mb-2">{geoError}</p>}
                  {err("location")}
                  {mapState ? (
                    <div className="w-full rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-200">Location verified</p>
                        <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">
                          {[form.address, form.city, form.country].filter(Boolean).join(", ")}
                        </p>
                        <p className="text-green-600 dark:text-green-400 text-xs">
                          Lat: {mapState.lat.toFixed(4)}, Lng: {mapState.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-[80px] rounded-xl bg-muted/30 flex items-center justify-center text-xs text-muted-foreground gap-2">
                      <Loader2 className="w-4 h-4 animate-pulse" />
                      Verifying address location...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-semibold mb-2">Tell us about your place</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Property title *</Label>
                  <Input id="title" placeholder="e.g. Cozy beachfront villa with ocean views" value={form.title} onChange={(e) => update("title", e.target.value)} className="rounded-xl" />
                  {err("title")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" placeholder="Describe what makes your place unique…" value={form.description} onChange={(e) => update("description", e.target.value)} className="rounded-xl min-h-[120px]" />
                  {err("description")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="imageUrls">Image URLs <span className="text-muted-foreground font-normal">(one per line)</span></Label>
                  <Textarea id="imageUrls" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" value={form.imageUrls} onChange={(e) => update("imageUrls", e.target.value)} className="rounded-xl min-h-[100px]" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input id="bedrooms" type="number" min="1" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} className="rounded-xl" />
                    {err("bedrooms")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input id="bathrooms" type="number" min="1" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className="rounded-xl" />
                    {err("bathrooms")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxGuests">Max guests</Label>
                    <Input id="maxGuests" type="number" min="1" value={form.maxGuests} onChange={(e) => update("maxGuests", e.target.value)} className="rounded-xl" />
                    {err("maxGuests")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-semibold mb-2">What do you offer?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Select at least 3 amenities to continue. ({form.amenities.length + form.customAmenities.length} selected)
              </p>
              <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto">
                {ALL_AMENITIES.map((amenity) => (
                  <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                    className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-all shrink-0", form.amenities.includes(amenity) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-foreground/30")}>
                    {amenity}
                  </button>
                ))}
              </div>

              <div className="border-t pt-4 mb-4">
                <Label className="text-sm font-semibold mb-2 block">Custom amenities</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Enter a custom amenity"
                    value={form.customAmenityInput || ""}
                    onChange={(e) => update("customAmenityInput", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                    className="rounded-xl"
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-xl" onClick={addCustomAmenity}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.customAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {form.customAmenities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        {a}
                        <button type="button" onClick={() => removeCustomAmenity(a)} className="hover:text-destructive ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">Guest policies</Label>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">Children (ages 2-12)</p>
                      <p className="text-xs text-muted-foreground">Allow children to stay</p>
                    </div>
                    <input type="checkbox" checked={form.allowsChildren} onChange={(e) => update("allowsChildren", e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">Infants (under 2)</p>
                      <p className="text-xs text-muted-foreground">Allow infants to stay</p>
                    </div>
                    <input type="checkbox" checked={form.allowsInfants} onChange={(e) => update("allowsInfants", e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">Pets</p>
                      <p className="text-xs text-muted-foreground">Allow pets in your property</p>
                    </div>
                    <input type="checkbox" checked={form.allowsPets} onChange={(e) => update("allowsPets", e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">Guest requirements</Label>
                <p className="text-xs text-muted-foreground mb-3">Set requirements guests must acknowledge before booking.</p>
                <div className="space-y-2 mb-3">
                  {["Government ID required", "Minimum age 18", "Minimum age 21", "Security deposit required", "No smoking", "No parties/events"].map((req) => (
                    <label key={req} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.guestRequirements.includes(req)}
                        onChange={(e) => {
                          const current = form.guestRequirements ? form.guestRequirements.split(", ") : [];
                          const updated = e.target.checked ? [...current, req] : current.filter((r) => r !== req);
                          update("guestRequirements", updated.join(", "));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm">{req}</span>
                    </label>
                  ))}
                </div>
                <Textarea placeholder="Or type custom requirements (comma separated)…" value={form.guestRequirements} onChange={(e) => update("guestRequirements", e.target.value)} className="rounded-xl" />
              </div>

              {err("amenities")}
            </div>
          )}

          {step === 5 && (
            <div className="flex-1">
              <h2 className="font-serif text-2xl font-semibold mb-2">Set your pricing</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Base price per night (USD) *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="price" type="number" min="1" placeholder="150" value={form.price} onChange={(e) => update("price", e.target.value)} className="pl-8 rounded-xl" />
                  </div>
                  {err("price")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cleaningFee">Cleaning fee (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="cleaningFee" type="number" min="0" placeholder="50" value={form.cleaningFee} onChange={(e) => { const cleaned = e.target.value.replace(/[^0-9.]/g, ""); update("cleaningFee", cleaned); }} className="pl-8 rounded-xl" />
                  </div>
                  {err("cleaningFee")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minNights">Minimum nights</Label>
                  <Input id="minNights" type="number" min="1" value={form.minNights} onChange={(e) => update("minNights", e.target.value)} className="rounded-xl" />
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label htmlFor="houseRules">House rules <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea id="houseRules" placeholder="e.g. No smoking, no parties, check-in after 3pm…" value={form.houseRules} onChange={(e) => update("houseRules", e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkInInstructions">Check-in instructions <span className="text-muted-foreground font-normal">(private — only shown to confirmed guests)</span></Label>
                  <Textarea id="checkInInstructions" placeholder="e.g. WiFi password, door code, directions, house manual…" value={form.checkInInstructions} onChange={(e) => update("checkInInstructions", e.target.value)} className="rounded-xl" />
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-semibold mb-2">Summary</p>
                  <p>{form.title}</p>
                  <p className="text-muted-foreground">
                    {form.city}{form.state ? `, ${form.state}` : ""}, {form.country}{form.pincode ? ` · ${form.pincode}` : ""}
                  </p>
                  <p className="text-muted-foreground">{form.bedrooms} bed · {form.bathrooms} bath · Up to {form.maxGuests} guests</p>
                  {form.price && (
                    <p className="font-medium">
                      ${form.price}/night{form.cleaningFee ? ` + $${form.cleaningFee} cleaning fee` : ""}
                      {mapState ? " · Location verified" : " · Location not verified"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button type="button" variant="ghost" onClick={() => {
              if (step > 1) {
                setStep((s) => s - 1);
              } else {
                setLocation("/host/properties");
              }
            }} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Cancel"}
            </Button>
            {submitError && <p className="text-sm text-destructive text-center max-w-xs">{submitError}</p>}
            {step < 5 ? (
              <Button onClick={handleNext} className="gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "List property"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AddPropertyPage };