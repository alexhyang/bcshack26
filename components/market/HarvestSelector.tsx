"use client";
import { useState } from "react";
import { CROP_CHOICES, getGameCrop } from "@/data/crops";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import type { GameState } from "@/types/game";

export function HarvestSelector({ game }: { game: GameState }) {
  const crop = getGameCrop(game);
  const configure = useGameStore((state) => state.configureHarvest);
  const [cropId, setCropId] = useState(crop.id);
  const [quantity, setQuantity] = useState(String(crop.initialInventory));
  const [error, setError] = useState("");
  const locked = game.day !== 1 || game.transactions.length > 0 || game.completed;
  const dirty = cropId !== crop.id || Number(quantity) !== crop.initialInventory;
  return (
    <form
      className="harvest-selector"
      onSubmit={(event) => {
        event.preventDefault();
        const result = configure(cropId, Number(quantity));
        setError(result.ok ? "" : result.error);
      }}
    >
      <div className="harvest-fields">
        <label>
          Crop
          <select
            aria-label="Crop"
            value={cropId}
            disabled={locked}
            onChange={(event) => {
              setCropId(event.target.value);
              setError("");
            }}
          >
            {["Vegetables", "Fruit and berries", "Grains and oilseeds", "Pulses"].map((group) => (
              <optgroup key={group} label={group}>
                {CROP_CHOICES.filter((crop) => crop.group === group).map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Starting harvest (kg)
          <input
            aria-label="Starting harvest (kg)"
            type="number"
            min="0.01"
            max="100000000"
            step="0.01"
            value={quantity}
            disabled={locked}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError("");
            }}
          />
        </label>
        {!locked && (
          <Button size="sm" type="submit" disabled={!dirty}>
            Apply harvest
          </Button>
        )}
      </div>
      {error && (
        <p className="negative" role="alert">
          {error}
        </p>
      )}
      <p className="harvest-help">
        {locked
          ? "Start a new season to change your crop or harvest size."
          : "Choose your crop and kilograms before your first trade."}
      </p>
    </form>
  );
}
