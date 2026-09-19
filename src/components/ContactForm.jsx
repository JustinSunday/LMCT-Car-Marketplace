import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const initialForm = { name: "", email: "", subject: "", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email and message are required.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from("contact_messages")
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch (submitError) {
      console.error("Contact form error:", submitError);
      setError(
        submitError.message ||
          "Unable to send your message right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="contactFormCard">
        <div className="partnerSuccess">
          <h3>Message sent.</h3>
          <p>Thanks for reaching out — we'll get back to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contactFormCard">
      {error && <div className="formError">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="formGrid">
          <div className="formGroup">
            <label htmlFor="contactName">Name</label>
            <input
              id="contactName"
              value={form.name}
              onChange={updateField("name")}
              placeholder="Your name"
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="contactEmail">Email</label>
            <input
              id="contactEmail"
              type="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="formGroup">
          <label htmlFor="contactSubject">Subject</label>
          <input
            id="contactSubject"
            value={form.subject}
            onChange={updateField("subject")}
            placeholder="What's this about?"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="contactMessage">Message</label>
          <textarea
            id="contactMessage"
            rows="5"
            value={form.message}
            onChange={updateField("message")}
            placeholder="How can we help?"
            required
          />
        </div>

        <div className="formActions">
          <button
            type="submit"
            className="adminPrimaryButton"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}
