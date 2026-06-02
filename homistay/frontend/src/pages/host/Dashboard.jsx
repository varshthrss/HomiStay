import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, CalendarDays, Star, Plus, TrendingUp, Clock } from "lucide-react";
import { Link } from "wouter";
import { hostApi, normalizeBooking } from "@/services/api";

function HostDashboard() {
  const { user } = useAppContext();
  const [, setLocation] = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const isHost = user?.role === "host" || user?.role === "admin";

  useEffect(() => {
    if (!isHost) return;
    hostApi.dashboard()
      .then((data) => setDashboard(data))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [isHost]);

  if (!isHost) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold mb-4">Host access required</h2>
        <Button onClick={() => setLocation("/")}>Go home</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading dashboard…</div>;
  }

  const totalEarnings = dashboard?.totalEarnings ?? 0;
  const monthlyEarnings = dashboard?.monthlyEarnings ?? 0;
  const activeListings = dashboard?.activeProperties ?? dashboard?.activeListings ?? 0;
  const confirmedBookings = dashboard?.confirmedBookings ?? 0;
  const avgRating = dashboard?.averageRating ? Number(dashboard.averageRating).toFixed(1) : "—";
  const recentBookings = (dashboard?.recentBookings ?? []).map(normalizeBooking);

  const statusColors = {
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your properties</p>
          </div>
          <Link href="/host/add-property">
            <Button className="gap-2 rounded-full" data-testid="button-add-property">
              <Plus className="w-4 h-4" /> Add property
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total Earnings", value: `$${Number(totalEarnings).toLocaleString()}`, icon: DollarSign, sub: "All time", color: "text-green-600" },
            { label: "Monthly Earnings", value: `$${Number(monthlyEarnings).toLocaleString()}`, icon: TrendingUp, sub: "Last 30 days", color: "text-emerald-500" },
            { label: "Active Listings", value: activeListings, icon: Home, sub: "properties", color: "text-blue-600" },
            { label: "Confirmed Bookings", value: confirmedBookings, icon: CalendarDays, sub: "Total bookings", color: "text-primary" },
            { label: "Average Rating", value: avgRating, icon: Star, sub: "Across all properties", color: "text-amber-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-2xl p-5">
              <stat.icon className={`w-5 h-5 mb-3 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium mt-0.5">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold">Recent Bookings</h2>
              <Link href="/host/bookings">
                <Button variant="ghost" size="sm" className="text-sm text-primary">View all</Button>
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings yet.</div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">{booking.checkIn} → {booking.checkOut}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">${booking.totalPrice.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status] || ""}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-serif text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: "Add new property", href: "/host/add-property", icon: Plus },
                  { label: "View all bookings", href: "/host/bookings", icon: CalendarDays },
                  { label: "Manage calendar", href: "/host/calendar", icon: Clock },
                  { label: "Earnings report", href: "/host/earnings", icon: TrendingUp },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
                      <action.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { HostDashboard };
