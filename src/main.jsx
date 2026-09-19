import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

import { trackAffiliateClick } from "./utils/affiliateTracking";
import { getVehicles } from "./data/vehicleService";

import Admin from "./Admin";
import Login from "./Login";
import PartnerLogin from "./PartnerLogin";
import PartnerPortal from "./PartnerPortal";
import PartnerApplicationForm from "./components/PartnerApplicationForm";
import ContactForm from "./components/ContactForm";

const navItems = [
  "Home",
  "Cars",
  "Deals",
  "Brands",
  "Compare",
  "Services",
  "Blog",
  "Partner With Us",
  "About",
  "Contact",
];

const blogPosts = [
  {
    tag: "BUYING GUIDE",
    title: "What to check before you click \"View Deal\"",
    excerpt:
      "A quick checklist for verifying a listing's advertiser, availability and pricing before you contact a dealer through LMCT.",
  },
  {
    tag: "MARKET NOTES",
    title: "Why exotic car values move differently than the rest of the market",
    excerpt:
      "Limited production runs, brand heritage and collector demand all play a role in how supercars hold — or gain — value over time.",
  },
  {
    tag: "PARTNER SPOTLIGHT",
    title: "How affiliate partnerships work on LMCT",
    excerpt:
      "A behind-the-scenes look at how LMCT connects buyers with dealers, and how referrals are tracked from click to commission.",
  },
];

const partnerBenefits = [
  {
    number: "01",
    text: "Exposure to car enthusiasts actively searching for luxury, exotic and performance vehicles.",
  },
  {
    number: "02",
    text: "Additional qualified traffic driven straight to your listings or affiliate program.",
  },
  {
    number: "03",
    text: "Qualified buyer referrals through our tracked \"View Deal\" system.",
  },
  {
    number: "04",
    text: "Automotive-focused content and social media promotion of your inventory.",
  },
  {
    number: "05",
    text: "Affiliate marketing and referral partnerships tailored to your business.",
  },
  {
    number: "06",
    text: "Transparent performance tracking of clicks, leads and conversions.",
  },
];

