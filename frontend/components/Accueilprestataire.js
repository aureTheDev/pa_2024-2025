import React, { useState, useEffect } from "react";
import HeaderSalarie from "./HeaderSalarie";
import Footer from "./Footer";
import NotificationBar from "../components/NotificationBar";
import styles from "../styles/Accueilprestataire.module.css";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaUser,
  FaBriefcase,
  FaCalendarCheck,
  FaHistory,
  FaChartLine,
  FaEnvelope,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { useRouter } from "next/router";

// Fonction pour récupérer un cookie
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
};

const AccueilPrestataire = () => {
  const [contractorData, setContractorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);
  const [note, setNote] = useState(null);
  const router = useRouter();

  // Récupération des données du prestataire
  useEffect(() => {
    const fetchContractorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getCookie("access_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contractor`,
          {
            headers: {
              token,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Erreur HTTP ${response.status}: ${errorData || response.statusText}`);
        }
        const data = await response.json();
        setContractorData(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données du prestataire:", err);
        setError(err.message || "Impossible de charger les informations du prestataire.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractorData();
  }, []);

  // Fonction pour lancer l'onboarding Stripe
  const handleInitiateStripeOnboarding = async () => {
    setIsStripeLoading(true);
    setStripeError(null);
    try {
      const token = getCookie("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/stripe-onboarding`,
        {
          method: "GET",
          headers: {
            token,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("L'URL d'onboarding Stripe n'a pas été reçue.");
      }
    } catch (err) {
      console.error("Erreur lors de l'onboarding Stripe:", err);
      setStripeError(err.message || "Impossible de démarrer la configuration Stripe.");
      setIsStripeLoading(false);
    }
  };

  // Redirige vers la page de configuration du contrat
  const handleContractFileSetup = () => {
    router.push("/prestataires/sign");
  };

  // Fonction pour récupérer la note
  const handleGetNote = async () => {
    try {
      const token = getCookie("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/note`,
        {
          headers: {
            token,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      setNote(data);
    } catch (err) {
      console.error("Erreur lors de la récupération de la note:", err);
      alert(err.message || "Une erreur est survenue lors de la récupération de la note");
    }
  };

  const displayName = contractorData
    ? `${contractorData.firstname || ""} ${contractorData.lastname || ""}`.trim() || "Prestataire"
    : "Chargement...";

  return (
    <div className={styles.layout}>
      <NotificationBar />
      <HeaderSalarie />

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.profile}>
            <img
              src={contractorData?.profile_picture_url || "/user.jpeg"}
              alt="profil"
              className={styles.avatar}
            />
            {loading ? (
              <p>Chargement...</p>
            ) : error ? (
              <p className={styles.errorTextSidebar}>Erreur profil</p>
            ) : (
              <p>{displayName}</p>
            )}
          </div>
          <nav className={styles.menu}>
            <ul className={styles.menuList}>
              <li className={styles.menuItem}>
                <Link href="/prestataires/profile" className={styles.menuLink}>
                  <FaUser className={styles.icon} />
                  <span>Mon profil</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/prestataires/factures" className={styles.menuLink}>
                  <FaBriefcase className={styles.icon} />
                  <span>Mes Factures</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/prestataires/monplanning" className={styles.menuLink}>
                  <FaCalendarCheck className={styles.icon} />
                  <span>Mon planning</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/prestataires/historique" className={styles.menuLink}>
                  <FaHistory className={styles.icon} />
                  <span>Historique</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/prestataires/statistique" className={styles.menuLink}>
                  <FaChartLine className={styles.icon} />
                  <span>Statistiques</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/support/contactForm" className={styles.menuLink}>
                  <FaEnvelope className={styles.icon} />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <div className={styles.content}>
          {!loading && contractorData && contractorData.stripe === false && (
            <motion.div
              className={styles.stripeAlertBox}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FaExclamationTriangle className={styles.alertIcon} />
              <h4>Configuration de Paiement Incomplète</h4>
              <p>
                Votre compte Stripe n'est pas encore actif ou entièrement configuré.
                Veuillez compléter la configuration pour pouvoir recevoir des paiements
                et accéder à toutes les fonctionnalités.
              </p>
              <button
                onClick={handleInitiateStripeOnboarding}
                className={styles.alertLink}
                disabled={isStripeLoading}
              >
                {isStripeLoading ? (
                  <>
                    <FaSpinner className={styles.spinnerIcon} /> Chargement...
                  </>
                ) : (
                  "Configurer mon compte Stripe"
                )}
              </button>
              {stripeError && (
                <p className={styles.stripeErrorMessage}>{stripeError}</p>
              )}
            </motion.div>
          )}

          {!loading && contractorData && contractorData.contract_file === null && (
            <motion.div
              className={styles.stripeAlertBox}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FaExclamationTriangle className={styles.alertIcon} />
              <h4>Contrat à configurer</h4>
              <p>
                Il semble que votre contrat n'ait pas encore été configuré.
                Veuillez compléter la procédure pour finaliser votre inscription.
              </p>
              <button
                onClick={handleContractFileSetup}
                className={styles.alertLink}
              >
                Configurer mon contrat
              </button>
            </motion.div>
          )}

          {loading && (
            <p className={styles.loadingMessage}>Chargement de votre espace...</p>
          )}
          {error && !loading && (
            <p className={`${styles.errorMessage} ${styles.fullPageMessage}`}>{error}</p>
          )}

          {!loading && !error && contractorData && (
            <>
              <motion.div
                className={styles.dashboard_header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1>
                  Bienvenue sur CareConnect
                  {contractorData.firstname ? `, ${contractorData.firstname}` : ""}!
                </h1>
                <p className={styles.tagline}>
                  Votre espace dédié pour gérer vos prestations santé et bien-être.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ textAlign: "center", margin: "40px 0" }}
              >
                <button
                  onClick={handleGetNote}
                  className={styles.getNoteButton}
                  style={{
                    padding: "20px 40px",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    borderRadius: "8px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Get Note
                </button>
                {note !== null && (
                  <div style={{ marginTop: "20px", fontSize: "1.4rem" }}>
                    Note:&nbsp;
                    {typeof note === "object"
                      ? note.detail || JSON.stringify(note)
                      : note}
                  </div>
                )}
              </motion.div>

              <motion.section
                className={styles.aboutsection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <h2>À propos de CareConnect</h2>
              </motion.section>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AccueilPrestataire;