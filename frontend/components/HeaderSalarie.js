import React, { useCallback } from "react";
import styles from "../styles/HeaderSociete.module.css"; // Assurez-vous que le chemin du style est correct
import { PoweroffOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

const HeaderSalarie = () => {
  const router = useRouter();

  // Fonction utilitaire pour lire un cookie par son nom
  const getCookie = (name) => {
    if (typeof document === 'undefined') { // Vérification pour Server-Side Rendering (SSR)
      return null;
    }
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(name + "="));
    return cookie ? cookie.split("=")[1] : null;
  };

  // Fonction utilitaire pour supprimer un cookie par son nom.
  const deleteCookie = (name) => {
    if (typeof document !== 'undefined') { // Vérification pour SSR
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  };

  const handleLogout = useCallback(async () => {
    // Étape 1: Récupérer le token principal à envoyer à l'API.
    // Nous supposons ici que 'access_token' (cookie) est le token d'authentification principal.
    const tokenForApi = getCookie("access_token");

    // Étape 2: Tenter la déconnexion côté serveur SI un token est trouvé.
    // Le token est passé à l'endpoint AVANT toute suppression locale.
    if (tokenForApi) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": tokenForApi, // Utilisation du token du cookie
          },
        });

        if (!res.ok) {
          const err = await res.json();
          console.warn(
            "Erreur lors de la déconnexion côté serveur :",
            err.detail || res.statusText
          );
          // Même si la déconnexion serveur échoue, on procède à la déconnexion locale.
        } else {
          console.log("Déconnexion côté serveur réussie.");
        }
      } catch (error) {
        console.error("Erreur réseau lors de la tentative de déconnexion serveur :", error.message);
        // Même en cas d'erreur réseau, on procède à la déconnexion locale.
      }
    } else {
      console.warn("Aucun 'access_token' trouvé dans les cookies. Déconnexion locale uniquement.");
    }

    // Étape 3: Supprimer les tokens localement (APRÈS la tentative d'appel API).
    // Supprime le token du localStorage (s'il est utilisé comme cache ou pour autre chose).
    localStorage.removeItem("token");
    // Supprime le cookie d'authentification principal.
    deleteCookie("access_token");

    // Étape 4: Rediriger l'utilisateur.
    router.push("/auth/login");
  }, [router]); // getCookie et deleteCookie sont stables si définies en dehors ou pures.

  return (
    <header className={styles.headerContainer}>
      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <img src="/logo_alone.png" alt="Logo" className={styles.headerLogo} />
        </div>

        <div className={styles.rightSection}>
          <PoweroffOutlined
            className={styles.icon}
            onClick={handleLogout}
            title="Déconnexion"
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderSalarie;
