import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/VerifyEmail.module.css"; // Assurez-vous que ce fichier existe et est stylisé
import { useRouter } from "next/router";

// Fonction pour récupérer un cookie par son nom
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Fonction pour supprimer un cookie
const deleteCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

// Fonction pour nettoyer le stockage local et de session et les cookies
const clearUserSession = () => {
  deleteCookie("access_token");
  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
  }
};

const VerifyEmail = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [infoMessage, setInfoMessage] = useState("Préparation de la vérification...");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);

  const router = useRouter();

  const startResendCountdown = () => {
    setCanResend(false);
    setCountdown(60);
  };

  // Effet pour envoyer l'e-mail de vérification au montage
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token) {
      console.log("Aucun token trouvé, redirection vers login.");
      clearUserSession();
      const message = encodeURIComponent("Session expirée ou invalide. Veuillez vous reconnecter.");
      router.push(`/auth/login?notificationMessage=${message}&notificationType=warning`);
      return;
    }

    const sendVerificationEmail = async () => {
      setInfoMessage("Envoi du code de vérification à votre adresse e-mail...");
      setError(null);
      setSuccessMessage("");
      setIsCodeInvalid(false);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send_verif_email`, {
          method: "POST",
          headers: {
            token: token,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 400 && data?.detail === "User already verified") {
            setError("Votre e-mail est déjà vérifié. Vous allez être redirigé.");
            setInfoMessage("");
            clearUserSession();
            const message = encodeURIComponent("Votre compte est déjà vérifié. Vous pouvez vous connecter.");
            setTimeout(() => router.push(`/auth/login?notificationMessage=${message}&notificationType=info`), 3000);
          } else {
            setError(data?.detail || "Erreur lors de l'envoi du code de vérification.");
            setInfoMessage("");
            setCanResend(true);
          }
        } else {
          setInfoMessage("Un code de vérification a été envoyé à votre adresse e-mail.");
          setVerificationSent(true);
          startResendCountdown();
        }
      } catch (error) {
        console.error("Erreur API envoi code:", error);
        setError("Une erreur réseau est survenue lors de l'envoi du code.");
        setInfoMessage("");
        setCanResend(true);
      }
    };

    sendVerificationEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Retrait de router des dépendances si sendVerificationEmail ne l'utilise pas directement pour éviter boucle

  // Gestion du compte à rebours
  useEffect(() => {
    if (!verificationSent || countdown <= 0) {
      if (verificationSent && countdown <= 0) { // S'assurer que canResend devient true uniquement quand le countdown est fini
          setCanResend(true);
      }
      if (countdown < 0) setCountdown(0); // S'assurer que le compte à rebours ne devient pas négatif
      return;
    }

    setCanResend(false);
    const timerId = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [countdown, verificationSent]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(value);
    if (error) setError(null);
    if (isCodeInvalid) setIsCodeInvalid(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Veuillez saisir les 6 chiffres du code de vérification.");
      setIsCodeInvalid(true);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    setInfoMessage("");

    const token = getCookie("access_token");
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      clearUserSession();
      const message = encodeURIComponent("Session expirée ou invalide. Veuillez vous reconnecter.");
      setTimeout(() => router.push(`/auth/login?notificationMessage=${message}&notificationType=warning`), 3000);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token,
        },
        body: JSON.stringify({ code: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsCodeInvalid(false);
        if (response.status === 400 && data?.detail === "User already verified") {
          setError("Votre compte est déjà vérifié. Redirection...");
          clearUserSession();
          const message = encodeURIComponent("Votre compte est déjà vérifié. Vous pouvez vous connecter.");
          setTimeout(() => router.push(`/auth/login?notificationMessage=${message}&notificationType=info`), 3000);
        } else if (response.status === 403 && data?.detail === "Verification failed") {
          setError("Code de vérification incorrect. Veuillez réessayer.");
          setIsCodeInvalid(true);
        } else {
          setError(data?.detail || "Échec de la vérification. Veuillez réessayer.");
          setCode("");
        }
      } else {
        setSuccessMessage("Votre compte a été vérifié avec succès ! Vous allez être redirigé.");
        clearUserSession();
        setIsCodeInvalid(false);
        // Redirection avec le paramètre 'verified=true'
        setTimeout(() => router.push('/auth/login?verified=true'), 3000);
      }
    } catch (err) {
      console.error("Erreur API verification:", err);
      setError("Une erreur réseau est survenue lors de la vérification.");
      setIsCodeInvalid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError(null);
    setSuccessMessage("");
    setInfoMessage("Renvoi du code en cours...");
    setIsCodeInvalid(false);

    const token = getCookie("access_token");
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      clearUserSession();
      setResendLoading(false);
      const message = encodeURIComponent("Session expirée ou invalide. Veuillez vous reconnecter.");
      setTimeout(() => router.push(`/auth/login?notificationMessage=${message}&notificationType=warning`), 3000);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send_verif_email`, {
        method: "POST",
        headers: {
          token: token,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data?.detail === "User already verified") {
          setError("Votre e-mail est déjà vérifié. Redirection...");
          clearUserSession();
          const message = encodeURIComponent("Votre compte est déjà vérifié. Vous pouvez vous connecter.");
          setTimeout(() => router.push(`/auth/login?notificationMessage=${message}&notificationType=info`), 3000);
        } else {
          setError(data?.detail || "Erreur lors du renvoi du code.");
          setCanResend(true); // Permettre un nouvel essai si l'erreur n'est pas "déjà vérifié"
        }
        setInfoMessage("");
      } else {
        setInfoMessage("Un nouveau code a été envoyé à votre adresse e-mail.");
        setVerificationSent(true); // S'assurer que verificationSent est toujours vrai
        startResendCountdown();
      }
    } catch (err) {
      console.error("Erreur API renvoi code:", err);
      setError("Une erreur réseau est survenue lors du renvoi du code.");
      setInfoMessage("");
      setCanResend(true); // Permettre un nouvel essai en cas d'erreur réseau
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = (e) => {
    e.preventDefault();
    clearUserSession();
    router.push("/auth/login"); // Redirection simple, pas de message spécifique par défaut
  };

  // État de chargement initial avant le premier envoi de l'e-mail
  if (!error && !successMessage && !verificationSent && infoMessage === "Préparation de la vérification...") {
      return (
          <div className={styles.container}>
              <div className={styles.card}>
                  <h1 className={styles.title}>Vérification de l'E-mail</h1>
                  <p className={styles.infoMessage}>{infoMessage}</p> {/* Afficher "Préparation..." */}
              </div>
          </div>
      );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Vérification de l'E-mail</h1>

        {/* Afficher infoMessage seulement s'il n'y a pas d'erreur ou de message de succès prioritaire */}
        {infoMessage && !error && !successMessage && <p className={styles.infoMessage}>{infoMessage}</p>}
        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

        {/* Afficher le formulaire si un email a été envoyé, qu'il n'y a pas de message de succès final,
            et (qu'il n'y a pas d'erreur OU que l'erreur est juste un code invalide, permettant la resaisie) */}
        {verificationSent && !successMessage && (!error || isCodeInvalid) && (
          <>
            <p className={styles.instructions}>
              Veuillez saisir le code à 6 chiffres envoyé à votre adresse e-mail.
            </p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                id="verification-code"
                type="tel" // "tel" est bon pour les codes numériques, meilleur clavier sur mobile
                inputMode="numeric"
                pattern="\d{6}" // Pattern pour la validation HTML5 (optionnel car on valide en JS)
                maxLength="6"
                value={code}
                onChange={handleCodeChange}
                className={`${styles.codeInputSingle} ${isCodeInvalid ? styles.codeInputSingleError : ''}`}
                placeholder="______" // Visuellement indique 6 chiffres
                aria-label="Code de vérification à 6 chiffres"
                autoComplete="one-time-code" // Aide les navigateurs/gestionnaires de mots de passe à suggérer les codes reçus par SMS/email
                required
                disabled={loading || resendLoading} // Désactiver si une action est en cours
              />
              <button
                type="submit"
                className={styles.button}
                disabled={loading || code.length !== 6 || resendLoading}
              >
                {loading ? "Vérification..." : "Vérifier le Code"}
              </button>
            </form>
            <div className={styles.resendContainer}>
              <button
                onClick={handleResendCode}
                className={styles.resendButton}
                disabled={resendLoading || !canResend}
              >
                {resendLoading
                  ? "Renvoi en cours..."
                  : canResend
                  ? "Renvoyer le code"
                  : `Renvoyer le code dans ${countdown}s`}
              </button>
            </div>
          </>
        )}

        {/* Cas où l'envoi initial n'a pas eu lieu (ex: l'utilisateur est déjà vérifié dès le chargement)
            ET qu'il n'y a pas d'erreur et pas de message de succès (qui sont gérés au-dessus)
            ET que infoMessage n'est plus "Préparation..." (car géré par le return conditionnel plus haut)
            Ce bloc pourrait afficher un message si l'envoi initial a échoué avant même d'afficher le formulaire.
        */}
        {!verificationSent && !error && !successMessage && infoMessage !== "Préparation de la vérification..." && (
             <div className={styles.loadingInitial}> {/* Peut-être renommer ce style si ce n'est plus un "loading" */}
                <p>{infoMessage}</p>
            </div>
        )}

        <p className={styles.backToLogin}>
          Une erreur ou déjà vérifié ?{" "}
          <a href="/auth/login" onClick={handleBackToLogin}>
            Retour à la connexion
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
