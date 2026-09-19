import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const PAYMENT_METHODS = [
  "Bank Transfer",
  "PayPal",
  "Stripe",
  "Check",
  "Other",
];

export default function PayoutForm({ commission, onSaved, onCancel }) {
  const [amount, setAmount] = useState(commission?.amount ?? "");
  const [currency, setCurrency] = useState(commission?.currency || "USD");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState("paid");
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payoutData = {
        commission_id: commission.id,
        amount: amount === "" ? 0 : Number(amount),
        currency,
        payment_method: paymentMethod,
        reference: reference.trim() || null,
        status,
        paid_at: status === "paid" ? paidAt : null,
      };

      const { error: payoutError } = await supabase
        .from("payouts")
        .insert(payoutData);

      if (payoutError) {
        throw payoutError;
      }

      // If this payout is recorded as paid, reflect that on the
      // commission itself so the ledger stays in sync.
      if (status === "paid") {
        const { error: commissionError } = await supabase
          .from("commissions")
          .update({ status: "paid", paid_at: paidAt })
          .eq("id", commission.id);

        if (commissionError) {
          throw commissionError;
        }
      }

      onSaved();
    } catch (submitError) {
      console.error("Payout save error:", submitError);
      setError(submitError.message || "Unable to record this payout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vehicleFormOverlay">
      <div className="vehicleFormCard">
        <div className="vehicleFormHeader">
          <div>
            <span className="adminEyebrow">PAYOUTS</span>
            <h2>Record Payout</h2>
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
              <label htmlFor="payoutAmount">Amount</label>
              <input
                id="payoutAmount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="payoutCurrency">Currency</label>
              <input
                id="payoutCurrency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="payoutMethod">Payment Method</label>
              <select
                id="payoutMethod"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="payoutReference">Reference</label>
              <input
                id="payoutReference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Transaction/reference ID"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="payoutStatus">Status</label>
              <select
                id="payoutStatus"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="formGroup">
              <label htmlFor="payoutDate">Payment Date</label>
              <input
                id="payoutDate"
                type="date"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
                disabled={status !== "paid"}
              />
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
              {saving ? "Saving..." : "Record Payout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
