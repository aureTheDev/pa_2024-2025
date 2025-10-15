import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "antd";
import styles from "../styles/auth.module.css";
import CustomFooter from "./Footer";

const { Header, Content } = Layout;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // État pour la notification
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Fonction pour décoder la charge utile du token JWT
  const decodeJwtPayload = (token) => {
    try {
      const base64Payload = token.split(".")[1];
      const jsonPayload = atob(
        base64Payload.replace(/-/g, "+").replace(/_/g, "/")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to decode JWT:", e);
      return null; // Gérer l'erreur de décodage
    }
  };

  // Fonction pour récupérer un cookie par son nom
  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Effet pour gérer les notifications via les paramètres d'URL
  useEffect(() => {
    if (!router.isReady) return; // S'assurer que router.query est disponible

    const { verified, notificationMessage, notificationType } = router.query;
    let messageToShow = "";
    let messageType = "info"; // Type par défaut

    if (verified === "true") {
      messageToShow = "Votre adresse e-mail a été vérifiée avec succès ! Vous pouvez maintenant vous connecter.";
      messageType = "success";
    } else if (notificationMessage && notificationType) {
      messageToShow = decodeURIComponent(String(notificationMessage));
      messageType = String(notificationType);
    }

    if (messageToShow) {
      setNotification({ message: messageToShow, type: messageType });

      // Nettoyer les paramètres de l'URL pour qu'ils ne persistent pas
      const currentPath = router.pathname;
      const queryWithoutNotificationParams = { ...router.query };
      delete queryWithoutNotificationParams.verified;
      delete queryWithoutNotificationParams.notificationMessage;
      delete queryWithoutNotificationParams.notificationType;

      router.replace(
        { pathname: currentPath, query: queryWithoutNotificationParams },
        undefined,
        { shallow: true } // shallow: true évite de relancer getServerSideProps/getInitialProps
      );

      // Faire disparaître la notification après quelques secondes
      const timer = setTimeout(() => {
        setNotification({ message: "", type: "" });
      }, 7000); // 7 secondes

      return () => clearTimeout(timer); // Nettoyage du timer si le composant est démonté
    }
  }, [router.isReady, router.query, router.pathname, router]); // Dépendances de l'effet

  // Vérification au chargement si le cookie existe déjà et redirection immédiate
  useEffect(() => {
    const token = getCookie("access_token");
    if (token) {
      try {
        const payload = decodeJwtPayload(token);
        if (!payload) { // Si le décodage échoue
          // Optionnel: supprimer le cookie invalide ici
          document.cookie = "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          return; // Ne pas rediriger, laisser l'utilisateur se connecter
        }

        if (!payload.verified) {
          router.push("/auth/verify");
          return;
        }
        const userRole = payload.function;

        switch (userRole) {
          case "company":
            router.push("/societes/accueil");
            break;
          case "collaborator":
            router.push("/salaries/accueil");
            break;
          case "contractor":
            router.push("/prestataires/accueil");
            break;
          case "administrator":
            router.push("/admin/accueil");
            break;
          default:
            // Ne pas afficher d'alerte ici, laisser l'utilisateur sur la page de connexion
            // s'il y a un rôle inconnu ou si on veut forcer une reconnexion.
            // Pourrait être une suppression de cookie et retour.
            console.warn("Rôle inconnu ou redirection non gérée:", userRole);
        }
      } catch (err) {
        console.error("Erreur lors du traitement du token existant:", err);
        // En cas d'erreur (ex: token malformé), on pourrait vouloir supprimer le cookie
        document.cookie = "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotification({ message: "", type: "" }); // Cacher la notification au début de la tentative de connexion

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur de connexion");

      const { token } = data;

      localStorage.setItem("token", token);
      document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax; Secure`; // Ajout de Secure (pour HTTPS)

      const payload = decodeJwtPayload(token);
      if (!payload) {
        throw new Error("Impossible de décoder les informations utilisateur depuis le token.");
      }


      if (!payload.verified) {
        router.push("/auth/verify"); // Rediriger vers la vérification si non vérifié
        return;
      }

      const userRole = payload.function;
      switch (userRole) {
        case "company":
          router.push("/societes/accueil");
          break;
        case "collaborator":
          router.push("/salaries/accueil");
          break;
        case "contractor":
          router.push("/prestataires/accueil");
          break;
        case "administrator":
          router.push("/admin/accueil");
          break;
        default:
          setNotification({ message: "Rôle utilisateur inconnu. Veuillez contacter un administrateur.", type: "error"});
      }
    } catch (err) {
      setNotification({ message: err.message || "Une erreur est survenue.", type: "error"});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className={styles.layout}>
      <Header className={styles.adminHeader}>
        <div className={styles.leftSection}>
          <img src="/logo_alone.png" alt="Logo" className={styles.headerLogo} />
          <span className={styles.logoText}>CareConnect</span>
        </div>
      </Header>

      <Content className={styles.content}>
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            {/* Emplacement de la notification */}
            {notification.message && (
              <div className={`${styles.notificationBox} ${styles[notification.type]}`}>
                {notification.message}
              </div>
            )}

            <h2>Connexion</h2>

            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Adresse mail d’utilisateur
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={styles.input}
                  placeholder="Email d’utilisateur"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Mot de passe :
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={styles.input}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className={styles.createAccount}>
              C'est votre première connexion ?{" "}
              <a href="/auth/usertype">Créer un compte</a>
            </p>
            <p className={styles.changePassword}>
              Mot de passe oublié ?{" "}
              <a href="/auth/forgot_password_demand">Changer le mot de passe</a> {/* J'imagine que usertype n'est pas pour changer mdp */}
            </p>
          </div>
        </div>
      </Content>

      <CustomFooter />
    </Layout>
  );
}