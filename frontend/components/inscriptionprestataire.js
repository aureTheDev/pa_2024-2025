// InscriptionPrestataire.js

import React, { useState } from "react";
import { useRouter } from "next/router"; // Assurez-vous que useRouter est importé
import { Layout, message } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import styles from "../styles/inscriptionprestataire.module.css";
import CustomFooter from "./Footer";

const { Header, Content } = Layout;

// Fonction pour décoder la charge utile du token JWT (copiée depuis Login.js)
const decodeJwtPayload = (token) => {
  try {
    const base64Payload = token.split(".")[1];
    const jsonPayload = atob(
      base64Payload.replace(/-/g, "+").replace(/_/g, "/")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Erreur lors du décodage du token:", e);
    return null; // Retourner null ou lever une erreur selon la gestion souhaitée
  }
};

const InscriptionPrestataire = () => {
  const router = useRouter(); // Initialisation de useRouter
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    dob: "",
    registration_number: "",
    registration_date: "",
    country: "",
    city: "",
    street: "",
    pc: "",
    website: "",
    email: "",
    phone: "",
    type: "",
    service: "",
    intervention: "",
    service_price: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Ajout de l'état de chargement

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const formErrors = {};
    const required = [
      "firstname",
      "lastname",
      "dob",
      "registration_number",
      "registration_date",
      "country",
      "city",
      "street",
      "pc",
      "email",
      "phone",
      "type",
      "service",
      "intervention",
      "service_price",
      "password",
      "confirmPassword",
    ];
    required.forEach((f) => {
      if (!formData[f] || String(formData[f]).trim() === "") {
        formErrors[f] = "Ce champ est obligatoire.";
      }
    });
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      formErrors.confirmPassword = "Les mots de passe doivent correspondre.";
    }
    if (
      formData.service_price &&
      isNaN(parseInt(formData.service_price, 10))
    ) {
      formErrors.service_price = "Le prix doit être un nombre.";
    }
    if (!formData.acceptTerms) {
      formErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation.";
    }
    return formErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      const fields = Object.keys(formErrors)
        .map((key) => {
          // Optionnel: rendre les noms de champs plus conviviaux
          const fieldNameMap = {
            firstname: "Prénom",
            lastname: "Nom",
            dob: "Date de naissance",
            registration_number: "Numéro d'enregistrement",
            registration_date: "Date d'enregistrement",
            country: "Pays",
            city: "Ville",
            street: "Rue",
            pc: "Code postal",
            email: "Email",
            phone: "Téléphone",
            type: "Type de prestataire",
            service: "Service",
            intervention: "Intervention",
            service_price: "Prix du service",
            password: "Mot de passe",
            confirmPassword: "Confirmation du mot de passe",
            acceptTerms: "Conditions d'utilisation"
          };
          return fieldNameMap[key] || key;
        })
        .join(", ");
      message.error(`Veuillez corriger les champs: ${fields}.`);
      return;
    }

    setLoading(true); // Début du chargement

    try {
      const { confirmPassword, acceptTerms, ...payload } = formData;
      payload.service_price = parseInt(payload.service_price, 10);
      if (payload.website.trim() === "") {
        payload.website = null;
      }
      payload.role = "contractor"; // Rôle défini comme demandé

      console.log("Payload final envoyé :", payload);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (res.ok) {
        message.success(
          "Votre compte a été créé avec succès ! Merci de vérifier votre email."
        );

        // --- Début de l'intégration de la gestion du token ---
        const { token } = data;

        if (token) {
          localStorage.setItem("token", token);
          document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`; // 86400s = 1 jour

          // Optionnel: décoder pour vérifier ou utiliser des infos, mais pour l'inscription,
          // on redirige directement vers la vérification email.
          // const decodedTokenPayload = decodeJwtPayload(token);
          // console.log("Payload du token après inscription:", decodedTokenPayload);

          // Redirection vers la page de vérification d'email
          // S'assurer que le chemin est correct, celui de Login.js est /auth/emailVerify
          router.push("/auth/verify");
        } else {
          // Gérer le cas où le token n'est pas retourné malgré une réponse OK
          console.error("Token non reçu après inscription réussie.");
          message.error("Inscription réussie, mais problème pour initialiser la session. Veuillez vous reconnecter.");
          router.push("/auth/login"); // Rediriger vers login si pas de token
        }
        // --- Fin de l'intégration de la gestion du token ---

      } else {
        console.error("Erreur backend (raw):", data);
        if (Array.isArray(data.detail)) {
          const msgs = data.detail.map(
            (err) => `${err.loc.slice(1).join(".") || "error"}: ${err.msg}`
          );
          message.error(msgs.join(" • "));
        } else if (data.detail && typeof data.detail === 'string') { // Gestion de Pydantic error str
          message.error(data.detail);
        }
        else {
          message.error(
            data.message ||
              "Une erreur est survenue lors de la création du compte."
          );
        }
      }
    } catch (err) {
      console.error("Erreur réseau ou JS :", err);
      message.error("Une erreur est survenue lors de la création du compte.");
    } finally {
      setLoading(false); // Fin du chargement
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
        <div className={styles.container}>
          <h2 className={styles.title}>Inscription Prestataire</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Prénom */}
            <label className={styles.label}>
              Prénom *
              {errors.firstname && (
                <span className={styles.error}> {errors.firstname}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.firstname ? styles.inputError : ''}`}
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
            />

            {/* Nom */}
            <label className={styles.label}>
              Nom *
              {errors.lastname && (
                <span className={styles.error}> {errors.lastname}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.lastname ? styles.inputError : ''}`}
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
            />

            {/* Date de naissance */}
            <label className={styles.label}>
              Date de naissance *
              {errors.dob && (
                <span className={styles.error}> {errors.dob}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.dob ? styles.inputError : ''}`}
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />

            {/* Numéro d'enregistrement */}
            <label className={styles.label}>
              Numéro d'enregistrement *
              {errors.registration_number && (
                <span className={styles.error}>
                  {" "}
                  {errors.registration_number}
                </span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.registration_number ? styles.inputError : ''}`}
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
            />

            {/* Date d'enregistrement */}
            <label className={styles.label}>
              Date d'enregistrement *
              {errors.registration_date && (
                <span className={styles.error}>
                  {" "}
                  {errors.registration_date}
                </span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.registration_date ? styles.inputError : ''}`}
              type="date"
              name="registration_date"
              value={formData.registration_date}
              onChange={handleChange}
            />

            {/* Pays */}
            <label className={styles.label}>
              Pays *
              {errors.country && (
                <span className={styles.error}> {errors.country}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.country ? styles.inputError : ''}`}
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />

            {/* Ville */}
            <label className={styles.label}>
              Ville *
              {errors.city && (
                <span className={styles.error}> {errors.city}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />

            {/* Rue */}
            <label className={styles.label}>
              Rue *
              {errors.street && (
                <span className={styles.error}> {errors.street}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.street ? styles.inputError : ''}`}
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
            />

            {/* Code postal */}
            <label className={styles.label}>
              Code postal *
              {errors.pc && (
                <span className={styles.error}> {errors.pc}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.pc ? styles.inputError : ''}`}
              type="text"
              name="pc"
              value={formData.pc}
              onChange={handleChange}
            />

            {/* Site web */}
            <label className={styles.label}>Site web</label>
            <input
              className={styles.input} // Pas de validation d'erreur spécifique car optionnel
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />

            {/* Email */}
            <label className={styles.label}>
              Email *
              {errors.email && (
                <span className={styles.error}> {errors.email}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

            {/* Téléphone */}
            <label className={styles.label}>
              Téléphone *
              {errors.phone && (
                <span className={styles.error}> {errors.phone}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+33XXXXXXXXX"
            />

            {/* Type de prestataire */}
            <label className={styles.label}>
              Type de prestataire *
              {errors.type && (
                <span className={styles.error}> {errors.type}</span>
              )}
            </label>
            <select
              className={`${styles.input} ${errors.type ? styles.inputError : ''}`}
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="">-- Sélectionnez --</option>
              <option value="Medical">Medical</option>
              <option value="Healthy">Healthy</option>
            </select>

            {/* Service */}
            <label className={styles.label}>
              Service *
              {errors.service && (
                <span className={styles.error}> {errors.service}</span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.service ? styles.inputError : ''}`}
              type="text"
              name="service"
              value={formData.service}
              onChange={handleChange}
            />

            {/* Intervention */}
            <label className={styles.label}>
              Intervention *
              {errors.intervention && (
                <span className={styles.error}>
                  {" "}
                  {errors.intervention}
                </span>
              )}
            </label>
            <select
              className={`${styles.input} ${errors.intervention ? styles.inputError : ''}`}
              name="intervention"
              value={formData.intervention}
              onChange={handleChange}
            >
              <option value="">-- Sélectionnez --</option>
              <option value="incall">Présentiel</option>
              <option value="outcall">Distanciel</option>
              <option value="both">Présentiel et distanciel</option>
            </select>

            {/* Prix du service */}
            <label className={styles.label}>
              Prix du service (€) *
              {errors.service_price && (
                <span className={styles.error}>
                  {" "}
                  {errors.service_price}
                </span>
              )}
            </label>
            <input
              className={`${styles.input} ${errors.service_price ? styles.inputError : ''}`}
              type="number"
              name="service_price"
              value={formData.service_price}
              onChange={handleChange}
              min="1"
            />

            {/* Mot de passe */}
            <label className={styles.label}>
              Mot de passe *
              {errors.password && (
                <span className={styles.error}> {errors.password}</span>
              )}
            </label>
            <div className={`${styles.passwordWrapper} ${errors.password ? styles.inputError : ''}`}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>

            {/* Confirmer mot de passe */}
            <label className={styles.label}>
              Confirmez le mot de passe *
              {errors.confirmPassword && (
                <span className={styles.error}>
                  {" "}
                  {errors.confirmPassword}
                </span>
              )}
            </label>
            <div className={`${styles.passwordWrapper} ${errors.confirmPassword ? styles.inputError : ''}`}>
              <input
                className={styles.input}
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <span className={styles.eyeIcon} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>

            {/* Accept Terms */}
            <label className={`${styles.checkboxLabel} ${errors.acceptTerms ? styles.checkboxError : ''}`}>
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
              />{" "}
              J'accepte les conditions d'utilisation *
              {errors.acceptTerms && (
                <span className={styles.errorBlock}> {errors.acceptTerms}</span>
              )}
            </label>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !formData.acceptTerms} // Désactiver aussi si acceptTerms n'est pas coché
            >
              {loading ? "Inscription en cours..." : "S'inscrire"}
            </button>
          </form>
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default InscriptionPrestataire;
