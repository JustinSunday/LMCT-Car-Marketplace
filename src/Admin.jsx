import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import VehicleForm from "./components/VehicleForm";
import PartnerForm from "./components/PartnerForm";
import OfferForm from "./components/OfferForm";
import ConversionForm from "./components/ConversionForm";
import PayoutForm from "./components/PayoutForm";
import BarChart from "./components/BarChart";
import VehicleCsvImport from "./components/VehicleCsvImport";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [partners, setPartners] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [applicationActionId, setApplicationActionId] = useState(null);

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const [conversions, setConversions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const [showConversionForm, setShowConversionForm] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [conversionActionId, setConversionActionId] = useState(null);

  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [commissionActionId, setCommissionActionId] = useState(null);

  const [dateRangeOption, setDateRangeOption] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [showCsvImport, setShowCsvImport] = useState(false);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      // Get currently logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      // Check admin_users table
      const { data: adminRecord, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        throw adminError;
      }

      if (!adminRecord) {
        setIsAdmin(false);
        setErrorMessage(
          "Access denied. Your account is not registered as an LMCT administrator."
        );
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load vehicles
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select(`
          id,
          make,
          model,
          year,
          category,
          status,
          affiliate_offers (
            id,
            status,
            affiliate_url,
            cta,
            tracking_id,
            commission_type,
            commission_rate,
            cookie_duration_days,
            start_date,
            end_date,
            partners (
              id,
              name,
              website
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (vehicleError) {
        throw vehicleError;
      }

      // Load affiliate clicks
      const { data: clickData, error: clickError } = await supabase
        .from("affiliate_clicks")
        .select(`
          id,
          offer_id,
          clicked_at,
          affiliate_offers (
            id,
            affiliate_url,
            partners (
              name
            )
          )
        `)
        .order("clicked_at", { ascending: false });

      if (clickError) {
        throw clickError;
      }

      // Load partner applications
      const { data: applicationData, error: applicationError } =
        await supabase
          .from("partner_applications")
          .select("*")
          .order("created_at", { ascending: false });

      if (applicationError) {
        throw applicationError;
      }

      // Load partners
      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });

      if (partnerError) {
        throw partnerError;
      }

      setVehicles(vehicleData || []);
      setClicks(clickData || []);
      setApplications(applicationData || []);
      setPartners(partnerData || []);

      // Load conversions (Method C: manual partner reporting)
      const { data: conversionData, error: conversionError } =
        await supabase
          .from("conversions")
          .select(`
            *,
            partners ( id, name ),
            vehicles ( id, make, model, year )
          `)
          .order("created_at", { ascending: false });

      if (conversionError) {
        throw conversionError;
      }

      // Load commissions
      const { data: commissionData, error: commissionError } =
        await supabase
          .from("commissions")
          .select(`
            *,
            partners ( id, name ),
            conversions ( id, conversion_type, external_reference )
          `)
          .order("created_at", { ascending: false });

      if (commissionError) {
        throw commissionError;
      }

      // Load payouts
      const { data: payoutData, error: payoutError } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (payoutError) {
        throw payoutError;
      }

      setConversions(conversionData || []);
      setCommissions(commissionData || []);
      setPayouts(payoutData || []);

      // Load contact messages
      const { data: messageData, error: messageError } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (messageError) {
        throw messageError;
      }

      setMessages(messageData || []);
    } catch (error) {
      console.error("Admin dashboard error:", error);

      setErrorMessage(
        error.message ||
          "Unable to load the admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function openAddVehicleForm() {
    setSelectedVehicle(null);
    setShowVehicleForm(true);
  }

  function openEditVehicleForm(vehicle) {
    setSelectedVehicle(vehicle);
    setShowVehicleForm(true);
  }

  function handleVehicleSaved() {
    setShowVehicleForm(false);
    setSelectedVehicle(null);
    checkAdminAndLoadData();
  }

  function openAddOfferForm() {
    setSelectedOffer(null);
    setShowOfferForm(true);
  }

  function openEditOfferForm(offer, vehicle) {
    setSelectedOffer({
      ...offer,
      vehicle_id: vehicle.id,
      partner_id: offer.partners?.id || "",
    });
    setShowOfferForm(true);
  }

  function handleOfferSaved() {
    setShowOfferForm(false);
    setSelectedOffer(null);
    checkAdminAndLoadData();
  }

  function openAddPartnerForm() {
    setSelectedPartner(null);
    setShowPartnerForm(true);
  }

  function openEditPartnerForm(partner) {
    setSelectedPartner(partner);
    setShowPartnerForm(true);
  }

  function handlePartnerSaved() {
    setShowPartnerForm(false);
    setSelectedPartner(null);
    checkAdminAndLoadData();
  }

  async function updatePartnerStatus(partner, status) {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status })
        .eq("id", partner.id);

      if (error) {
        throw error;
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to update partner status:", error);
      setErrorMessage(
        error.message || "Unable to update partner status."
      );
    }
  }

  async function approveApplication(application) {
    setApplicationActionId(application.id);

    try {
      const { error: partnerError } = await supabase
        .from("partners")
        .insert({
          name: application.company_name,
          website: application.website,
          contact_name: application.contact_name,
          contact_email: application.email,
          phone: application.phone,
          country: application.country,
          partnership_type: application.partnership_type,
          status: "approved",
          application_id: application.id,
        });

      if (partnerError) {
        throw partnerError;
      }

      const { error: applicationError } = await supabase
        .from("partner_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (applicationError) {
        throw applicationError;
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to approve application:", error);
      setErrorMessage(
        error.message || "Unable to approve this application."
      );
    } finally {
      setApplicationActionId(null);
    }
  }

  async function rejectApplication(application) {
    setApplicationActionId(application.id);

    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) {
        throw error;
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to reject application:", error);
      setErrorMessage(
        error.message || "Unable to reject this application."
      );
    } finally {
      setApplicationActionId(null);
    }
  }

  function openAddConversionForm() {
    setSelectedConversion(null);
    setShowConversionForm(true);
  }

  function openEditConversionForm(conversion) {
    setSelectedConversion(conversion);
    setShowConversionForm(true);
  }

  function handleConversionSaved() {
    setShowConversionForm(false);
    setSelectedConversion(null);
    checkAdminAndLoadData();
  }

  async function approveConversion(conversion) {
    setConversionActionId(conversion.id);

    try {
      const { error: conversionError } = await supabase
        .from("conversions")
        .update({ status: "approved" })
        .eq("id", conversion.id);

      if (conversionError) {
        throw conversionError;
      }

      // Create the linked commission ledger entry if one doesn't
      // already exist for this conversion.
      const alreadyHasCommission = commissions.some(
        (commission) => commission.conversion_id === conversion.id
      );

      if (!alreadyHasCommission) {
        const { error: commissionError } = await supabase
          .from("commissions")
          .insert({
            conversion_id: conversion.id,
            partner_id: conversion.partner_id,
            amount: conversion.commission_amount || 0,
            currency: conversion.currency || "USD",
            status: "pending",
          });

        if (commissionError) {
          throw commissionError;
        }
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to approve conversion:", error);
      setErrorMessage(error.message || "Unable to approve this conversion.");
    } finally {
      setConversionActionId(null);
    }
  }

  async function rejectConversion(conversion) {
    setConversionActionId(conversion.id);

    try {
      const { error } = await supabase
        .from("conversions")
        .update({ status: "rejected" })
        .eq("id", conversion.id);

      if (error) {
        throw error;
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to reject conversion:", error);
      setErrorMessage(error.message || "Unable to reject this conversion.");
    } finally {
      setConversionActionId(null);
    }
  }

  async function updateCommissionStatus(commission, status) {
    setCommissionActionId(commission.id);

    try {
      const updates = { status };

      if (status === "approved") {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("commissions")
        .update(updates)
        .eq("id", commission.id);

      if (error) {
        throw error;
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to update commission:", error);
      setErrorMessage(error.message || "Unable to update this commission.");
    } finally {
      setCommissionActionId(null);
    }
  }

  function openRecordPayout(commission) {
    setSelectedCommission(commission);
    setShowPayoutForm(true);
  }

  function handlePayoutSaved() {
    setShowPayoutForm(false);
    setSelectedCommission(null);
    checkAdminAndLoadData();
  }

  async function markMessageRead(message) {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ status: "read" })
        .eq("id", message.id);

      if (error) {
        throw error;
      }

      checkAdminAndLoadData();
    } catch (error) {
      console.error("Failed to update message:", error);
      setErrorMessage(error.message || "Unable to update this message.");
    }
  }

  function getOfferClicks(offerId) {
    return clicks.filter(
      (click) => click.offer_id === offerId
    ).length;
  }

  const totalOffers = vehicles.reduce(
    (total, vehicle) =>
      total + (vehicle.affiliate_offers?.length || 0),
    0
  );

  const activeVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "active"
  ).length;

  const activeOffers = vehicles.reduce(
    (total, vehicle) =>
      total +
      (vehicle.affiliate_offers || []).filter(
        (offer) =>
          offer.status === "active" ||
          offer.status === "test"
      ).length,
    0
  );

  const pendingApplications = applications.filter(
    (application) => application.status === "pending"
  ).length;

  const approvedPartners = partners.filter(
    (partner) => partner.status === "approved"
  ).length;

  const allOffers = vehicles.flatMap((vehicle) =>
    (vehicle.affiliate_offers || []).map((offer) => ({
      ...offer,
      vehicle,
    }))
  );

  const pendingConversions = conversions.filter(
    (conversion) => conversion.status === "pending"
  ).length;

  const pendingCommissionTotal = commissions
    .filter((commission) => commission.status === "pending")
    .reduce((total, commission) => total + Number(commission.amount || 0), 0);

  const approvedCommissionTotal = commissions
    .filter((commission) => commission.status === "approved")
    .reduce((total, commission) => total + Number(commission.amount || 0), 0);

  const paidCommissionTotal = commissions
    .filter((commission) => commission.status === "paid")
    .reduce((total, commission) => total + Number(commission.amount || 0), 0);

  // ---- Analytics date range helpers ----

  function getDateRange() {
    const now = new Date();
    let start;
    let end = now;

    if (dateRangeOption === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRangeOption === "7d") {
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (dateRangeOption === "30d") {
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else if (dateRangeOption === "90d") {
      start = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);
    } else if (dateRangeOption === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (dateRangeOption === "custom") {
      start = customStart ? new Date(customStart) : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      end = customEnd ? new Date(customEnd + "T23:59:59") : now;
    } else {
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  function withinRange(dateValue) {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    return date >= rangeStart && date <= rangeEnd;
  }

  const rangeClicks = clicks.filter((click) => withinRange(click.clicked_at));
  const rangeConversions = conversions.filter((conversion) =>
    withinRange(conversion.created_at)
  );
  const rangeLeads = rangeConversions.filter(
    (conversion) => conversion.conversion_type === "lead"
  );
  const rangePaidCommissions = commissions.filter(
    (commission) => commission.status === "paid" && withinRange(commission.paid_at)
  );
  const rangeEarnings = rangePaidCommissions.reduce(
    (total, commission) => total + Number(commission.amount || 0),
    0
  );

  // Bucket by day if the range is a month or less, otherwise by month.
  const rangeDays = Math.max(
    1,
    Math.round((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000)) + 1
  );
  const useMonthlyBuckets = rangeDays > 31;

  function bucketLabel(date) {
    if (useMonthlyBuckets) {
      return date.toLocaleDateString(undefined, { month: "short" });
    }
    return date.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  }

  function bucketKey(date) {
    return useMonthlyBuckets
      ? `${date.getFullYear()}-${date.getMonth()}`
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  function buildBuckets(items, dateField, valueFn) {
    const buckets = [];
    const cursor = new Date(rangeStart);

    while (cursor <= rangeEnd) {
      buckets.push({
        key: bucketKey(cursor),
        label: bucketLabel(cursor),
        value: 0,
      });

      if (useMonthlyBuckets) {
        cursor.setMonth(cursor.getMonth() + 1);
      } else {
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    items.forEach((item) => {
      const raw = item[dateField];
      if (!raw) return;

      const date = new Date(raw);
      const key = bucketKey(date);
      const bucket = buckets.find((entry) => entry.key === key);

      if (bucket) {
        bucket.value += valueFn ? valueFn(item) : 1;
      }
    });

    return buckets;
  }

  const clicksChartData = buildBuckets(rangeClicks, "clicked_at");
  const leadsChartData = buildBuckets(rangeLeads, "created_at");
  const conversionsChartData = buildBuckets(rangeConversions, "created_at");
  const earningsChartData = buildBuckets(
    rangePaidCommissions,
    "paid_at",
    (commission) => Number(commission.amount || 0)
  );

  function formatCommission(offer) {
    if (!offer.commission_type || offer.commission_rate == null) {
      return "Not yet agreed";
    }

    if (offer.commission_type === "percentage") {
      return `${offer.commission_rate}% of sale`;
    }

    if (offer.commission_type === "fixed_lead") {
      return `$${offer.commission_rate} / lead`;
    }

    if (offer.commission_type === "fixed_sale") {
      return `$${offer.commission_rate} / sale`;
    }

    return `Custom — $${offer.commission_rate}`;
  }

  if (loading) {
    return (
      <div className="adminPage">
        <div className="emptyState">
          <h2>Loading LMCT Admin...</h2>
          <p>Please wait.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="adminPage">
        <div className="emptyState">
          <span className="adminEyebrow">
            LMCT ADMIN
          </span>

          <h2>Access Denied</h2>

          <p>{errorMessage}</p>

          <div style={{ marginTop: "24px" }}>
            <a href="/login" className="dealButton">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminPage">

      {/* HEADER */}

      <header className="adminHeader">

        <div>
          <span className="adminEyebrow">
            LMCT ADMIN
          </span>

          <h1>Dashboard</h1>

          <p>
            Manage vehicles, affiliate offers and
            performance.
          </p>
        </div>

        <div className="adminHeaderActions">

          <span className="adminUser">
            {user?.email}
          </span>

          <a href="/" className="adminBack">
            View Website
          </a>

          <button
            onClick={handleLogout}
            className="adminLogout"
          >
            Sign Out
          </button>

        </div>

      </header>


      {/* MAIN CONTENT */}

      <main className="adminContent">

        {errorMessage && (
          <div className="emptyState">
            <h3>Something went wrong</h3>
            <p>{errorMessage}</p>
          </div>
        )}


        {/* DASHBOARD STATS */}

        <section className="adminStats">

          <div className="adminStat">
            <span>Total Vehicles</span>
            <strong>{vehicles.length}</strong>
          </div>

          <div className="adminStat">
            <span>Active Vehicles</span>
            <strong>{activeVehicles}</strong>
          </div>

          <div className="adminStat">
            <span>Affiliate Offers</span>
            <strong>{totalOffers}</strong>
          </div>

          <div className="adminStat">
            <span>Active Offers</span>
            <strong>{activeOffers}</strong>
          </div>

          <div className="adminStat">
            <span>Total Clicks</span>
            <strong>{clicks.length}</strong>
          </div>

          <div className="adminStat">
            <span>Partners</span>
            <strong>{approvedPartners}</strong>
          </div>

          <div className="adminStat">
            <span>Pending Applications</span>
            <strong>{pendingApplications}</strong>
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

        </section>


        {/* ANALYTICS / EARNINGS DASHBOARD */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                ANALYTICS
              </span>

              <h2>Earnings Dashboard</h2>
            </div>

          </div>

          <div className="dateFilterRow">

            {[
              { value: "today", label: "Today" },
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
              { value: "90d", label: "90 Days" },
              { value: "year", label: "This Year" },
              { value: "custom", label: "Custom" },
            ].map((option) => (
              <button
                key={option.value}
                className={`dateFilterButton ${
                  dateRangeOption === option.value ? "activeFilter" : ""
                }`}
                onClick={() => setDateRangeOption(option.value)}
              >
                {option.label}
              </button>
            ))}

          </div>

          {dateRangeOption === "custom" && (
            <div className="dateFilterCustom" style={{ marginBottom: 30 }}>
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </div>
          )}

          <div className="adminStats">

            <div className="adminStat">
              <span>Clicks</span>
              <strong>{rangeClicks.length}</strong>
            </div>

            <div className="adminStat">
              <span>Leads</span>
              <strong>{rangeLeads.length}</strong>
            </div>

            <div className="adminStat">
              <span>Conversions</span>
              <strong>{rangeConversions.length}</strong>
            </div>

            <div className="adminStat">
              <span>Earnings (Paid)</span>
              <strong>${rangeEarnings.toFixed(2)}</strong>
            </div>

          </div>

          <div className="chartsGrid">

            <div className="chartPanel">
              <h3>Affiliate Clicks</h3>
              <BarChart data={clicksChartData} color="#c9a66b" />
            </div>

            <div className="chartPanel">
              <h3>Leads</h3>
              <BarChart data={leadsChartData} color="#8d8d8d" />
            </div>

            <div className="chartPanel">
              <h3>Conversions</h3>
              <BarChart data={conversionsChartData} color="#171717" />
            </div>

            <div className="chartPanel">
              <h3>Earnings ($)</h3>
              <BarChart data={earningsChartData} color="#416449" />
            </div>

          </div>

        </section>


        {/* VEHICLES */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                INVENTORY
              </span>

              <h2>Vehicle Offers</h2>
            </div>

            <div className="adminHeaderActions">
              <button
                className="adminSecondaryButton"
                onClick={() => setShowCsvImport(true)}
              >
                Import CSV
              </button>

              <button
                className="adminPrimaryButton"
                onClick={openAddVehicleForm}
              >
                + Add Vehicle
              </button>
            </div>

          </div>


          {vehicles.length === 0 ? (

            <div className="emptyState">

              <h3>No vehicles found</h3>

              <p>
                Add your first vehicle to begin
                building the LMCT inventory.
              </p>

            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>

                  <tr>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Partner</th>
                    <th>Offer Status</th>
                    <th>Clicks</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {vehicles.map((vehicle) => {

                    const offers =
                      vehicle.affiliate_offers || [];

                    const offer = offers[0];

                    const vehicleClicks =
                      offers.reduce(
                        (total, currentOffer) =>
                          total +
                          getOfferClicks(
                            currentOffer.id
                          ),
                        0
                      );

                    return (

                      <tr key={vehicle.id}>

                        <td>

                          <strong>
                            {vehicle.make}{" "}
                            {vehicle.model}
                          </strong>

                          <small>
                            {vehicle.year}
                          </small>

                        </td>

                        <td>
                          {vehicle.category || "—"}
                        </td>

                        <td>
                          {offer?.partners?.name ||
                            "No partner"}
                        </td>

                        <td>

                          <span
                            className={`status ${
                              offer?.status ||
                              vehicle.status ||
                              "inactive"
                            }`}
                          >
                            {offer?.status ||
                              vehicle.status ||
                              "inactive"}
                          </span>

                        </td>

                        <td>
                          {vehicleClicks}
                        </td>

                        <td>

                          <button
                          className="adminActionButton"
                          onClick={() => openEditVehicleForm(vehicle)}
                          >
                          Manage
                          </button>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* AFFILIATE OFFERS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                AFFILIATE OFFERS
              </span>

              <h2>Affiliate Offers</h2>
            </div>

            <button
              className="adminPrimaryButton"
              onClick={openAddOfferForm}
            >
              + Add Offer
            </button>

          </div>

          {allOffers.length === 0 ? (

            <div className="emptyState">
              <h3>No affiliate offers yet</h3>
              <p>
                Add an offer to link a vehicle to a partner's
                affiliate URL and commission terms.
              </p>
            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Partner</th>
                    <th>Commission</th>
                    <th>Cookie</th>
                    <th>Status</th>
                    <th>Clicks</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {allOffers.map((offer) => (
                    <tr key={offer.id}>
                      <td>
                        <strong>
                          {offer.vehicle.make} {offer.vehicle.model}
                        </strong>
                        <small>{offer.vehicle.year}</small>
                      </td>

                      <td>{offer.partners?.name || "No partner"}</td>

                      <td>{formatCommission(offer)}</td>

                      <td>
                        {offer.cookie_duration_days
                          ? `${offer.cookie_duration_days}d`
                          : "—"}
                      </td>

                      <td>
                        <span className={`status ${offer.status}`}>
                          {offer.status}
                        </span>
                      </td>

                      <td>{getOfferClicks(offer.id)}</td>

                      <td>
                        <button
                          className="adminActionButton"
                          onClick={() =>
                            openEditOfferForm(offer, offer.vehicle)
                          }
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* PARTNER APPLICATIONS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                PARTNER PROGRAM
              </span>

              <h2>Partner Applications</h2>
            </div>

          </div>

          {applications.length === 0 ? (

            <div className="emptyState">
              <h3>No applications yet</h3>
              <p>
                Submissions from the "Partner With Us" page
                will appear here for review.
              </p>
            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Partnership Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <strong>{application.company_name}</strong>
                        <small>{application.website}</small>
                      </td>

                      <td>
                        <strong>{application.contact_name}</strong>
                        <small>{application.email}</small>
                      </td>

                      <td>{application.partnership_type}</td>

                      <td>
                        <span className={`status ${application.status}`}>
                          {application.status}
                        </span>
                      </td>

                      <td>
                        {application.status === "pending" ? (
                          <>
                            <button
                              className="adminActionButton"
                              disabled={
                                applicationActionId === application.id
                              }
                              onClick={() => approveApplication(application)}
                            >
                              Approve
                            </button>

                            <button
                              className="adminActionButton reject"
                              disabled={
                                applicationActionId === application.id
                              }
                              onClick={() => rejectApplication(application)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* PARTNERS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                PARTNER PROGRAM
              </span>

              <h2>Partners</h2>
            </div>

            <button
              className="adminPrimaryButton"
              onClick={openAddPartnerForm}
            >
              + Add Partner
            </button>

          </div>

          {partners.length === 0 ? (

            <div className="emptyState">
              <h3>No partners yet</h3>
              <p>
                Approve a partner application above, or add a
                partner manually.
              </p>
            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Partnership Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id}>
                      <td>
                        <strong>{partner.name}</strong>
                        <small>{partner.website}</small>
                      </td>

                      <td>
                        <strong>{partner.contact_name || "—"}</strong>
                        <small>{partner.contact_email}</small>
                      </td>

                      <td>{partner.partnership_type || "—"}</td>

                      <td>
                        <span className={`status ${partner.status}`}>
                          {partner.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="adminActionButton"
                          onClick={() => openEditPartnerForm(partner)}
                        >
                          Manage
                        </button>

                        {partner.status === "approved" ? (
                          <button
                            className="adminActionButton reject"
                            onClick={() =>
                              updatePartnerStatus(partner, "suspended")
                            }
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            className="adminActionButton"
                            onClick={() =>
                              updatePartnerStatus(partner, "approved")
                            }
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* AFFILIATE CLICKS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>

              <span className="adminEyebrow">
                TRACKING
              </span>

              <h2>Recent Affiliate Clicks</h2>

            </div>

          </div>


          {clicks.length === 0 ? (

            <div className="emptyState">

              <h3>No clicks recorded yet.</h3>

              <p>
                Affiliate clicks will appear here
                when visitors click "View Deal".
              </p>

            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>

                  <tr>
                    <th>Offer ID</th>
                    <th>Partner</th>
                    <th>Date</th>
                  </tr>

                </thead>

                <tbody>

                  {clicks.map((click) => (

                    <tr key={click.id}>

                      <td>
                        {click.offer_id}
                      </td>

                      <td>
                        {click
                          .affiliate_offers
                          ?.partners
                          ?.name ||
                          "Unknown partner"}
                      </td>

                      <td>
                        {click.clicked_at
                          ? new Date(
                              click.clicked_at
                            ).toLocaleString()
                          : "Unknown"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* CONVERSIONS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                COMMISSION TRACKING
              </span>

              <h2>Conversions</h2>
            </div>

            <button
              className="adminPrimaryButton"
              onClick={openAddConversionForm}
            >
              + Record Conversion
            </button>

          </div>

          {conversions.length === 0 ? (

            <div className="emptyState">
              <h3>No conversions recorded yet</h3>
              <p>
                Record a qualifying lead or sale reported by a
                partner to start tracking commissions.
              </p>
            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {conversions.map((conversion) => (
                    <tr key={conversion.id}>
                      <td>{conversion.partners?.name || "—"}</td>

                      <td>
                        {conversion.vehicles
                          ? `${conversion.vehicles.make} ${conversion.vehicles.model}`
                          : "—"}
                      </td>

                      <td>{conversion.conversion_type}</td>

                      <td>
                        {conversion.conversion_value != null
                          ? `${conversion.currency} ${conversion.conversion_value}`
                          : "—"}
                      </td>

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

                      <td>
                        {conversion.status === "pending" ? (
                          <>
                            <button
                              className="adminActionButton"
                              disabled={
                                conversionActionId === conversion.id
                              }
                              onClick={() => approveConversion(conversion)}
                            >
                              Approve
                            </button>

                            <button
                              className="adminActionButton reject"
                              disabled={
                                conversionActionId === conversion.id
                              }
                              onClick={() => rejectConversion(conversion)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="adminActionButton"
                            onClick={() =>
                              openEditConversionForm(conversion)
                            }
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* COMMISSIONS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                COMMISSION TRACKING
              </span>

              <h2>Commission Ledger</h2>
            </div>

          </div>

          {commissions.length === 0 ? (

            <div className="emptyState">
              <h3>No commissions yet</h3>
              <p>
                Approving a conversion above creates a commission
                entry here automatically.
              </p>
            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Conversion</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id}>
                      <td>{commission.partners?.name || "—"}</td>

                      <td>
                        {commission.conversions?.conversion_type || "—"}
                        {commission.conversions?.external_reference
                          ? ` (${commission.conversions.external_reference})`
                          : ""}
                      </td>

                      <td>
                        {commission.currency} {commission.amount}
                      </td>

                      <td>
                        <span className={`status ${commission.status}`}>
                          {commission.status}
                        </span>
                      </td>

                      <td>
                        {commission.status === "pending" && (
                          <>
                            <button
                              className="adminActionButton"
                              disabled={
                                commissionActionId === commission.id
                              }
                              onClick={() =>
                                updateCommissionStatus(
                                  commission,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>

                            <button
                              className="adminActionButton reject"
                              disabled={
                                commissionActionId === commission.id
                              }
                              onClick={() =>
                                updateCommissionStatus(
                                  commission,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {commission.status === "approved" && (
                          <button
                            className="adminActionButton"
                            onClick={() => openRecordPayout(commission)}
                          >
                            Record Payout
                          </button>
                        )}

                        {commission.status === "paid" && "—"}
                        {commission.status === "rejected" && "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* PAYOUTS */}

        <section className="adminSection">

          <div className="adminSectionHeader">

            <div>
              <span className="adminEyebrow">
                COMMISSION TRACKING
              </span>

              <h2>Payouts</h2>
            </div>

          </div>

          {payouts.length === 0 ? (

            <div className="emptyState">
              <h3>No payouts recorded yet</h3>
              <p>
                Recording a payout against an approved commission
                will list it here.
              </p>
            </div>

          ) : (

            <div className="adminTableWrapper">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Paid</th>
                  </tr>
                </thead>

                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td>
                        {payout.currency} {payout.amount}
                      </td>

                      <td>{payout.payment_method || "—"}</td>

                      <td>{payout.reference || "—"}</td>

                      <td>
                        <span className={`status ${payout.status}`}>
                          {payout.status}
                        </span>
                      </td>

                      <td>
                        {payout.paid_at
                          ? new Date(payout.paid_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* CONTACT MESSAGES */}

        <section className="adminSection">

          <div className="adminSectionHeader">
            <div>
              <span className="adminEyebrow">SUPPORT</span>
              <h2>Contact Messages</h2>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="emptyState">
              <h3>No messages yet</h3>
              <p>Submissions from the Contact page will appear here.</p>
            </div>
          ) : (
            <div className="adminTableWrapper">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message.id}>
                      <td>
                        <strong>{message.name}</strong>
                        <small>{message.email}</small>
                      </td>
                      <td>{message.subject || "—"}</td>
                      <td>{message.message}</td>
                      <td>
                        <span className={`status ${message.status}`}>
                          {message.status}
                        </span>
                      </td>
                      <td>
                        {message.status === "new" && (
                          <button
                            className="adminActionButton"
                            onClick={() => markMessageRead(message)}
                          >
                            Mark Read
                          </button>
                        )}
                        {message.status === "read" && "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>

            </main>

      {showVehicleForm && (
        <VehicleForm
          vehicle={selectedVehicle}
          onSaved={handleVehicleSaved}
          onCancel={() => {
            setShowVehicleForm(false);
            setSelectedVehicle(null);
          }}
        />
      )}

      {showPartnerForm && (
        <PartnerForm
          partner={selectedPartner}
          onSaved={handlePartnerSaved}
          onCancel={() => {
            setShowPartnerForm(false);
            setSelectedPartner(null);
          }}
        />
      )}

      {showOfferForm && (
        <OfferForm
          offer={selectedOffer}
          vehicles={vehicles}
          partners={partners}
          onSaved={handleOfferSaved}
          onCancel={() => {
            setShowOfferForm(false);
            setSelectedOffer(null);
          }}
        />
      )}

      {showConversionForm && (
        <ConversionForm
          conversion={selectedConversion}
          vehicles={vehicles}
          partners={partners}
          onSaved={handleConversionSaved}
          onCancel={() => {
            setShowConversionForm(false);
            setSelectedConversion(null);
          }}
        />
      )}

      {showPayoutForm && (
        <PayoutForm
          commission={selectedCommission}
          onSaved={handlePayoutSaved}
          onCancel={() => {
            setShowPayoutForm(false);
            setSelectedCommission(null);
          }}
        />
      )}

      {showCsvImport && (
        <VehicleCsvImport
          onImported={() => {
            setShowCsvImport(false);
            checkAdminAndLoadData();
          }}
          onCancel={() => setShowCsvImport(false)}
        />
      )}
    </div>
  );
}