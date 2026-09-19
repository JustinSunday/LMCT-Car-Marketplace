import React, { useState } from "react";
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

const COMPANY_TYPES = [
  "Dealership",
  "Marketplace",
  "Manufacturer",
  "Broker",
  "Automotive Service Provider",
  "Other",
];

const initialForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  website: "",
  companyType: "",
  category: "",
  listingsCount: "",
  partnershipType: "",
  affiliateProgramUrl: "",
  message: "",
};

export default function PartnerApplicationForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !form.companyName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.partnershipType
    ) {
      setError(
        "Company name, contact name, email and partnership type are required."
      );
      return;
    }

    setSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("partner_applications")
        .insert({
          company_name: form.companyName.trim(),
          contact_name: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          website: form.website.trim() || null,
          company_type: form.companyType || null,
          category: form.category.trim() || null,
          listings_count: form.listingsCount.trim() || null,
          partnership_type: form.partnershipType,
          affiliate_program_url: form.affiliateProgramUrl.trim() || null,
          message: form.message.trim() || null,
        });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch (submitError) {
      console.error("Partner application error:", submitError);
      setError(
        submitError.message ||
          "Unable to submit your application right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="partnerFormCard">
        <div className="partnerSuccess">
          <h3>Application received.</h3>
          <p>
            Thank you for your interest in partnering with LMCT. Our
            team will review your application and reach out to the
            contact details provided.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="partnerFormCard">
      <h3>Become an LMCT Partner</h3>
      <p>
        Tell us about your business and how you'd like to work with
        LMCT. Approved partners are contacted to finalize an
        affiliate, referral or advertising agreement.
      </p>

      {error && <div className="formError">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="formGrid">
          <div className="formGroup">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              value={form.companyName}
              onChange={updateField("companyName")}
              placeholder="Prestige Motors LLC"
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="contactName">Contact Person's Name</label>
            <input
              id="contactName"
              value={form.contactName}
              onChange={updateField("contactName")}
              placeholder="Jane Smith"
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="partnerships@example.com"
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={updateField("phone")}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              value={form.country}
              onChange={updateField("country")}
              placeholder="United States"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              value={form.website}
              onChange={updateField("website")}
              placeholder="https://example.com"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="companyType">Company Type</label>
            <select
              id="companyType"
              value={form.companyType}
              onChange={updateField("companyType")}
            >
              <option value="">Select company type</option>
              {COMPANY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="formGroup">
            <label htmlFor="category">Category / Niche</label>
            <input
              id="category"
              value={form.category}
              onChange={updateField("category")}
              placeholder="Luxury, Exotic, Performance..."
            />
          </div>

          <div className="formGroup">
            <label htmlFor="listingsCount">Number of Vehicles/Listings</label>
            <input
              id="listingsCount"
              value={form.listingsCount}
              onChange={updateField("listingsCount")}
              placeholder="e.g. 25"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="partnershipType">Partnership Type</label>
            <select
              id="partnershipType"
              value={form.partnershipType}
              onChange={updateField("partnershipType")}
              required
            >
              <option value="">Select partnership type</option>
              {PARTNERSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="formGroup">
          <label htmlFor="affiliateProgramUrl">
            Affiliate Program URL (if available)
          </label>
          <input
            id="affiliateProgramUrl"
            type="url"
            value={form.affiliateProgramUrl}
            onChange={updateField("affiliateProgramUrl")}
            placeholder="https://example.com/affiliates"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            rows="4"
            value={form.message}
            onChange={updateField("message")}
            placeholder="Tell us more about your business..."
          />
        </div>

        <div className="formActions">
          <button
            type="submit"
            className="adminPrimaryButton"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
