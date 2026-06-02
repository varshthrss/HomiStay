import { Link } from "wouter";
import { StarRating } from "./StarRating";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";

function PropertyCard({ property }) {
  const [isHovered, setIsHovered] = useState(false);
  const { wishlist, toggleWishlist, user } = useAppContext();
  const isSaved = wishlist?.includes(String(property.id));
  const isHost = user?.role === "host" || user?.role === "admin";

  return (
    <Link href={`/property/${property.id}`} className="group block">
      <div
        className="flex flex-col gap-3 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`property-card-${property.id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!isHost && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white text-foreground z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(property.id);
              }}
            >
              <Heart className={`w-5 h-5 transition-colors ${isSaved ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-foreground"}`} />
            </Button>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground line-clamp-1">{property.location.city}, {property.location.country}</h3>
            <StarRating rating={property.rating} />
          </div>
          <p className="text-muted-foreground text-sm line-clamp-1">{property.title}</p>
          <div className="mt-1">
            {property.seasonName && property.effectivePrice && property.effectivePrice !== property.price ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">${property.effectivePrice}</span>
                <span className="text-muted-foreground text-sm">/ night</span>
                <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">{property.seasonName}</span>
              </div>
            ) : (
              <>
                <span className="font-semibold text-foreground">${property.price}</span>
                <span className="text-muted-foreground text-sm"> / night</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export { PropertyCard };
