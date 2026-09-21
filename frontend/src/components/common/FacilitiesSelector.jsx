import { useState } from "react";

const PRESET_FACILITIES = [
  "Cardio",
  "Strength Training",
  "Personal Training",
  "Locker Room",
  "Parking",
  "Shower",
  "Sauna",
  "WiFi",
];

/**
 * Lets an owner toggle common facility tags and add custom ones.
 * Keeps the resulting array as simple strings, matching how the
 * backend's Gym model stores facilities: [String].
 */
const FacilitiesSelector = ({ selected, onChange }) => {
  const [customValue, setCustomValue] = useState("");

  const toggle = (facility) => {
    if (selected.includes(facility)) {
      onChange(selected.filter((f) => f !== facility));
    } else {
      onChange([...selected, facility]);
    }
  };

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomValue("");
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  };

  // Facilities the owner already added that aren't in the preset list
  // (e.g. custom ones from a previous edit) should still render as tags.
  const customSelected = selected.filter((f) => !PRESET_FACILITIES.includes(f));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESET_FACILITIES.map((facility) => {
          const isSelected = selected.includes(facility);
          return (
            <button
              key={facility}
              type="button"
              onClick={() => toggle(facility)}
              className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border transition-colors duration-200 ${
                isSelected
                  ? "border-primary text-primary bg-primary/5"
                  : "border-white/15 text-muted hover:border-white/30 hover:text-white"
              }`}
            >
              {facility}
            </button>
          );
        })}

        {customSelected.map((facility) => (
          <button
            key={facility}
            type="button"
            onClick={() => toggle(facility)}
            className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider border border-primary text-primary bg-primary/5 transition-colors duration-200"
          >
            {facility} ×
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          placeholder="Add a custom facility..."
          className="flex-1 bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-muted/60 focus:outline-none focus:border-primary transition-colors duration-200"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-white/15 text-muted hover:text-white hover:border-white/30 transition-colors duration-200"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default FacilitiesSelector;