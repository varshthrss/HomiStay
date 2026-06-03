import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Home, CalendarDays, MessageSquare, MapPin, Users } from "lucide-react";
function useQueryParam(name) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}
function ConfirmationPage() {
  const { bookings, properties } = useAppContext();
  const [, setLocation] = useLocation();
  const bookingId = useQueryParam("id");
  const booking = bookings.find((b) => b.id === bookingId) || bookings[bookings.length - 1];
  const property = booking ? properties.find((p) => p.id === booking.propertyId) : null;
  if (!booking) {
    return <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Booking not found</h2>
        <Button onClick={() => setLocation("/")}>Go home</Button>
      </div>;
  }
  return <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Your booking is confirmed!</h1>
          <p className="text-muted-foreground">Confirmation sent to {booking.guestEmail}</p>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Booking ID</span>
            <Badge variant="outline" className="font-mono text-sm px-3 py-1">{booking.id}</Badge>
          </div>

          {property && <>
              <Separator className="mb-4" />
              <div className="flex gap-4 mb-4">
                <img src={property.images[0]} alt={property.title} className="w-24 h-20 object-cover rounded-xl shrink-0" />
                <div>
                  <p className="font-semibold">{property.title}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{property.location.city}, {property.location.country}</span>
                  </div>
                </div>
              </div>
            </>}

          <Separator className="mb-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Check-in</p>
              <p className="font-semibold">{booking.checkIn}</p>
              <p className="text-xs text-muted-foreground">After 3:00 PM</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Check-out</p>
              <p className="font-semibold">{booking.checkOut}</p>
              <p className="text-xs text-muted-foreground">Before 11:00 AM</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>
                {booking.adults ?? booking.guests} adult{((booking.adults ?? booking.guests) || 0) > 1 ? "s" : ""}
                {booking.children ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
                {booking.infants ? `, ${booking.infants} infant${booking.infants > 1 ? "s" : ""}` : ""}
                {booking.pets ? `, ${booking.pets} pet${booking.pets > 1 ? "s" : ""}` : ""}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total paid</p>
              <p className="font-bold text-lg">${booking.totalPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {
    /* What's Next */
  }
        <div className="bg-card border rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="font-serif text-lg font-semibold mb-4">What's next</h2>
          <div className="space-y-4">
            {[
    { icon: CalendarDays, title: "Save your dates", desc: "Mark your calendar and set travel reminders before your trip." },
    { icon: MessageSquare, title: "Message your host", desc: "Say hello and ask any questions about the property or local tips." },
    { icon: MapPin, title: "Plan your arrival", desc: "Check the address and arrange transportation ahead of time." },
    { icon: Home, title: "Review house rules", desc: "Familiarize yourself with the property's check-in procedures and guidelines." }
  ].map(({ icon: Icon, title, desc }) => <div key={title} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>)}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 rounded-xl gap-2" onClick={() => setLocation("/")} data-testid="button-go-home">
            <Home className="w-4 h-4" /> Return home
          </Button>

        </div>
      </div>
    </div>;
}
export {
  ConfirmationPage
};
