import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const CONVERSION_TYPES = [
  { value: "lead", label: "Qualified Lead" },
  { value: "sale", label: "Sale" },
  { value: "other", label: "Other" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "AUD"];

function vehicleLabel(vehicle) {
  if (!vehicle) return "Unknown vehicle";
  return `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
}

export default function ConversionForm({
  conversion,
  vehicles,
  partners,
  onSaved,
  onCancel,
}) {
  const [partnerId, setPartnerId] = useState(conversion?.partner_id || "");
  const [vehicleId, setVehicleId] = useState(conversion?.vehicle_id || "");
  const [conversionType, setConversionType] = useState(
    conversion?.conversion_type || "lead"
  );
  const [externalReference, setExternalReference] = useState(
    conversion?.external_reference || ""
  );
  const [conversionValue, setConversionValue] = useState(
    conversion?.conversion_value ?? ""
  );
  const [commissionAmount, setCommissionAmount] = useState(
    conversion?.commission_amount ?? ""
  );
  const [currency, setCurrency] = useState(conversion?.currency || "USD");
  const [status, setStatus] = useState(conversion?.status || "pending");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const approvedPartners = partners.filter(
    (partner) => partner.status === "approved"
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!partnerId) {
        throw new Error("Partner is required.");
      }

      const conversionData = {
        partner_id: partnerId,
        vehicle_id: vehicleId || null,
        conversion_type: conversionType,
        external_reference: externalReference.trim() || null,
        conversion_value:
          conversionValue === "" ? null : Number(conversionValue),
        commission_amount:
          commissionAmount === "" ? null : Number(commissionAmount),
        currency,
        status,
      };

      let result;

      if (conversion?.id) {
        result = await supabase
          .from("conversions")
          .update(conversionData)
          .eq("id", conversion.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("conversions")
          .insert(conversionData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSaved(result.data);
    } catch (submitError) {
      console.error("Conversion save error:", submitError);
      setError(submitError.message || "Unable to save this conversion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vehicleFormOverlay">
      <div className="vehicleFormCard">
        <div className="vehicleFormHeader">
          <div>
            <span className="adminEyebrow">CONVERSIONS</span>
            <h2>{conversion ? "Edit Conversion" : "Record Conversion"}</h2>
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
              <label htmlFor="conversionPartner">Partner</label>
              <select
                id="conversionPartner"
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
              <label htmlFor="conversionVehicle">Vehicle (optional)</label>
              <select
                id="conversionVehicle"
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
              >
                <option value="">No specific vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicleLabel(vehicle)}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="conversionType">Conversion Type</label>
              <select
                id="conversionType"
                value={conversionType}
                onChange={(event) => setConversionType(event.target.value)}
              >
                {CONVERSION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="conversionReference">
                Reference / Customer ID
              </label>
              <input
                id="conversionReference"
                value={externalReference}
                onChange={(event) =>
                  setExternalReference(event.target.value)
                }
                placeholder="Dealer's reference for this referral"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="conversionValue">Sale/Lead Value</label>
              <input
                id="conversionValue"
                type="number"
                step="0.01"
                min="0"
                value={conversionValue}
                onChange={(event) => setConversionValue(event.target.value)}
                placeholder="e.g. sale price, if applicable"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="conversionCommission">
                Commission Owed
              </label>
              <input
                id="conversionCommission"
                type="number"
                step="0.01"
                min="0"
                value={commissionAmount}
                onChange={(event) => setCommissionAmount(event.target.value)}
                placeholder="As agreed with the partner"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="conversionCurrency">Currency</label>
              <select
                id="conversionCurrency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="conversionStatus">Status</label>
              <select
                id="conversionStatus"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
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
              {saving
                ? "Saving..."
                : conversion
                ? "Save Changes"
                : "Record Conversion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
