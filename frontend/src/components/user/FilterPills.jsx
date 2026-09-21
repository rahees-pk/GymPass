import { useMemo } from "react";

const FilterPills = ({ gyms, active, onChange, maxOptions = 6 }) => {
  const facilityOptions = useMemo(() => {
    const allFacilities = gyms.flatMap((gym) => gym.facilities || []);
    const distinct = [...new Set(allFacilities)];
    return distinct.slice(0, maxOptions);
  }, [gyms, maxOptions]);

  const options = ["All", ...facilityOptions];

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-1 -mx-1.5 px-1.5"
      style={{
        maskImage: "linear-gradient(to right, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, black 92%, transparent 100%)",
      }}
    >
      {options.map((option) => {
        const value = option === "All" ? "" : option;
        const isActive = active === value;
        const isAllOption = option === "All";

        return (
          <button
            key={option}
            onClick={() => onChange(value)}
            className={`shrink-0 whitespace-nowrap px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border rounded-md transition-colors duration-200 ${
              isActive
                ? "bg-primary/10 border-primary text-primary"
                : isAllOption
                ? "border-white/25 text-white hover:border-white/40"
                : "border-white/15 text-muted hover:border-white/30 hover:text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default FilterPills;