import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const PARTNERSHIP_TYPES = [
  "Affiliate Partnership",
  "Vehicle Advertising",
  "Referral Partnership",
  "Lead Generation",
  "Sponsored Listing",
  "Automotive Service Partnership",
  "API/Inventory Feed Partnership",
];

export default function PartnerForm({ partner, onSaved, onCancel }) {
  const [name, setName] = useState(partner?.name || "");
  const [website, setWebsite] = useState(partner?.website || "");
  const [contactName, setContactName] = useState(
    partner?.contact_name || ""
  );
  const [contactEmail, setContactEmail] = useState(
    partner?.contact_email || ""
  );
  const [phone, setPhone] = useState(partner?.phone || "");
  const [country, setCountry] = useState(partner?.country || "");
  const [partnershipType, setPartnershipType] = useState(
    partner?.partnership_type || ""
  );
  const [status, setStatus] = useState(partner?.status || "approved");

  const [portalUserId, setPortalUserId] = useState("");
  const [existingLinkId, setExistingLinkId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!partner?.id) return;

    supabase
      .from("partner_users")
      .select("id, user_id")
      .eq("partner_id", partner.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPortalUserId(data.user_id);
          setExistingLinkId(data.id);
        }
      });
  }, [partner?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const partnerData = {
        name: name.trim(),
        website: website.trim() || null,
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        phone: phone.trim() || null,
        country: country.trim() || null,
        partnership_type: partnershipType || null,
        status,
      };

      if (!partnerData.name) {
        throw new Error("Company name is required.");
      }

      let result;

      if (partner?.id) {
        result = await supabase
          .from("partners")
          .update(partnerData)
          .eq("id", partner.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("partners")
          .insert(partnerData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Link (or update the link) to a Partner Portal login, if a
      // user ID was provided. The partner shares this ID with LMCT
      // after they sign up at /partner-login.
      const trimmedPortalUserId = portalUserId.trim();

      if (trimmedPortalUserId) {
        const { error: linkError } = await supabase
          .from("partner_users")
          .upsert(
            {
              user_id: trimmedPortalUserId,
              partner_id: result.data.id,
            },
            { onConflict: "user_id" }
          );

        if (linkError) {
          throw linkError;
        }
      } else if (existingLinkId) {
        // Field was cleared — remove the existing link.
        const { error: unlinkError } = await supabase
          .from("partner_users")
          .delete()
          .eq("id", existingLinkId);

        if (unlinkError) {
          throw unlinkError;
        }
      }

      onSaved(result.data);
    } catch (submitError) {
      console.error("Partner save error:", submitError);
      setError(submitError.message || "Unable to save partner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vehicleFormOverlay">
      <div className="vehicleFormCard">
        <div className="vehicleFormHeader">
          <div>
            <span className="adminEyebrow">LMCT PARTNERS</span>
            <h2>{partner ? "Edit Partner" : "Add Partner"}</h2>
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
              <label htmlFor="partnerName">Company Name</label>
              <input
                id="partnerName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Prestige Motors LLC"
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="partnerWebsite">Website</label>
              <input
                id="partnerWebsite"
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="partnerContactName">Contact Name</label>
              <input
                id="partnerContactName"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Jane Smith"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="partnerContactEmail">Contact Email</label>
              <input
                id="partnerContactEmail"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="partnerships@example.com"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="partnerPhone">Phone</label>
              <input
                id="partnerPhone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 000 0000"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="partnerCountry">Country</label>
              <input
                id="partnerCountry"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="United States"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="partnerType">Partnership Type</label>
              <select
                id="partnerType"
                value={partnershipType}
                onChange={(event) => setPartnershipType(event.target.value)}
              >
                <option value="">Select partnership type</option>
                {PARTNERSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="partnerStatus">Status</label>
              <select
                id="partnerStatus"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="partnerPortalUserId">
              Partner Portal User ID (optional)
            </label>
            <input
              id="partnerPortalUserId"
              value={portalUserId}
              onChange={(event) => setPortalUserId(event.target.value)}
              placeholder="Paste the ID the partner shares after signing up at /partner-login"
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
              {saving ? "Saving..." : partner ? "Save Changes" : "Add Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
