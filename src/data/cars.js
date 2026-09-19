export function formatVehicle(vehicle, offer) {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    category: vehicle.category,
    price: vehicle.price,
    description: vehicle.description,
    image: vehicle.image_url,
    location: offer?.partners?.name || "Partner Dealer",
    advertiser: offer?.partners?.name || "Partner Dealer",
    affiliateOfferId: offer?.id || null,
    affiliateUrl: offer?.affiliate_url || "#",
    cta: offer?.cta || "View Deal",
    offerStatus: offer?.status || "inactive",
  };
}