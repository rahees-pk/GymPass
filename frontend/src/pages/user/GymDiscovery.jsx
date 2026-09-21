import { useEffect, useMemo, useState } from "react";
import { fetchApprovedGyms } from "../../api/publicGyms";
import { getErrorMessage } from "../../utils/errorMessage";
import GymCard from "../../components/user/GymCard";
import FilterPills from "../../components/user/FilterPills";

const GymDiscovery = () => {
  const [gyms, setGyms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFacility, setActiveFacility] = useState("");

  useEffect(() => {
    const loadGyms = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchApprovedGyms();
        setGyms(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadGyms();
  }, []);

  const filteredGyms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return gyms.filter((gym) => {
      const matchesSearch =
        !term ||
        gym.name?.toLowerCase().includes(term) ||
        gym.address?.city?.toLowerCase().includes(term) ||
        gym.address?.state?.toLowerCase().includes(term);

      const matchesFacility = !activeFacility || gym.facilities?.includes(activeFacility);

      return matchesSearch && matchesFacility;
    });
  }, [gyms, searchTerm, activeFacility]);

  return (
    <div className="min-h-screen bg-background">
      {/* Intro section: heading, copy, search, filters */}
      <div className="px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]">
              Find Your Gym.
            </h1>
            <p className="text-muted text-sm sm:text-base mt-4">
              Discover approved partner gyms and find the right place to train.
            </p>
          </div>

          <div className="relative mt-10">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search gyms, locations..."
              className="w-full bg-surface border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-md pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-muted/60 focus:outline-none transition-colors duration-200"
            />
          </div>

          <div className="mt-6">
            <FilterPills gyms={gyms} active={activeFacility} onChange={setActiveFacility} />
          </div>
        </div>
      </div>

      {/* Results section */}
      <div className="border-t border-white/10 px-6 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <p className="text-muted text-sm text-center py-24">Loading gyms...</p>
          ) : error ? (
            <div className="border border-primary/30 bg-primary/5 text-primary text-sm text-center px-6 py-8">
              {error}
            </div>
          ) : filteredGyms.length === 0 ? (
            <div className="border border-white/10 text-muted text-sm text-center px-6 py-16">
              No gyms match your search right now.
            </div>
          ) : (
            <>
              <p className="text-muted text-xs uppercase tracking-wider mb-6">
                {filteredGyms.length} {filteredGyms.length === 1 ? "gym" : "gyms"} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGyms.map((gym) => (
                  <GymCard key={gym._id} gym={gym} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GymDiscovery;