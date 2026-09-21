/**
 * ============================================================
 * REQUIRED IMAGE ASSETS — must exist before this page will run
 * ============================================================
 * This file imports 5 local images that do not yet exist in the
 * project. Add these files (any real photo, matching these exact
 * filenames) to frontend/src/assets/ before running the app:
 *
 *   frontend/src/assets/gym-hero.png
 *   frontend/src/assets/gym-featured-1.png
 *   frontend/src/assets/gym-featured-2.png
 *   frontend/src/assets/gym-featured-3.png
 *   frontend/src/assets/gym-editorial.png
 *
 * Until all 5 exist, Vite will throw a "Failed to resolve import"
 * build error for each missing file.
 * ============================================================
 */

import { Link } from "react-router-dom";
import gymHero from "../../assets/gym-hero.jpg";
import gymFeatured1 from "../../assets/gym-featured-1.jpg";
import gymFeatured2 from "../../assets/gym-featured-2.jpg";
import gymFeatured3 from "../../assets/gym-featured-3.jpg";
import gymEditorial from "../../assets/gym-editorial.jpg";

// Homepage showcase content only — not fetched from the backend, not
// linked to /gyms/:id, and never presented as live database gyms.
const FEATURED_SPACES = [
  {
    name: "Iron District",
    descriptor: "Strength-focused training, built for serious lifters.",
    image: gymFeatured1,
  },
  {
    name: "The Training House",
    descriptor: "A calm, considered space for functional fitness.",
    image: gymFeatured2,
  },
  {
    name: "Apex Strength",
    descriptor: "Performance training for people who compete with themselves.",
    image: gymFeatured3,
  },
];

const WHY_GYMPASS = [
  {
    label: "01",
    title: "Discover Better",
    description: "Find gyms that fit the way you train, not just the ones nearby.",
  },
  {
    label: "02",
    title: "One Simple Platform",
    description: "Explore your options without jumping between different platforms.",
  },
  {
    label: "03",
    title: "Train Your Way",
    description: "Choose a training environment that matches your routine.",
  },
  {
    label: "04",
    title: "Keep Moving",
    description: "Make consistency easier by having your options in one place.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] bg-black/40">
        <img src={gymHero} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-black/30" />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                Train With Purpose.
              </h1>
              <p className="text-muted text-base sm:text-lg mt-6 max-w-md leading-relaxed">
                GymPass connects you with places built for progress — discover quality gyms,
                find your fit, and make every workout count.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-9">
                <Link
                  to="/gyms"
                  className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200"
                >
                  Find Your Gym
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center border border-white/25 hover:border-white/40 text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Is GymPass */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <span className="w-1 h-4 bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              What Is GymPass?
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Your Training. Your Choice.
          </h2>
          <p className="text-muted text-sm sm:text-base leading-relaxed mt-6 max-w-xl mx-auto">
            GymPass is a platform for discovering the gyms around you — built for people who
            want a straightforward way to compare, explore, and find a place that actually fits
            how they like to train. No noise, no guesswork. Just a clear view of your options.
          </p>
        </div>
      </section>

      {/* Featured Spaces — homepage showcase content, not live listings */}
      <section className="bg-surface border-y border-white/10 px-6 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Featured Spaces
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-3">
              A Glimpse Of What's Possible
            </h2>
            <p className="text-muted text-sm sm:text-base mt-4 leading-relaxed">
              A preview of the kind of training spaces you'll find on GymPass. Sample content —
              not live listings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURED_SPACES.map((space) => (
              <div key={space.name} className="border border-white/10">
                <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                  <img
                    src={space.image}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-background/80 text-muted px-2.5 py-1 border border-white/10">
                    Showcase
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-white text-lg font-semibold tracking-tight">
                    {space.name}
                  </h3>
                  <p className="text-muted text-sm mt-1.5 leading-relaxed">{space.descriptor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why GymPass */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Why GymPass
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-3">
              Built Around How You Train
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
            {WHY_GYMPASS.map((item) => (
              <div key={item.label} className="flex gap-5">
                <span className="w-1 shrink-0 bg-primary" />
                <div>
                  <span className="text-muted text-xs font-semibold uppercase tracking-wider">
                    {item.label}
                  </span>
                  <h3 className="text-white text-xl font-semibold tracking-tight mt-1">
                    {item.title}
                  </h3>
                  <p className="text-muted text-sm mt-2 leading-relaxed max-w-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial fitness section */}
      <section className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] bg-black/40">
        <img src={gymEditorial} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/20" />

        <div className="absolute inset-0 flex items-end sm:items-center">
          <div className="max-w-6xl mx-auto px-6 w-full pb-12 sm:pb-0">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Strength Is Built One Session At A Time.
              </h2>
              <p className="text-muted text-sm sm:text-base mt-5 leading-relaxed max-w-md">
                Progress rarely comes from a single effort — it comes from showing up, choosing
                the right environment, and doing the work consistently. Finding a place that
                makes that easier is where it starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 sm:py-28 text-center border-b border-white/10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Find Your Place To Train.
          </h2>
          <p className="text-muted text-sm sm:text-base mt-4">
            Your next workout starts with the right environment.
          </p>
          <Link
            to="/gyms"
            className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200 mt-9"
          >
            Explore Gyms
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;