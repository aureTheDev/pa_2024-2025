import React, { useState } from "react";
import styles from "../styles/Conseils.module.css";
import { useRouter } from "next/router";

const conseils = [
  {
    titre: "Sport",
    points: [
      "Écoute ton corps et dors bien",
      "L’échauffement et l’étirement sont essentiels",
      "La régularité avant tout",
      "Pratique progressivement",
      "Hydrate-toi pendant l’effort",
    ],
  },
  {
    titre: "Nourriture",
    points: [
      "Mange équilibré et varié",
      "Hydrate-toi suffisamment",
      "Évite les excès",
      "Prépare tes repas à l'avance",
      "Fruits & légumes chaque jour",
    ],
  },
  {
    titre: "Santé mentale",
    points: [
      "Prends soin de ton sommeil",
      "Gère ton stress",
      "Prends du temps pour toi",
      "Exprime tes émotions",
      "Déconnecte des écrans régulièrement",
    ],
  },
  {
    titre: "Posture & ergonomie",
    points: [
      "Adapte ton poste de travail",
      "Fais des pauses régulières",
      "Utilise une chaise ergonomique",
      "Ajuste la hauteur de ton écran",
      "Change de position régulièrement",
    ],
  },
  {
    titre: "Hygiène de vie",
    points: [
      "Dors au moins 7h par nuit",
      "Évite les écrans avant de dormir",
      "Mange à heures régulières",
      "Expose-toi à la lumière naturelle",
      "Évite les stimulants le soir",
    ],
  },
  {
    titre: "Activité sociale",
    points: [
      "Participe à des activités collectives",
      "Reste en lien avec tes proches",
      "Exprime tes ressentis",
      "Accepte de demander de l’aide",
      "Partage tes réussites",
    ],
  },
  {
    titre: "Productivité au travail",
    points: [
      "Planifie ta journée",
      "Fais des pauses toutes les 90 minutes",
      "Évite le multitâche",
      "Fixe-toi des objectifs clairs",
      "Délègue si possible",
    ],
  },
  {
    titre: "Équilibre pro/perso",
    points: [
      "Déconnecte en dehors du travail",
      "Respecte tes horaires",
      "Aménage un vrai espace de pause",
      "Fais du sport après le boulot",
      "Prévois des moments pour toi",
    ],
  },
];

const Conseils = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const router = useRouter();

  const handleRetour = () => {
    router.push("/salaries/accueil");
  };
  return (
    <div className={styles.page}>
      <img
        src="/back_icon.png"
        alt="go back"
        className={styles.icon_back}
        onClick={handleRetour}
        style={{ cursor: "pointer" }}
      />
      <h1 className={styles.title}>💡 Nos conseils bien-être</h1>

      <div className={styles.flexContainer}>
        {activeIndex !== null && (
          <div className={`${styles.card} ${styles.verticalCard}`}>
            <h3>{conseils[activeIndex].titre}</h3>
            <ul>
              {conseils[activeIndex].points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <button
              className={styles.link}
              onClick={() => setActiveIndex(null)}
            >
              ← Voir moins
            </button>
          </div>
        )}

        <div
          className={`${styles.grid} ${
            activeIndex !== null ? styles.shrunkGrid : ""
          }`}
        >
          {conseils.map((c, i) =>
            i === activeIndex ? null : (
              <div className={styles.card} key={i}>
                <h3>{c.titre}</h3>
                <ul>
                  {c.points.slice(0, 3).map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ul>
                <button
                  className={styles.link}
                  onClick={() => setActiveIndex(i)}
                >
                  Voir plus →
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Conseils;
