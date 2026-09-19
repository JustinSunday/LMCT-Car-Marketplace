import { supabase } from "../supabaseClient";
import { formatVehicle } from "./cars";

export async function getVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      *,
      affiliate_offers (
        id,
        affiliate_url,
        cta,
        status,
        partners (
          id,
          name,
          website
        )
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data.flatMap((vehicle) => {
    const activeOffers = (vehicle.affiliate_offers || []).filter(
      (offer) => offer.status === "active" || offer.status === "test"
    );

    return activeOffers.map((offer) =>
      formatVehicle(vehicle, offer)
    );
  });
}