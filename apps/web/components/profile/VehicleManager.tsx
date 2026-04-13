"use client";

import { useEffect, useState } from "react";
import { Car, Bike, CarFront, ShieldCheck, Trash2, Plus } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";

type VehicleRow = {
  id: string;
  vehicle_type: "bike" | "car_hatchback" | "car_sedan" | "car_suv" | "ev";
  number_plate: string;
  is_default: boolean;
};

const vehicleOptions: Array<{ value: VehicleRow["vehicle_type"]; label: string }> = [
  { value: "bike", label: "Bike" },
  { value: "car_hatchback", label: "Car (Hatchback)" },
  { value: "car_sedan", label: "Car (Sedan)" },
  { value: "car_suv", label: "Car (SUV)" },
  { value: "ev", label: "EV" },
];

function VehicleIcon({ type }: { type: VehicleRow["vehicle_type"] }) {
  if (type === "bike") return <Bike className="h-4 w-4 text-electric-bright" />;
  if (type === "car_suv") return <CarFront className="h-4 w-4 text-electric-bright" />;
  return <Car className="h-4 w-4 text-electric-bright" />;
}

export function VehicleManager() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<VehicleRow["vehicle_type"]>("car_hatchback");
  const [plate, setPlate] = useState("");
  const [setDefault, setSetDefault] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/profile/vehicles", { cache: "no-store" });
    const json = (await res.json()) as { vehicles?: VehicleRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Failed to load vehicles");
      setLoading(false);
      return;
    }
    setVehicles(json.vehicles ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_type: type,
        number_plate: plate,
        is_default: setDefault,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Failed to add vehicle");
      return;
    }
    setPlate("");
    setSetDefault(false);
    await load();
  }

  async function makeDefault(vehicleId: string) {
    setError(null);
    const res = await fetch("/api/profile/vehicles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Failed to set default");
      return;
    }
    await load();
  }

  async function remove(vehicleId: string) {
    setError(null);
    const res = await fetch(`/api/profile/vehicles?vehicleId=${vehicleId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Failed to delete vehicle");
      return;
    }
    await load();
  }

  return (
    <div className="rounded-2xl border border-border-token bg-bg-surface p-5">
      <h2 className="text-lg font-semibold text-white">Your vehicles</h2>
      <p className="mt-1 text-xs text-txt-muted">At least one vehicle is needed before making a booking.</p>

      <form onSubmit={addVehicle} className="mt-4 grid gap-3 sm:grid-cols-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as VehicleRow["vehicle_type"])}
          className="rounded-xl border border-border-token bg-bg-elevated px-3 py-2 text-sm text-white outline-none"
        >
          {vehicleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="Number plate (e.g. TN01AB1234)"
          className="rounded-xl border border-border-token bg-bg-elevated px-3 py-2 text-sm text-white outline-none placeholder:text-txt-disabled"
        />
        <GlowButton
          type="submit"
          size="md"
          variant="primary"
          disabled={saving || !plate.trim()}
          icon={<Plus className="h-4 w-4" />}
        >
          {saving ? "Adding..." : "Add vehicle"}
        </GlowButton>
      </form>

      <label className="mt-3 flex items-center gap-2 text-xs text-txt-secondary">
        <input
          type="checkbox"
          checked={setDefault}
          onChange={(e) => setSetDefault(e.target.checked)}
          className="h-4 w-4 rounded border-border-token bg-bg-elevated"
        />
        Set as default vehicle
      </label>

      {error ? (
        <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
      ) : null}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-txt-muted">Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <p className="rounded-xl border border-border-token bg-bg-elevated px-3 py-3 text-sm text-txt-muted">
            No vehicles added yet.
          </p>
        ) : (
          vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-border-token bg-bg-elevated px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <VehicleIcon type={v.vehicle_type} />
                <p className="text-sm text-white">{v.number_plate}</p>
                {v.is_default ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-electric/15 px-2 py-0.5 text-[11px] text-electric-bright">
                    <ShieldCheck className="h-3 w-3" />
                    Default
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {!v.is_default ? (
                  <button
                    type="button"
                    onClick={() => void makeDefault(v.id)}
                    className="rounded-lg border border-border-token px-2 py-1 text-xs text-txt-secondary hover:text-white"
                  >
                    Make default
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove(v.id)}
                  className="rounded-lg border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
