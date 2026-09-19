import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const EXPECTED_COLUMNS = [
  "make",
  "model",
  "year",
  "category",
  "price",
  "description",
  "image_url",
  "status",
];

const TEMPLATE_CSV =
  "make,model,year,category,price,description,image_url,status\n" +
  'Ferrari,296 GTB,2024,Supercar,329000,"V6 hybrid, 819 HP",https://example.com/296gtb.jpg,active\n';

// A small, dependency-free CSV parser. Handles quoted fields
// (including commas and escaped quotes inside them), which covers
// what a spreadsheet export or Google Sheets download will produce.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function rowsToVehicles(rows) {
  if (rows.length === 0) {
    throw new Error("The file is empty.");
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const missing = ["make", "model", "year", "price"].filter(
    (required) => !header.includes(required)
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required column(s): ${missing.join(", ")}. Expected columns: ${EXPECTED_COLUMNS.join(", ")}.`
    );
  }

  return rows.slice(1).map((row, index) => {
    const record = {};
    header.forEach((column, columnIndex) => {
      record[column] = (row[columnIndex] || "").trim();
    });

    if (!record.make || !record.model || !record.year || !record.price) {
      throw new Error(
        `Row ${index + 2} is missing make, model, year or price.`
      );
    }

    return {
      make: record.make,
      model: record.model,
      year: Number(record.year),
      category: record.category || null,
      price: Number(record.price),
      description: record.description || null,
      image_url: record.image_url || null,
      status: record.status || "active",
    };
  });
}

export default function VehicleCsvImport({ onImported, onCancel }) {
  const [fileName, setFileName] = useState("");
  const [parsedVehicles, setParsedVehicles] = useState([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setError("");
    setResult(null);
    setParsedVehicles([]);

    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        const vehicles = rowsToVehicles(rows);
        setParsedVehicles(vehicles);
      } catch (parseError) {
        console.error("CSV parse error:", parseError);
        setError(parseError.message || "Unable to parse this CSV file.");
      }
    };
    reader.onerror = () => {
      setError("Unable to read this file.");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("vehicles")
        .insert(parsedVehicles)
        .select();

      if (insertError) {
        throw insertError;
      }

      setResult(data?.length || 0);
    } catch (importError) {
      console.error("CSV import error:", importError);
      setError(importError.message || "Unable to import these vehicles.");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lmct-vehicle-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="vehicleFormOverlay">
      <div className="vehicleFormCard">
        <div className="vehicleFormHeader">
          <div>
            <span className="adminEyebrow">INVENTORY</span>
            <h2>Import Vehicles from CSV</h2>
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

        {result !== null ? (
          <div className="partnerSuccess">
            <h3>Import complete.</h3>
            <p>
              {result} vehicle{result === 1 ? "" : "s"} added to your
              inventory.
            </p>

            <div className="formActions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="adminPrimaryButton"
                onClick={onImported}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 20 }}>
              Upload a CSV with columns: make, model, year, category,
              price, description, image_url, status. Only make,
              model, year and price are required.
            </p>

            <div className="formGroup">
              <label htmlFor="csvFile">CSV File</label>
              <input
                id="csvFile"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />
            </div>

            {parsedVehicles.length > 0 && (
              <div className="emptyState" style={{ padding: "20px 0" }}>
                <h3>{parsedVehicles.length} vehicles ready to import</h3>
                <p>
                  From {fileName}. Review the row count looks right,
                  then import below.
                </p>
              </div>
            )}

            <div className="formActions">
              <button
                type="button"
                className="adminSecondaryButton"
                onClick={downloadTemplate}
              >
                Download Template
              </button>

              <button
                type="button"
                className="adminSecondaryButton"
                onClick={onCancel}
                disabled={importing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="adminPrimaryButton"
                onClick={handleImport}
                disabled={parsedVehicles.length === 0 || importing}
              >
                {importing
                  ? "Importing..."
                  : `Import ${parsedVehicles.length || ""} Vehicles`.trim()}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
