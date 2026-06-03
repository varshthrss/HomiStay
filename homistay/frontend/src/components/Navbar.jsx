import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, UserCircle, LogOut, LayoutDashboard, Home as HomeIcon,
  CalendarDays, PlusCircle, CreditCard, Heart, Search, Headset, DollarSign, Map,
} from "lucide-react";
import { TripPlanner } from "./TripPlanner";
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SearchBar } from "./SearchBar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { authApi, normalizeUser } from "@/services/api";
import { format } from "date-fns";

function Navbar() {
  const [location] = useLocation();
  const { user, login, logout } = useAppContext();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerAsHost, setRegisterAsHost] = useState(false);
  const [isTripPlannerOpen, setIsTripPlannerOpen] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({ destination: "", checkin: null, checkout: null, guests: 0 });

  useEffect(() => {
    setIsSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const parseParams = () => {
      const query = new URLSearchParams(window.location.search);
      const dest = query.get("destination") || "";
      const checkin = query.get("checkin");
      const checkout = query.get("checkout");
      const adults = Number(query.get("adults") || query.get("guests") || "0");
      const children = Number(query.get("children") || "0");
      
      setSearchParams({
        destination: dest,
        checkin: checkin ? new Date(checkin) : null,
        checkout: checkout ? new Date(checkout) : null,
        guests: adults + children
      });
    };

    parseParams();
    window.addEventListener("locationchange", parseParams);
    return () => window.removeEventListener("locationchange", parseParams);
  }, []);

  const showCompactSearch = location !== "/" && !location.startsWith("/host");
  // Treat admin same as host for UI purposes
  const isHost = user?.role === "host" || user?.role === "admin";
  const isSupport = user?.role === "support_team" || user?.role === "admin";
  const isGuest = user?.role === "guest";

  // Listen for open-auth event from footer "List your home" button
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.mode) setAuthMode(e.detail.mode);
      if (e.detail?.asHost) setRegisterAsHost(true);
      setIsLoginOpen(true);
    };
    window.addEventListener("open-auth", handler);
    return () => window.removeEventListener("open-auth", handler);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    // Basic JS validation — avoids browser native "please fill in this field" tooltip
    if (!email.trim()) { setAuthError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setAuthError("Please enter a valid email address."); return; }
    if (authMode === "signup") {
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!password || !passwordRegex.test(password)) { setAuthError("Password must be at least 8 characters with letters, numbers, and a symbol."); return; }
    }
    if (authMode === "signup" && password !== confirmPassword) { setAuthError("Passwords do not match."); return; }
    if (authMode === "signup" && !fullName.trim()) { setAuthError("Full name is required."); return; }

    setIsSubmitting(true);
    try {
      let response;
      if (authMode === "login") {
        response = await authApi.login(email.trim(), password);
      } else {
        response = await authApi.register(fullName.trim(), email.trim(), password, registerAsHost ? "HOST" : "GUEST");
      }
      // Store tokens; clear any legacy "role" key from older integrations
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.removeItem("role");
      login(normalizeUser(response.user));
      setIsLoginOpen(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 401
          ? "Invalid email or password."
          : "Something went wrong. Please try again.");
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setAuthError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link href="/">
          <span className="font-serif text-2xl font-bold text-primary cursor-pointer tracking-tight" data-testid="logo">
            Homistay
          </span>
        </Link>

        {showCompactSearch && (
          <div className="hidden md:block flex-1 max-w-md mx-auto">
            <SearchBar variant="compact" />
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Trip Planner button — visible to all on desktop */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              className="font-semibold text-sm gap-1.5"
              onClick={() => {
                if (!user) {
                  window.dispatchEvent(new CustomEvent('open-auth', { detail: { mode: 'login' } }));
                } else {
                  setIsTripPlannerOpen(true);
                }
              }}
            >
              <Map className="w-4 h-4" />
              Trip Planner
            </Button>
          </div>
          {!user && (
            <div className="hidden md:block">
              <Button
                variant="ghost"
                className="font-semibold text-sm"
                onClick={() => { setAuthMode("signup"); setRegisterAsHost(true); setIsLoginOpen(true); }}
              >
                Homistay your home
              </Button>
            </div>
          )}
          {user && !isHost && (
            <div className="hidden md:block">
              <Link href="/host/add-property">
                <Button variant="ghost" className="font-semibold text-sm">
                  Become a host
                </Button>
              </Link>
            </div>
          )}

          {isHost && !location.startsWith("/host") && (
            <div className="hidden md:block">
              <Link href="/host/dashboard">
                <Button variant="ghost" className="font-semibold text-sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full px-2 py-1 h-12 flex items-center gap-2 hover:shadow-md transition-all border-border/50"
                >
                  <Menu className="w-5 h-5 ml-2" />
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                <div className="px-2 py-1.5 pb-3 mb-1 border-b">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>

                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/profile" className="flex items-center w-full">
                    <UserCircle className="w-4 h-4 mr-2" /> Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setIsTripPlannerOpen(true)} className="rounded-lg cursor-pointer">
                  <Map className="w-4 h-4 mr-2" /> Trip Planner
                </DropdownMenuItem>

                {isGuest && (
                  <>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/my-bookings" className="flex items-center w-full">
                        <CalendarDays className="w-4 h-4 mr-2" /> My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/wishlist" className="flex items-center w-full">
                        <Heart className="w-4 h-4 mr-2" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {isHost && (
                  <>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/host/dashboard" className="flex items-center w-full">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/host/properties" className="flex items-center w-full">
                        <HomeIcon className="w-4 h-4 mr-2" /> My Properties
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/my-bookings" className="flex items-center w-full">
                        <CalendarDays className="w-4 h-4 mr-2" /> Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/host/earnings" className="flex items-center w-full">
                        <CreditCard className="w-4 h-4 mr-2" /> Earnings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link href="/host/pricing" className="flex items-center w-full">
                        <DollarSign className="w-4 h-4 mr-2" /> Pricing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link
                        href="/host/add-property"
                        className="flex items-center w-full text-primary focus:text-primary focus:bg-primary/5"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Property
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {isSupport && (
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/support/dashboard" className="flex items-center w-full">
                      <Headset className="w-4 h-4 mr-2" /> Support Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full px-4 h-12 flex items-center gap-2 hover:shadow-md transition-all border-border/50"
                >
                  <Menu className="w-5 h-5" />
                  <UserCircle className="w-6 h-6 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-center pb-4 border-b">
                    {authMode === "login" ? "Welcome back" : "Join Homistay"}
                  </DialogTitle>
                </DialogHeader>

                {/* Use div + button instead of form to avoid browser native validation tooltips */}
                <div className="flex flex-col gap-4 py-4">
                  {authMode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="auth-fullname">Full name</Label>
                      <Input
                        id="auth-fullname"
                        type="text"
                        placeholder="Jane Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="rounded-xl h-12"
                        autoComplete="name"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">Email</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl h-12"
                      autoComplete="email"
                      onKeyDown={(e) => e.key === "Enter" && handleAuth(e)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl h-12"
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      onKeyDown={(e) => e.key === "Enter" && handleAuth(e)}
                    />
                  </div>

                  {authMode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="auth-confirm-password">Confirm Password</Label>
                      <Input
                        id="auth-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl h-12"
                        autoComplete="new-password"
                        onKeyDown={(e) => e.key === "Enter" && handleAuth(e)}
                      />
                    </div>
                  )}

                  {authMode === "signup" && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        id="register-as-host"
                        checked={registerAsHost}
                        onChange={(e) => setRegisterAsHost(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="register-as-host" className="font-normal cursor-pointer">
                        Sign up as a Host to list properties
                      </Label>
                    </div>
                  )}

                  {authError && (
                    <p className="text-sm text-destructive text-center font-medium">{authError}</p>
                  )}

                  <Button
                    size="lg"
                    className="w-full rounded-xl h-12 mt-2 text-base font-semibold"
                    disabled={isSubmitting}
                    onClick={handleAuth}
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : authMode === "login"
                      ? "Log in"
                      : "Sign up"}
                  </Button>

                  <div className="text-center mt-2">
                    <p className="text-sm text-muted-foreground">
                      {authMode === "login"
                        ? "Don't have an account?"
                        : "Already have an account?"}
                      <button
                        type="button"
                        onClick={() => switchMode(authMode === "login" ? "signup" : "login")}
                        className="ml-1 font-semibold text-foreground underline hover:text-primary transition-colors"
                      >
                        {authMode === "login" ? "Sign up" : "Log in"}
                      </button>
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Trip Planner Dialog */}
      <TripPlanner open={isTripPlannerOpen} onOpenChange={setIsTripPlannerOpen} />
    </header>
  );
}

export { Navbar };