function LogoMark() {
  return (
    <span className="logoMark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
          stroke="#c9a66b"
          strokeWidth="1.3"
        />
        <path
          d="M7 13.2L10.2 16.4L17 9"
          stroke="#c9a66b"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [carsError, setCarsError] = useState("");
  const [copiedCarId, setCopiedCarId] = useState(null);

  function copyShareLink(car) {
    const shareText = `Discover this ${car.year} ${car.make} ${car.model} on LMCT: ${window.location.href}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }

    setCopiedCarId(car.id);
    setTimeout(() => setCopiedCarId(null), 2000);
  }

  /*
   * LOAD VEHICLES FROM SUPABASE
   */
  useEffect(() => {
    async function loadCars() {
      try {
        const vehicles = await getVehicles();
        setCars(vehicles);
      } catch (error) {
        console.error("Failed to load vehicles:", error);

        setCarsError(
          "Unable to load vehicles. Please check your Supabase connection."
        );
      } finally {
        setLoadingCars(false);
      }
    }

    loadCars();
  }, []);

  /*
   * ADMIN AND LOGIN ROUTES
   */
  if (window.location.pathname === "/login") {
    return <Login />;
  }

  if (window.location.pathname === "/admin") {
    return <Admin />;
  }

  if (window.location.pathname === "/partner-login") {
    return <PartnerLogin />;
  }

  if (window.location.pathname === "/partner-portal") {
    return <PartnerPortal />;
  }

  /*
   * CLIENT-SIDE ROUTER (for the main site's own pages)
   */
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path) {
    if (path !== window.location.pathname) {
      window.history.pushState({}, "", path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
    setMenuOpen(false);
  }

  function linkTo(path) {
    return {
      href: path,
      onClick: (event) => {
        event.preventDefault();
        navigate(path);
      },
    };
  }

  function pathFor(navItem) {
    return navItem === "Home"
      ? "/"
      : `/${navItem.toLowerCase().replace(/\s+/g, "-")}`;
  }

  const isHome = currentPath === "/";

  /*
   * SEARCH
   */
  const filteredCars = cars.filter((car) => {
    const searchableText = [
      car.make,
      car.model,
      car.category,
      car.year,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query.toLowerCase());
  });

  function filterByBrand(brand) {
    setQuery(brand);
    navigate("/cars");
  }

  const uniqueBrands = Object.values(
    cars.reduce((acc, car) => {
      if (!car.make) return acc;
      if (!acc[car.make]) {
        acc[car.make] = { name: car.make, count: 0 };
      }
      acc[car.make].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => a.name.localeCompare(b.name));

  /*
   * COMPARE TOOL
   */
  const [compareIds, setCompareIds] = useState(["", "", ""]);

  function updateCompareSelection(index, carId) {
    setCompareIds((current) => {
      const next = [...current];
      next[index] = carId;
      return next;
    });
  }

  const compareCars = compareIds.map((id) =>
    cars.find((car) => String(car.id) === String(id))
  );

  /*
   * MAIN WEBSITE
   */
  return (
    <div className="site">

      {/* ================= HEADER ================= */}

      <header className="header">
        <a className="logo" {...linkTo("/")}>
          <LogoMark />
          <span className="logoWords">
            <span className="logoMain">LMCT</span>
            <span className="logoSub">
              LUXURY MOTOR CAR TRADER
            </span>
          </span>
        </a>

        <button
          className={`menuButton ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => {
            const path = pathFor(item);
            return (
              <a
                key={item}
                className={currentPath === path ? "activeNavLink" : ""}
                {...linkTo(path)}
              >
                {item}
              </a>
            );
          })}

          <a className="navCta" {...linkTo("/cars")}>
            Explore Cars
            <span>↗</span>
          </a>
        </nav>
      </header>

      <main>

        {/* ================= HERO ================= */}

        {isHome && (
        <section id="home" className="hero">
          <div className="heroBackground"></div>
          <div className="heroOverlay"></div>

          <div className="heroContent">

            <div className="heroEyebrow">
              <span className="eyebrowLine"></span>

              <span>
                INDEPENDENT AUTOMOTIVE AFFILIATE PLATFORM
              </span>
            </div>

            <h1>
              Find Your
              <br />
              <em>Dream Car.</em>
            </h1>

            <p className="heroText">
              Discover luxury, exotic and performance cars
              advertised by trusted automotive companies and
              dealerships around the world.
            </p>

            <div className="heroActions">
              <a className="button primaryButton" {...linkTo("/cars")}>
                Browse Cars
                <span>↗</span>
              </a>

              <a className="button secondaryButton" {...linkTo("/deals")}>
                Explore Deals
                <span>→</span>
              </a>
            </div>

            <div className="heroTrust">

              <div className="trustItem">
                <strong>01</strong>
                <span>Discover</span>
              </div>

              <div className="trustDivider"></div>

              <div className="trustItem">
                <strong>02</strong>
                <span>Compare</span>
              </div>

              <div className="trustDivider"></div>

              <div className="trustItem">
                <strong>03</strong>
                <span>View Offer</span>
              </div>

            </div>

            <p className="disclosure">
              LMCT is an independent automotive affiliate
              platform. Vehicles are advertised by third-party
              partners. Availability and pricing are subject to
              the advertiser.
            </p>

          </div>

          <a className="heroScroll" {...linkTo("/cars")}>
            <span>EXPLORE CARS</span>
            <div className="scrollLine"></div>
          </a>

        </section>
        )}

        {/* ================= SEARCH ================= */}

        {currentPath === "/cars" && (
        <>
        <section className="searchSection">

          <div className="searchHeading">
            <p className="eyebrow darkEyebrow">
              FIND YOUR NEXT DRIVE
            </p>

            <h2>
              Search premium vehicles.
            </h2>
          </div>

          <div className="searchBox">

            <span className="searchIcon">
              ⌕
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a make, model or luxury car..."
            />

            <span className="searchHint">
              ENTER
            </span>

          </div>

        </section>

        {/* ================= FEATURED CARS ================= */}

        <section
          id="cars"
          className="section featuredSection"
        >

          <div className="sectionHead">

            <div>

              <p className="eyebrow darkEyebrow">
                CURATED SELECTION
              </p>

              <h2>
                Featured Cars
              </h2>

              <p className="sectionDescription">
                Explore selected luxury, exotic and
                performance vehicles advertised through our
                automotive partners.
              </p>

            </div>

          </div>

          {/* Loading */}

          {loadingCars && (
            <p className="sectionMessage">
              Loading vehicles...
            </p>
          )}

          {/* Error */}

          {carsError && (
            <p className="sectionMessage errorMessage">
              {carsError}
            </p>
          )}

          {/* Cars */}

          {!loadingCars &&
          !carsError &&
          filteredCars.length > 0 ? (

            <div className="carGrid">

              {filteredCars.map((car) => (

                <article
                  className="carCard"
                  key={car.id}
                >

                  {/* IMAGE */}

                  <div className="carImageWrapper">

                    <img
                      src={car.image}
                      alt={`${car.year} ${car.make} ${car.model}`}
                    />

                    <div className="imageShade"></div>

                    <span className="carCategory">
                      {car.category}
                    </span>

                    <button
                      className="favoriteButton"
                      aria-label={`Save ${car.make} ${car.model}`}
                    >
                      ♡
                    </button>

                    <div className="imageYear">
                      {car.year}
                    </div>

                  </div>

                  {/* BODY */}

                  <div className="carBody">

                    <div className="carTitleRow">

                      <div>

                        <p className="carMake">
                          {car.make} · {car.year}
                        </p>

                        <h3>
                          {car.model}
                        </h3>

                      </div>

                      <span className="arrowCircle">
                        ↗
                      </span>

                    </div>

                    {/* SPECS */}

                    {car.specs &&
                      car.specs.length > 0 && (

                      <div className="specList">

                        {car.specs.map((spec) => (
                          <span key={spec}>
                            {spec}
                          </span>
                        ))}

                      </div>
                    )}

                    <div className="carDivider"></div>

                    <div className="carBottom">

                      <div>

                        <span className="priceLabel">
                          ADVERTISED PRICE
                        </span>

                        <p className="price">
                          {car.price}
                        </p>

                      </div>

                      <div className="location">

                        <span>
                          ADVERTISED BY
                        </span>

                        <strong>
                          {car.advertiser}
                        </strong>

                      </div>

                    </div>

                    <p className="partnerDisclosure">
                      Offer provided by a third-party
                      automotive partner.
                    </p>

                    {/* AFFILIATE DEAL BUTTON */}

                    {car.affiliateUrl &&
                    car.affiliateUrl !== "#" ? (

                      <a
                        className="dealButton"
                        href={car.affiliateUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        onClick={() =>
                          trackAffiliateClick({
                            id: car.affiliateOfferId,
                          })
                        }
                      >
                        {car.cta || "View Deal"}

                        <span>
                          ↗
                        </span>

                      </a>

                    ) : (

                      <button
                        className="dealButton"
                        type="button"
                        disabled
                      >
                        Offer Unavailable
                      </button>

                    )}

                    {/* SOCIAL SHARE */}

                    <div className="shareRow">

                      <span className="shareLabel">Share:</span>

                      <a
                        className="shareButton"
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Discover this ${car.year} ${car.make} ${car.model} on LMCT: ${window.location.href}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on WhatsApp"
                      >
                        WhatsApp
                      </a>

                      <a
                        className="shareButton"
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          window.location.href
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Facebook"
                      >
                        Facebook
                      </a>

                      <a
                        className="shareButton"
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          `Discover this ${car.year} ${car.make} ${car.model} on LMCT.`
                        )}&url=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on X"
                      >
                        X
                      </a>

                      <button
                        type="button"
                        className="shareButton"
                        onClick={() => copyShareLink(car)}
                      >
                        {copiedCarId === car.id ? "Copied!" : "Copy Link"}
                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            !loadingCars &&
            !carsError && (

              <div className="noResults">

                <h3>
                  No vehicles found
                </h3>

                <p>
                  Try searching for Ferrari, Lamborghini,
                  Porsche or another vehicle.
                </p>

              </div>

            )

          )}

        </section>
        </>
        )}

        {/* ================= DEALS INTRO ================= */}

        {currentPath === "/deals" && (
        <section
          id="deals"
          className="dealBanner"
        >

          <div>

            <p className="eyebrow">
              THE LMCT COLLECTION
            </p>

            <h2>
              Exceptional cars.
              <br />
              <em>
                Independent offers.
              </em>
            </h2>

          </div>

          <a className="button goldButton" {...linkTo("/cars")}>
            Explore Current Offers
            <span>↗</span>
          </a>

        </section>
        )}

        {/* ================= BRANDS ================= */}

        {currentPath === "/brands" && (
        <section id="brands" className="brandsSection">

          <div className="sectionHead">
            <p className="eyebrow">SHOP BY BRAND</p>
            <h2>Every marque, one destination.</h2>
          </div>

          {uniqueBrands.length > 0 ? (
            <div className="brandsGrid">
              {uniqueBrands.map((brand) => (
                <button
                  key={brand.name}
                  type="button"
                  className="brandCard"
                  onClick={() => filterByBrand(brand.name)}
                >
                  <span className="brandName">{brand.name}</span>
                  <span className="brandCount">
                    {brand.count} listing{brand.count === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="emptyState">
              <h3>No brands available yet</h3>
              <p>Brands will appear here once vehicles are listed.</p>
            </div>
          )}

        </section>
        )}

        {/* ================= COMPARE ================= */}

        {currentPath === "/compare" && (
        <section id="compare" className="compareSection">

          <div className="sectionHead">
            <p className="eyebrow">SIDE BY SIDE</p>
            <h2>Compare vehicles.</h2>
          </div>

          <div className="compareSelectors">
            {compareIds.map((id, index) => (
              <div className="formGroup" key={index}>
                <label htmlFor={`compareSlot${index}`}>
                  Vehicle {index + 1}
                </label>
                <select
                  id={`compareSlot${index}`}
                  value={id}
                  onChange={(event) =>
                    updateCompareSelection(index, event.target.value)
                  }
                >
                  <option value="">Select a vehicle</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {compareCars.some(Boolean) ? (
            <div className="adminTableWrapper">
              <table className="compareTable">
                <thead>
                  <tr>
                    <th>Spec</th>
                    {compareCars.map((car, index) => (
                      <th key={index}>
                        {car ? `${car.year} ${car.make} ${car.model}` : "—"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Price</td>
                    {compareCars.map((car, index) => (
                      <td key={index}>
                        {car ? `$${Number(car.price).toLocaleString()}` : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Category</td>
                    {compareCars.map((car, index) => (
                      <td key={index}>{car ? car.category || "—" : "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Advertiser</td>
                    {compareCars.map((car, index) => (
                      <td key={index}>{car ? car.advertiser : "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Description</td>
                    {compareCars.map((car, index) => (
                      <td key={index}>{car ? car.description || "—" : "—"}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="emptyState">
              <h3>Pick vehicles to compare</h3>
              <p>Select two or three vehicles above to see them side by side.</p>
            </div>
          )}

        </section>
        )}

        {/* ================= SERVICES ================= */}

        {currentPath === "/services" && (
        <section
          id="services"
          className="darkSection"
        >

          <div className="servicesIntro">

            <p className="eyebrow">
              AUTOMOTIVE SERVICES
            </p>

            <h2>
              More than
              <br />
              <em>
                a car search.
              </em>
            </h2>

            <p>
              Discover useful automotive services from
              partner companies, including vehicle-history
              reports, financing, insurance and automotive
              marketplaces.
            </p>

          </div>

          <div className="serviceGrid">

            {[
              {
                number: "01",
                title: "Vehicle History",
                text: "Research a vehicle before making a purchase decision.",
              },
              {
                number: "02",
                title: "Car Financing",
                text: "Explore financing solutions from automotive partners.",
              },
              {
                number: "03",
                title: "Car Insurance",
                text: "Compare insurance options through partner platforms.",
              },
              {
                number: "04",
                title: "Car Marketplaces",
                text: "Browse additional vehicles from automotive marketplaces.",
              },
            ].map((service) => (

              <div
                className="service"
                key={service.number}
              >

                <span className="serviceNumber">
                  {service.number}
                </span>

                <h3>
                  {service.title}
                </h3>

                <p>
                  {service.text}
                </p>

                <a {...linkTo("/contact")}>
                  Explore service
                  <span>↗</span>
                </a>

              </div>

            ))}

          </div>

        </section>
        )}

        {/* ================= BLOG ================= */}

        {currentPath === "/blog" && (
        <section id="blog" className="blogSection">

          <div className="sectionHead">
            <p className="eyebrow">LMCT INSIGHTS</p>
            <h2>From the LMCT desk.</h2>
          </div>

          <div className="blogGrid">

            {blogPosts.map((post) => (
              <article className="blogCard" key={post.title}>
                <span className="blogTag">{post.tag}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </article>
            ))}

          </div>

        </section>
        )}

        {/* ================= PARTNER WITH LMCT ================= */}

        {currentPath === "/partner-with-us" && (
        <section
          id="partner-with-us"
          className="partnerSection"
        >

          <div className="partnerIntro">

            <p className="eyebrow">
              PARTNER WITH LMCT
            </p>

            <h2>
              Put your vehicles in front of buyers
              actively searching for luxury, exotic
              and performance cars.
            </h2>

            <p>
              LMCT connects automotive companies,
              dealerships and marketplaces with buyers
              through affiliate, referral and
              advertising partnerships.
            </p>

            <a href="/partner-login" className="partnerPortalLink">
              Already a partner? Sign in to your dashboard →
            </a>

          </div>

          <div className="partnerLayout">

            <div className="partnerBenefits">

              {partnerBenefits.map((benefit) => (

                <div
                  className="partnerBenefit"
                  key={benefit.number}
                >
                  <strong>{benefit.number}</strong>
                  <span>{benefit.text}</span>
                </div>

              ))}

            </div>

            <PartnerApplicationForm />

          </div>

        </section>
        )}

        {/* ================= ABOUT ================= */}

        {currentPath === "/about" && (
        <section id="about" className="aboutSection">

          <div className="sectionHead">
            <p className="eyebrow">ABOUT LMCT</p>
            <h2>An independent marketplace, not a dealer.</h2>
          </div>

          <div className="aboutLayout">

            <p className="aboutLead">
              Luxury Motor Car Trader connects buyers with legitimate
              automotive companies, dealerships, marketplaces and
              service providers. LMCT does not own, stock or sell
              the vehicles advertised here — we're a marketing,
              discovery and referral platform, and we may earn a
              commission when a listing leads to a qualifying sale
              or lead with one of our partners.
            </p>

            <div className="aboutSteps">

              {[
                { step: "01", text: "You browse vehicles advertised by LMCT partners." },
                { step: "02", text: "Every listing discloses its advertiser — you always know who you're dealing with." },
                { step: "03", text: "\"View Deal\" takes you to the partner's own site to inquire or purchase." },
                { step: "04", text: "The partner handles the transaction; LMCT never processes vehicle payments." },
              ].map((item) => (
                <div className="aboutStep" key={item.step}>
                  <strong>{item.step}</strong>
                  <span>{item.text}</span>
                </div>
              ))}

            </div>

            <ul className="aboutTransparency">
              <li>Prices and availability are set by, and subject to, the advertiser.</li>
              <li>LMCT does not guarantee any third-party vehicle, transaction or financing.</li>
              <li>We don't claim an official manufacturer relationship unless documented.</li>
            </ul>

          </div>

        </section>
        )}

        {/* ================= CONTACT ================= */}

        {currentPath === "/contact" && (
        <section id="contact" className="contactSection">

          <div className="sectionHead">
            <p className="eyebrow">GET IN TOUCH</p>
            <h2>Contact LMCT.</h2>
          </div>

          <div className="contactLayout">

            <div className="contactInfo">
              <p>
                Questions about a listing, a partnership, or
                anything else — send us a message and we'll get
                back to you.
              </p>
            </div>

            <ContactForm />

          </div>

        </section>
        )}

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div className="footerBrand">

          <a className="logo" {...linkTo("/")}>
            <LogoMark />
            <span className="logoWords">
              <span className="logoMain">
                LMCT
              </span>

              <span className="logoSub">
                LUXURY MOTOR CAR TRADER
              </span>
            </span>
          </a>

          <p>
            Discover Your Next Luxury Drive.
          </p>

          <small>
            LMCT is an independent automotive affiliate
            platform and does not own or directly sell the
            vehicles advertised on this website.
          </small>

        </div>

        <div className="footerColumn">

          <h4>
            Explore
          </h4>

          <a {...linkTo("/cars")}>
            Cars
          </a>

          <a {...linkTo("/deals")}>
            Deals
          </a>

          <a {...linkTo("/brands")}>
            Brands
          </a>

          <a {...linkTo("/compare")}>
            Compare
          </a>

        </div>

        <div className="footerColumn">

          <h4>
            Company
          </h4>

          <a {...linkTo("/about")}>
            About
          </a>

          <a {...linkTo("/services")}>
            Services
          </a>

          <a {...linkTo("/blog")}>
            Blog
          </a>

          <a {...linkTo("/partner-with-us")}>
            Partner With Us
          </a>

          <a {...linkTo("/contact")}>
            Contact
          </a>

        </div>

        <div className="footerColumn">

          <h4>
            Legal
          </h4>

          <a {...linkTo("/contact")}>
            Privacy Policy
          </a>

          <a {...linkTo("/contact")}>
            Terms & Conditions
          </a>

          <a {...linkTo("/contact")}>
            Affiliate Disclosure
          </a>

          <a {...linkTo("/contact")}>
            Cookie Policy
          </a>

        </div>

        <div className="copyright">

          <span>
            © 2026 Luxury Motor Car Trader.
            All rights reserved.
          </span>

          <span>
            Find. Explore. Drive.
          </span>

        </div>

      </footer>

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);