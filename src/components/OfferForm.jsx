import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const COMMISSION_TYPES = [
  { value: "", label: "Not yet agreed" },
  { value: "percentage", label: "Percentage of sale" },
  { value: "fixed_lead", label: "Fixed — per qualified lead" },
  { value: "fixed_sale", label: "Fixed — per completed sale" },
  { value: "custom", label: "Custom agreement" },
];

const STATUS_OPTIONS = ["active", "test", "inactive", "expired"];

function vehicleLabel(vehicle) {
  if (!vehicle) return "Unknown vehicle";
  return `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
}

export default function OfferForm({ offer, vehicles, partners, onSaved, onCancel }) {
  const [vehicleId, setVehicleId] = useState(offer?.vehicle_id || "");
  const [partnerId, setPartnerId] = useState(offer?.partner_id || "");
  const [affiliateUrl, setAffiliateUrl] = useState(
    offer?.affiliate_url || ""
  );
  const [trackingId, setTrackingId] = useState(offer?.tracking_id || "");
  const [cta, setCta] = useState(offer?.cta || "View Deal");
  const [commissionType, setCommissionType] = useState(
    offer?.commission_type || ""
  );
  const [commissionRate, setCommissionRate] = useState(
    offer?.commission_rate ?? ""
  );
  const [cookieDuration, setCookieDuration] = useState(
    offer?.cookie_duration_days ?? ""
  );
  const [startDate, setStartDate] = useState(offer?.start_date || "");
  const [endDate, setEndDate] = useState(offer?.end_date || "");
  const [status, setStatus] = useState(offer?.status || "test");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const approvedPartners = partners.filter(
    (partner) => partner.status === "approved"
  );

  const commissionRateLabel =
    commissionType === "percentage"
      ? "Commission Rate (%)"
      : commissionType === "fixed_lead" || commissionType === "fixed_sale"
      ? "Commission Amount ($)"
      : "Commission Rate / Amount";

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!vehicleId || !partnerId || !affiliateUrl.trim()) {
        throw new Error(
          "Vehicle, partner and affiliate URL are required."
        );
      }

      const offerData = {
        vehicle_id: vehicleId,
        partner_id: partnerId,
        affiliate_url: affiliateUrl.trim(),
        tracking_id: trackingId.trim() || null,
        cta: cta.trim() || "View Deal",
        commission_type: commissionType || null,
        commission_rate: commissionRate === "" ? null : Number(commissionRate),
        cookie_duration_days:
          cookieDuration === "" ? null : Number(cookieDuration),
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      };

      let result;

      if (offer?.id) {
        result = await supabase
          .from("affiliate_offers")
          .update(offerData)
          .eq("id", offer.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("affiliate_offers")
          .insert(offerData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSaved(result.data);
    } catch (submitError) {
      console.error("Affiliate offer save error:", submitError);
      setError(submitError.message || "Unable to save this offer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vehicleFormOverlay">
      <div className="vehicleFormCard">
        <div className="vehicleFormHeader">
          <div>
            <span className="adminEyebrow">AFFILIATE OFFERS</span>
            <h2>{offer ? "Edit Offer" : "Add Offer"}</h2>
          </div>

          <button
            type="button"
            className="formCloseButton"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        {error && <div className="formError">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <div className="formGroup">
              <label htmlFor="offerVehicle">Vehicle</label>
              <select
                id="offerVehicle"
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicleLabel(vehicle)}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="offerPartner">Partner</label>
              <select
                id="offerPartner"
                value={partnerId}
                onChange={(event) => setPartnerId(event.target.value)}
                required
              >
                <option value="">Select partner</option>
                {approvedPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="offerCta">CTA Text</label>
              <input
                id="offerCta"
                value={cta}
                onChange={(event) => setCta(event.target.value)}
                placeholder="View Deal"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="offerTrackingId">Tracking ID</label>
              <input
                id="offerTrackingId"
                value={trackingId}
                onChange={(event) => setTrackingId(event.target.value)}
                placeholder="LMCT-001"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="offerCommissionType">Commission Model</label>
              <select
                id="offerCommissionType"
                value={commissionType}
                onChange={(event) => setCommissionType(event.target.value)}
              >
                {COMMISSION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="offerCommissionRate">
                {commissionRateLabel}
              </label>
              <input
                id="offerCommissionRate"
                type="number"
                step="0.01"
                min="0"
                value={commissionRate}
                onChange={(event) => setCommissionRate(event.target.value)}
                placeholder={commissionType === "percentage" ? "2" : "100"}
                disabled={!commissionType}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="offerCookieDuration">
                Cookie Duration (days)
              </label>
              <input
                id="offerCookieDuration"
                type="number"
                min="0"
                value={cookieDuration}
                onChange={(event) => setCookieDuration(event.target.value)}
                placeholder="30"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="offerStatus">Status</label>
              <select
                id="offerStatus"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="offerStartDate">Start Date</label>
              <input
                id="offerStartDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="offerEndDate">End Date</label>
              <input
                id="offerEndDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="offerAffiliateUrl">Affiliate URL</label>
            <input
              id="offerAffiliateUrl"
              type="url"
              value={affiliateUrl}
              onChange={(event) => setAffiliateUrl(event.target.value)}
              placeholder="https://partner.com/track?ref=lmct-001"
              required
            />
          </div>

          <div className="formActions">
            <button
              type="button"
              className="adminSecondaryButton"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="adminPrimaryButton"
              disabled={saving}
            >
              {saving ? "Saving..." : offer ? "Save Changes" : "Add Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
