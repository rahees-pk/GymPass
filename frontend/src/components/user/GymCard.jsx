import { Link } from "react-router-dom";

const GymCard = ({ gym }) => {
  const primaryImage = gym.images?.[0]?.url;
  const primaryFacility = gym.facilities?.[0];
  const hasRating = gym.rating?.count > 0;

  return (
    <Link
      to={`/gyms/${gym._id}`}
      className="group block border border-white/10 hover:border-white/20 transition-colors duration-200"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={gym.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs uppercase tracking-wider">
            No Image Available
          </div>
        )}
      </div>

      <div className="p-6 transition-colors duration-200 group-hover:bg-white/[0.02]">
        <h3 className="text-white text-lg font-semibold tracking-tight leading-snug">
          {gym.name}
        </h3>

        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1 h-3.5 bg-primary" />
          <p className="text-muted text-xs uppercase tracking-wider">
            {gym.address?.city}, {gym.address?.state}
          </p>
        </div>

        {(hasRating || primaryFacility) && (
          <div className="flex items-center gap-3 mt-4">
            {hasRating && (
              <span className="text-white text-sm font-medium">
                {gym.rating.average.toFixed(1)} <span className="text-primary">★</span>
              </span>
            )}
            {hasRating && primaryFacility && <span className="w-px h-3.5 bg-white/15" />}
            {primaryFacility && (
              <span className="text-muted text-xs uppercase tracking-wider">
                {primaryFacility}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-white/10">
          <span className="text-muted text-xs uppercase tracking-wider group-hover:text-primary transition-colors duration-200">
            Explore Gym
          </span>
          <span className="text-muted text-xs group-hover:text-primary group-hover:translate-x-1 transition-all duration-200">
            →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GymCard;