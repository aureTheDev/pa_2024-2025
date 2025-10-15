import React, { useState, useEffect } from "react";
import styles from "../styles/ProfilePrestataire.module.css";
import { FaLock, FaSave } from "react-icons/fa";
import { useRouter } from "next/router";

const ProfilePrestataire = () => {
  const router = useRouter();
  // Suppression de l'état "user" initialisé avec des données statiques
  // On utilise directement "contractor" pour gérer les données récupérées
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const getCookie = (cookieName) => {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
    return cookie ? cookie.split("=")[1] : null;
  };

  const removeCookie = (cookieName) => {
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  };

  useEffect(() => {
    const fetchContractorData = async () => {
      setLoading(true);
      setError(null);

      const token = getCookie("access_token");
      if (!token) {
        setError("Token d'authentification manquant.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contractor`, {
          method: "GET",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            detail: "Erreur inconnue lors de la lecture de la réponse.",
          }));
          throw new Error(
            `Erreur HTTP ${response.status}: ${errorData.detail || response.statusText}`
          );
        }

        const data = await response.json();
        setContractor(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données prestataire :", err);
        setError(err.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractorData();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      alert("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword === currentPassword) {
      alert("Le nouveau mot de passe doit être différent de l'ancien.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Les nouveaux mots de passe doivent être identiques.");
      return;
    }

    const token = getCookie("access_token");
    if (!token) {
      alert("Token d'authentification manquant.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contractor/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          token: token,
        },
        body: JSON.stringify({
          password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.status === 204) {
        alert("Mot de passe mis à jour. Votre session est révoquée, veuillez vous reconnecter.");
        removeCookie("access_token");
        localStorage.removeItem("token");
        router.push("/auth/login");
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || "Erreur lors de la mise à jour du mot de passe.");
      } else {
        alert("Mot de passe mis à jour avec succès.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(false);
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la mise à jour du mot de passe.");
    }
  };

  const handleRetour = () => {
    router.push("/prestataires/accueil");
  };

  return (
    <div className={styles.body}>
      <img
        src="/back_icon.png"
        alt="Retour"
        className={styles.icon_back}
        onClick={handleRetour}
        style={{ cursor: "pointer" }}
      />
      <div className={styles.container}>
        <h1 className={styles.title}>👤 Mon Profil Prestataire</h1>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p style={{ color: "red" }}>Erreur: {error}</p>
        ) : contractor ? (
          <div className={styles.profileBox}>
            <div className={styles.row}>
              <strong>Nom:</strong> {contractor.lastname}
            </div>
            <div className={styles.row}>
              <strong>Prénom:</strong> {contractor.firstname}
            </div>
            <div className={styles.row}>
              <strong>Date de naissance:</strong> {contractor.dob}
            </div>
            <div className={styles.row}>
              <strong>Téléphone:</strong> {contractor.phone}
            </div>
            <div className={styles.row}>
              <strong>Email:</strong> {contractor.email}
            </div>
            <div className={styles.row}>
              <strong>Pays:</strong> {contractor.country}
            </div>
            <div className={styles.row}>
              <strong>Ville:</strong> {contractor.city}
            </div>
            <div className={styles.row}>
              <strong>Rue:</strong> {contractor.street}
            </div>
            <div className={styles.row}>
              <strong>Code postal:</strong> {contractor.pc}
            </div>
            <div className={styles.row}>
              <strong>Inscrit le:</strong> {contractor.inscription_date}
            </div>
            <div className={styles.row}>
              <strong>Vérifié:</strong> {contractor.verified ? "✅ Oui" : "❌ Non"}
            </div>
            <div className={styles.actions}>
              <button onClick={() => setShowPasswordChange(true)} className={styles.passwordBtn}>
                <FaLock /> Changer mot de passe
              </button>
            </div>

            {showPasswordChange && (
              <form className={styles.passwordChangeBox} onSubmit={handlePasswordChange}>
                <label>
                  Mot de passe actuel:
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </label>
                <label>
                  Nouveau mot de passe:
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirmer le nouveau mot de passe:
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
                <button type="submit" className={styles.saveBtn}>
                  <FaSave /> Mettre à jour
                </button>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfilePrestataire;