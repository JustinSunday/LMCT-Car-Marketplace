import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function PartnerPortal() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const [partner, setPartner] = useState(null);
  const [offers, setOffers] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    loadPortalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPortalData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        window.location.href = "/partner-login";
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email);

      const { data: link, error: linkError } = await supabase
        .from("partner_users")
        .select("partner_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (linkError) {
        throw linkError;
      }

      if (!link) {
        // Signed in, but not linked to a partner profile yet.
        setPartner(null);
        setLoading(false);
        return;
      }

      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .eq("id", link.partner_id)
        .single();

      if (partnerError) {
        throw partnerError;
      }

      const { data: offerData, error: offerError } = await supabase
        .from("affiliate_offers")
        .select(`
          *,
          vehicles ( id, make, model, year, image_url )
        `)
        .eq("partner_id", link.partner_id)
        .order("created_at", { ascending: false });

      if (offerError) {
        throw offerError;
      }

      const offerIds = (offerData || []).map((offer) => offer.id);

      const { data: clickData, error: clickError } = offerIds.length
        ? await supabase
            .from("affiliate_clicks")
            .select("*")
            .in("offer_id", offerIds)
            .order("clicked_at", { ascending: false })
        : { data: [], error: null };

      if (clickError) {
        throw clickError;
      }

      const { data: conversionData, error: conversionError } = await supabase
        .from("conversions")
        .select(`
          *,
          vehicles ( id, make, model, year )
        `)
        .eq("partner_id", link.partner_id)
        .order("created_at", { ascending: false });

      if (conversionError) {
        throw conversionError;
      }

      const { data: commissionData, error: commissionError } = await supabase
        .from("commissions")
        .select("*")
        .eq("partner_id", link.partner_id)
        .order("created_at", { ascending: false });

      if (commissionError) {
        throw commissionError;
      }

      const commissionIds = (commissionData || []).map(
        (commission) => commission.id
      );

      const { data: payoutData, error: payoutError } = commissionIds.length
        ? await supabase
            .from("payouts")
            .select("*")
            .in("commission_id", commissionIds)
            .order("created_at", { ascending: false })
        : { data: [], error: null };

      if (payoutError) {
        throw payoutError;
      }

      setPartner(partnerData);
      setOffers(offerData || []);
      setClicks(clickData || []);
      setConversions(conversionData || []);
      setCommissions(commissionData || []);
      setPayouts(payoutData || []);
    } catch (error) {
      console.error("Failed to load partner portal:", error);
      setErrorMessage(
        error.message || "Unable to load your partner dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/partner-login";
  }

  if (loading) {
    return (
      <div className="adminPage">
        <div className="emptyState">
          <h2>Loading your dashboard...</h2>
          <p>Please wait.</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="adminPage">
        <header className="adminHeader">
          <a href="/" className="adminBack">
            ← LMCT
          </a>

          <div className="adminHeaderActions">
            <span className="adminUser">{userEmail}</span>
            <button className="adminLogout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        <div className="adminContent">
          <div className="emptyState">
            <h3>Your account isn't linked yet</h3>
            <p>
              Your login works, but LMCT hasn't connected it to a
              partner profile yet. Share this ID with your LMCT
              contact so they can link your account:
            </p>
            <p>
              <code>{userId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCommissionTotal = commissions
    .filter((commission) => commission.status === "pending")
    .reduce((total, commission) => total + Number(commission.amount || 0), 0);

  const approvedCommissionTotal = commissions
    .filter((commission) => commission.status === "approved")
    .reduce((total, commission) => total + Number(commission.amount || 0), 0);

  const paidCommissionTotal = commissions
    .filter((commission) => commission.status === "paid")
    .reduce((total, commission) => total + Number(commission.amount || 0), 0);

  return (
    <div className="adminPage">
      <header className="adminHeader">
        <a href="/" className="adminBack">
          ← LMCT
        </a>

        <div className="adminHeaderActions">
          <span className="adminUser">{partner.name}</span>
          <button className="adminLogout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="adminContent">

        {errorMessage && (
          <div className="formError" style={{ marginBottom: 30 }}>
            {errorMessage}
          </div>
        )}

        <section className="adminSection">

          <div className="adminSectionHeader">
            <div>
              <span className="adminEyebrow">PARTNER DASHBOARD</span>
              <h2>Welcome, {partner.name}</h2>
            </div>
          </div>

          <div className="adminStats">
            <div className="adminStat">
              <span>Active Listings</span>
              <strong>
                {offers.filter((o) => o.status === "active").length}
              </strong>
            </div>

            <div className="adminStat">
              <span>Total Clicks</span>
              <strong>{clicks.length}</strong>
            </div>

            <div className="adminStat">
              <span>Conversions</span>
              <strong>{conversions.length}</strong>
            </div>

            <div className="adminStat">
              <span>Pending Commission</span>
              <strong>${pendingCommissionTotal.toFixed(2)}</strong>
            </div>

            <div className="adminStat">
              <span>Approved Commission</span>
              <strong>${approvedCommissionTotal.toFixed(2)}</strong>
            </div>

            <div className="adminStat">
              <span>Paid Commission</span>
              <strong>${paidCommissionTotal.toFixed(2)}</strong>
            </div>
          </div>

        </section>


        {/* MY LISTINGS */}

        <section className="adminSection">

          <div className="adminSectionHeader">
            <div>
              <span className="adminEyebrow">LISTINGS</span>
              <h2>My Vehicles</h2>
            </div>
          </div>

          {offers.length === 0 ? (
            <div className="emptyState">
              <h3>No listings yet</h3>
              <p>Once LMCT adds an offer for your vehicles, it'll show up here.</p>
            </div>
          ) : (
            <div className="adminTableWrapper">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td>
                        {offer.vehicles
                          ? `${offer.vehicles.make} ${offer.vehicles.model} (${offer.vehicles.year})`
                          : "—"}
                      </td>
                      <td>
                        <span className={`status ${offer.status}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td>
                        {clicks.filter((c) => c.offer_id === offer.id).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>


        {/* MY CONVERSIONS */}

        <section className="adminSection">

          <div className="adminSectionHeader">
            <div>
              <span className="adminEyebrow">PERFORMANCE</span>
              <h2>My Conversions</h2>
            </div>
          </div>

          {conversions.length === 0 ? (
            <div className="emptyState">
              <h3>No conversions yet</h3>
              <p>Reported leads and sales for your listings will appear here.</p>
            </div>
          ) : (
            <div className="adminTableWrapper">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((conversion) => (
                    <tr key={conversion.id}>
                      <td>
                        {conversion.vehicles
                          ? `${conversion.vehicles.make} ${conversion.vehicles.model}`
                          : "—"}
                      </td>
                      <td>{conversion.conversion_type}</td>
                      <td>
                        {conversion.commission_amount != null
                          ? `${conversion.currency} ${conversion.commission_amount}`
                          : "—"}
                      </td>
                      <td>
                        <span className={`status ${conversion.status}`}>
                          {conversion.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>


        {/* MY COMMISSIONS & PAYOUTS */}

        <section className="adminSection">

          <div className="adminSectionHeader">
            <div>
              <span className="adminEyebrow">EARNINGS</span>
              <h2>Commissions &amp; Payouts</h2>
            </div>
          </div>

          {commissions.length === 0 ? (
            <div className="emptyState">
              <h3>No commissions yet</h3>
              <p>Approved conversions create commission entries here.</p>
            </div>
          ) : (
            <div className="adminTableWrapper">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => {
                    const payout = payouts.find(
                      (p) => p.commission_id === commission.id
                    );

                    return (
                      <tr key={commission.id}>
                        <td>
                          {commission.currency} {commission.amount}
                        </td>
                        <td>
                          <span className={`status ${commission.status}`}>
                            {commission.status}
                          </span>
                        </td>
                        <td>
                          {payout
                            ? `${payout.payment_method || "—"} · ${payout.status}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
