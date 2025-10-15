import React, { useEffect, useState } from "react";
import style from "../styles/Accueilsociete.module.css";
import CustomHeader from "./HeaderSociete";
import CustomFooter from "./Footer";
import { useRouter } from "next/router";


const getCookie = (cookieName) => {
  if (typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
  return cookie ? cookie.split("=")[1] : null;
};

const Dashboard = () => {
  const router = useRouter();

  const [stats, setStats] = useState({
    contracts: 0,
    salaries: 0,
    factures: 0,
    devis: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = getCookie("access_token");
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/company/stats`,
          {
            headers: { token },
          }
        );

        if (!res.ok) throw new Error("Erreur lors du chargement");

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  const handleAddSalarie = () => {
    router.push("/societes/salaries/edit/new");
  };

  const handleAddDevis = () => {
    router.push("/societes/devis/new");
  };

  return (
    <div className={style["dashboard-container"]}>
      <CustomHeader />
      <header className={style["dashboard-header"]}>
        <h1>Bienvenue sur Business Care</h1>
        <p className={style["tagline"]}>
          Votre partenaire santé & bien-être en entreprise
        </p>
      </header>

      <section className={style["stats-section"]}>
        <div
          className={style["stat-card"]}
          onClick={() => router.push("/societes/contrats")}
        >
          <h3>Contrats</h3>
          <p>{stats.contracts}</p>
        </div>

        <div
          className={style["stat-card"]}
          onClick={() => router.push("/societes/salaries")}
        >
          <h3>Salariés</h3>
          <p>{stats.salaries}</p>
        </div>

        <div
          className={style["stat-card"]}
          onClick={() => router.push("/societes/factures")}
        >
          <h3>Factures</h3>
          <p>{stats.factures}</p>
        </div>

        <div
          className={style["stat-card"]}
          onClick={() => router.push("/societes/devis")}
        >
          <h3>Devis</h3>
          <p>{stats.devis}</p>
        </div>
      </section>

      <section className={style["quick-action"]}>
        <button onClick={handleAddSalarie}>Ajouter un salarié</button>
        <button onClick={handleAddDevis}>Créer une devis</button>
      </section>

      <section className={style["quote"]}>
        <blockquote>
          "La santé en entreprise est la clé de la performance durable."
        </blockquote>
      </section>

      <section className={style["about-section"]}>
        <h2>Qui sommes-nous ?</h2>
        <p>
          Business Care est une plateforme innovante dédiée à la gestion des
          services de santé en entreprise. Nous facilitons la coordination entre
          les employeurs, salariés, et prestataires.
        </p>
      </section>

      <CustomFooter />
    </div>
  );
};

export default Dashboard;
