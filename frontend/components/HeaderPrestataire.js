import { useState, useCallback } from "react";
import { Layout, Drawer, Menu } from "antd";
import {
  MenuOutlined,
  // UserOutlined, // Semble non utilisé, peut être supprimé si ce n'est pas le cas
  SearchOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import styles from "../styles/HeaderPrestataire.module.css"; // Assurez-vous que le chemin est correct
import { useRouter } from "next/router";

const { Header } = Layout;

const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Fonction utilitaire pour lire un cookie par son nom
  const getCookie = (name) => {
    if (typeof document === 'undefined') { // Vérification pour SSR
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
    console.log("Déconnexion demandée...");
    // Étape 1: Récupérer le token principal à envoyer à l'API.
    const tokenForApi = getCookie("access_token"); // Supposons que 'access_token' est le nom du cookie

    // Étape 2: Tenter la déconnexion côté serveur SI un token est trouvé.
    if (tokenForApi) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, { // Assurez-vous que l'URL est correcte
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": tokenForApi,
          },
        });

        if (!res.ok) {
          const err = await res.json();
          console.warn(
            "Erreur lors de la déconnexion côté serveur :",
            err.detail || res.statusText
          );
        } else {
          console.log("Déconnexion côté serveur réussie.");
        }
      } catch (error) {
        console.error("Erreur réseau lors de la tentative de déconnexion serveur :", error.message);
      }
    } else {
      console.warn("Aucun 'access_token' trouvé dans les cookies pour la déconnexion serveur.");
    }

    // Étape 3: Supprimer les tokens localement (APRÈS la tentative d'appel API).
    localStorage.removeItem("token"); // Si vous utilisez aussi localStorage pour un token
    deleteCookie("access_token"); // Nom du cookie principal

    // Étape 4: Rediriger l'utilisateur vers la page de connexion.
    router.push("/auth/login"); // Ajustez le chemin si nécessaire
  }, [router]); // getCookie et deleteCookie sont stables si définies en dehors ou pures.


  const showDrawer = () => {
    setMenuOpen(true);
  };

  const closeDrawer = () => {
    setMenuOpen(false);
  };

  // Gérer le clic sur les items du menu
  const handleMenuClick = (e) => {
    if (e.key === "logout") {
      handleLogout();
    } else if (e.key === 'profil') {
      router.push('/profil'); // Exemple de navigation
    } else if (e.key === 'planning') {
      router.push('/planning'); // Exemple de navigation
    }
    // ... autres cas pour la navigation
    closeDrawer(); // Fermer le drawer après un clic
  };

  return (
    <Header className={styles.headerContainer}>
      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <img src="/logo_alone.png" alt="Logo" className={styles.headerLogo} />
          <span className={styles.logoText}>CareConnect</span>
        </div>

        <div className={styles.centerSection}>
          <input
            type="text"
            placeholder="Rechercher..."
            className={styles.searchBar}
          />
          <SearchOutlined className={styles.iconSearch} /> {/* Style potentiellement différent pour l'icône de recherche */}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.leftSectionInBottomBar}> {/* Classe spécifique si besoin de styliser différemment */}
          <MenuOutlined className={styles.menuIcon} onClick={showDrawer} />
        </div>
        <div className={styles.rightSectionInBottomBar}> {/* Classe spécifique si besoin de styliser différemment */}
          <LogoutOutlined
            className={styles.iconLogout} // Style potentiellement différent pour l'icône de déconnexion
            onClick={handleLogout}
            title="Déconnexion"
          />
        </div>
      </div>

      <Drawer
        title="Menu Prestataire"
        placement="left"
        onClose={closeDrawer}
        open={menuOpen}
        width={250}
        // bodyStyle={{ padding: 0 }} // Si vous voulez que le Menu prenne toute la place
      >
        <Menu
          mode="vertical"
          onClick={handleMenuClick} // Utiliser onClick sur le Menu pour gérer tous les items
          className="customMenu" // Assurez-vous que ce style est défini globalement ou importé
        >
          <Menu.Item key="profil">Profil</Menu.Item>
          <Menu.Item key="planning">Mon planning</Menu.Item>
          <Menu.Item key="factures">Factures</Menu.Item>
          <Menu.Item key="prestations">Prestations</Menu.Item>
          <Menu.Item key="notes">Mes notes</Menu.Item>
          <Menu.Divider />
          <Menu.Item key="logout" icon={<LogoutOutlined />}>
            Déconnexion
          </Menu.Item>
        </Menu>
      </Drawer>
    </Header>
  );
};

export default Dashboard;
