import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function VehicleForm({ vehicle, onSaved, onCancel }) {
  const [make, setMake] = useState(vehicle?.make || "");
  const [model, setModel] = useState(vehicle?.model || "");
  const [year, setYear] = useState(vehicle?.year || "");
  const [category, setCategory] = useState(vehicle?.category || "");
  const [price, setPrice] = useState(vehicle?.price || "");
  const [description, setDescription] = useState(
    vehicle?.description || ""
  );
  const [imageUrl, setImageUrl] = useState(
    vehicle?.image_url || ""
  );
  const [status, setStatus] = useState(
    vehicle?.status || "active"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const vehicleData = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        category: category.trim(),
        price: price.trim() || null,
        description: description.trim(),
        image_url: imageUrl.trim(),
        status,
      };

      if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
        throw new Error(
          "Make, model and year are required."
        );
      }

      let result;

      if (vehicle?.id) {
        result = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("id", vehicle.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("vehicles")
          .insert(vehicleData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSaved(result.data);
    } catch (error) {
      console.error("Vehicle save error:", error);

      setError(
        error.message || "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vehicleFormOverlay">

      <div className="vehicleFormCard">

        <div className="vehicleFormHeader">

          <div>
            <span className="adminEyebrow">
              LMCT INVENTORY
            </span>

            <h2>
              {vehicle
                ? "Edit Vehicle"
                : "Add Vehicle"}
            </h2>
          </div>

          <button
            type="button"
            className="formCloseButton"
            onClick={onCancel}
          >
            ×
          </button>

        </div>


        {error && (
          <div className="formError">
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="formGrid">

            <div className="formGroup">

              <label htmlFor="make">
                Make
              </label>

              <input
                id="make"
                value={make}
                onChange={(event) =>
                  setMake(event.target.value)
                }
                placeholder="Ferrari"
                required
              />

            </div>


            <div className="formGroup">

              <label htmlFor="model">
                Model
              </label>

              <input
                id="model"
                value={model}
                onChange={(event) =>
                  setModel(event.target.value)
                }
                placeholder="296 GTB"
                required
              />

            </div>


            <div className="formGroup">

              <label htmlFor="year">
                Year
              </label>

              <input
                id="year"
                type="number"
                value={year}
                onChange={(event) =>
                  setYear(event.target.value)
                }
                placeholder="2026"
                required
              />

            </div>


            <div className="formGroup">

              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option value="">
                  Select category
                </option>

                <option value="Supercar">
                  Supercar
                </option>

                <option value="Hypercar">
                  Hypercar
                </option>

                <option value="Sports Car">
                  Sports Car
                </option>

                <option value="Luxury">
                  Luxury
                </option>

                <option value="SUV">
                  SUV
                </option>

                <option value="Sedan">
                  Sedan
                </option>

                <option value="Coupe">
                  Coupe
                </option>

                <option value="Convertible">
                  Convertible
                </option>

              </select>

            </div>


            <div className="formGroup">

              <label htmlFor="price">
                Price
              </label>

              <input
                id="price"
                type="number"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="350000"
              />

            </div>


            <div className="formGroup">

              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

            </div>

          </div>


          <div className="formGroup">

            <label htmlFor="imageUrl">
              Vehicle Image URL
            </label>

            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(event) =>
                setImageUrl(event.target.value)
              }
              placeholder="https://example.com/car.jpg"
            />

          </div>


          <div className="formGroup">

            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              rows="5"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the vehicle..."
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
              {saving
                ? "Saving..."
                : vehicle
                ? "Save Changes"
                : "Add Vehicle"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}