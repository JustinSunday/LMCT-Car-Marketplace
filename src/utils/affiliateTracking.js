import { supabase } from "../supabaseClient";

export async function trackAffiliateClick(offer) {
  if (!offer) {
    console.error("Affiliate offer not found.");
    return;
  }

  try {
    const { error } = await supabase
      .from("affiliate_clicks")
      .insert({
        offer_id: offer.id,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      });

    if (error) {
      console.error("Failed to record affiliate click:", error);
      return;
    }

    console.log("LMCT affiliate click recorded in Supabase.");
  } catch (error) {
    console.error("Affiliate tracking error:", error);
  }
}