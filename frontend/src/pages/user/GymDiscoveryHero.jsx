import { Link } from "react-router-dom";

/**
 * The large editorial hero section for the User discovery experience —
 * the visual anchor that establishes "premium fitness brand" rather
 * than "dashboard." Reusable: pass a real gym photo when available,
 * otherwise it falls back to a plain on-brand dark panel.
 */
const GymDiscoveryHero = ({ imageUrl }) => {
  return (
    <section
      className="relative w-full px-6 py-24 sm:py-32 flex items-end sm:items-center overflow-hidden"
      style={
        imageUrl
          ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {/* Dark overlay ensures text stays legible over any photo, and
          provides the fallback background color when no image exists. */}
      <div
        className={`absolute inset-0 ${
          imageUrl
            ? "bg-gradient-to-t from-background via-background/70 to-black/40"
            : "bg-surface"
        }`}
      />

      <div className="relative max-w-3xl mx-auto sm:mx-0 sm:pl-8 lg:pl-16 text-center sm:text-left">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-white">
          Train
          <br />
          Anywhere.
          <br />
          Live
          <br />
          Stronger.
        </h1>

        <p className="text-muted text-base sm:text-lg mt-6 max-w-md mx-auto sm:mx-0">
          Discover premium gyms around you and find the right place to train.
        </p>

        <Link
          to="/gyms"
          className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200 mt-9"
        >
          Explore Gyms
        </Link>
      </div>
    </section>
  );
};

export default GymDiscoveryHero;