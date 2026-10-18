"use client";
import { useId, useState } from "react";
import { Plus, X, Package } from "lucide-react";
import { CROP_CHOICES, getGameCrop } from "@/data/crops";
import { inventoryItems, totalInventory } from "@/engine/portfolio";
import { useGameStore } from "@/store/gameStore";
import { kg } from "@/lib/utils";
import type { GameState } from "@/types/game";

export function CropInventory({ game }: { game: GameState }) {
  const fieldId = useId();
  const { addInventory, removeInventory, selectCrop } = useGameStore();
  const [cropId, setCropId] = useState("carrots");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const editable = game.day === 1 && game.transactions.length === 0 && !game.completed;
  const items = inventoryItems(game);
  return (
    <section className="crop-inventory" aria-label="Crop inventory">
      <div className="inventory-builder-heading">
        <span>
          <Package size={14} /> MY CROP INVENTORY
        </span>
        <strong>{items.length}</strong>
      </div>
      <form
        className="inventory-builder-form"
        onSubmit={(event) => {
          event.preventDefault();
          const result = addInventory(cropId, Number(quantity));
          setMessage({
            error: !result.ok,
            text: result.ok
              ? `Added ${kg(Number(quantity))} kg of ${CROP_CHOICES.find((crop) => crop.id === cropId)!.name}.`
              : result.error,
          });
          if (result.ok) setQuantity("");
        }}
      >
        <label htmlFor={`${fieldId}-crop`}>Crop</label>
        <select
          id={`${fieldId}-crop`}
          value={cropId}
          disabled={!editable}
          onChange={(event) => {
            setCropId(event.target.value);
            setMessage(null);
          }}
        >
          {["Vegetables", "Fruit and berries", "Grains and oilseeds", "Pulses"].map((group) => (
            <optgroup label={group} key={group}>
              {CROP_CHOICES.filter((crop) => crop.group === group).map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <label htmlFor={`${fieldId}-kg`}>Quantity (kg)</label>
        <input
          id={`${fieldId}-kg`}
          type="number"
          min="0.01"
          max="100000000"
          step="0.01"
          inputMode="decimal"
          placeholder="e.g. 500"
          value={quantity}
          disabled={!editable}
          onChange={(event) => {
            setQuantity(event.target.value);
            setMessage(null);
          }}
        />
        <button className="add-inventory-button" type="submit" disabled={!editable}>
          <Plus size={14} /> Add to inventory
        </button>
      </form>
      {message && (
        <p
          className={`inventory-builder-message ${message.error ? "negative" : "positive"}`}
          role={message.error ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}
      <div className="inventory-crop-list">
        {items.length === 0 ? (
          <p className="inventory-empty">Add your crops and kg amounts to build your inventory.</p>
        ) : (
          items.map((item) => {
            const crop = CROP_CHOICES.find((crop) => crop.id === item.cropId)!;
            const active = crop.id === getGameCrop(game).id;
            return (
              <div className={`inventory-crop-row ${active ? "active" : ""}`} key={crop.id}>
                <button
                  type="button"
                  className="inventory-crop-select"
                  onClick={() => selectCrop(crop.id)}
                  aria-pressed={active}
                >
                  <span>
                    {crop.name}
                    {active && <small>SELECTED</small>}
                  </span>
                  <strong>
                    {kg(item.inventory)} <small>kg</small>
                  </strong>
                </button>
                {editable && (
                  <button
                    type="button"
                    className="inventory-remove"
                    aria-label={`Remove ${crop.name} from inventory`}
                    onClick={() => {
                      removeInventory(crop.id);
                      setMessage(null);
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="inventory-total">
        <span>Total inventory</span>
        <strong>{kg(totalInventory(game))} kg</strong>
      </div>
      <p className="inventory-builder-help">
        {editable
          ? "Add several crops. Select a crop in your list to view its market and sell it."
          : "Select any crop to trade it. Start a new season to edit starting inventory."}
      </p>
    </section>
  );
}
