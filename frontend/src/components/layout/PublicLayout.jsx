import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Shared layout for all public-facing pages. Renders the persistent
 * Navbar and Footer once here, so individual pages don't each import
 * and render their own copies. pt-20 on <main> compensates for the
 * Navbar's fixed h-20 height, so page content never renders underneath
 * it — this is handled centrally here rather than in every page.
 */
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default PublicLayout;