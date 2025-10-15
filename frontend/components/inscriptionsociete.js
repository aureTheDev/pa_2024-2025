import React, { useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "antd";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import styles from "../styles/inscriptionsociete.module.css";
import CustomFooter from "./Footer";

const { Header, Content } = Layout;

const InscriptionSociete = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    siret: "",
    address: "",
    companySize: "",
    website: "",
    activitySector: "",
    registration_date: "",
    revenue: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
    dob: "",
    country: "",
    city: "",
    pc: "",
    acceptTerms: false,
    subscribeNewsletter: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      "companyName",
      "siret",
      "address",
      "companySize",
      "website",
      "activitySector",
      "registration_date",
      "revenue",
      "phone",
      "email",
      "password",
      "confirmPassword",
      "firstname",
      "lastname",
      "dob",
      "country",
      "city",
      "pc",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
      }
    }

    if (!formData.acceptTerms || !formData.subscribeNewsletter) {
      alert("Vous devez accepter les conditions et vous abonner aux notifications.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company_inscription_route/inscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstname: formData.firstname,
            lastname: formData.lastname,
            dob: formData.dob,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            country: formData.country,
            city: formData.city,
            street: formData.address,
            pc: formData.pc,
            // Informations sur l’entreprise
            name: formData.companyName,
            website: formData.website,
            registration_number: formData.siret,
            registration_date: formData.registration_date,
            industry: formData.activitySector,
            revenue: parseInt(formData.revenue),
            size:
              formData.companySize === "1-30"
                ? 30
                : formData.companySize === "31-250"
                ? 250
                : 500,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Une erreur est survenue.");
      }

      // Si un token est renvoyé, on l'enregistre dans les cookies
      if (data.token) {
        localStorage.setItem("token", data.token);
        document.cookie = `access_token=${data.token}; path=/;`;
      }

      console.log("Réponse:", data);

      // Redirection vers la page de vérification de l'email
      router.push("/auth/verify");
    } catch (error) {
      console.error("Erreur :", error.message);
      alert("Erreur : " + error.message);
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
          <h2 className={styles.title}>Formulaire d'inscription</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Infos société */}
            <section>
              <h3 className={styles.subtitle}>1. Informations sur l’entreprise</h3>
              <label className={styles.label}>Nom de la société</label>
              <input
                type="text"
                name="companyName"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Numéro SIRET</label>
              <input
                type="text"
                name="siret"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Adresse complète</label>
              <input
                type="text"
                name="address"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Effectif de l’entreprise</label>
              <div className={styles.radioGroup}>
                {["1-30", "31-250", ">251"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.radioButton} ${
                      formData.companySize === size ? styles.selected : ""
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, companySize: size })
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>

              <label className={styles.label}>Site web</label>
              <input
                type="text"
                name="website"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Secteur d’activité</label>
              <div className={styles.radioGroup}>
                {["Technologie", "Santé", "Commerce", "Autre"].map((sector) => (
                  <label key={sector} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="activitySector"
                      value={sector}
                      checked={formData.activitySector === sector}
                      onChange={handleChange}
                    />
                    {sector}
                  </label>
                ))}
              </div>

              <label className={styles.label}>Date d'immatriculation</label>
              <input
                type="date"
                name="registration_date"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Chiffre d’affaires</label>
              <input
                type="number"
                name="revenue"
                onChange={handleChange}
                className={styles.input}
              />
            </section>

            {/* Infos responsable */}
            <section>
              <h3 className={styles.subtitle}>2. Informations du représentant légal</h3>
              <label className={styles.label}>Prénom</label>
              <input
                type="text"
                name="firstname"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Nom</label>
              <input
                type="text"
                name="lastname"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Date de naissance</label>
              <input
                type="date"
                name="dob"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Téléphone</label>
              <input
                type="tel"
                name="phone"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Email professionnel</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Pays</label>
              <input
                type="text"
                name="country"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Ville</label>
              <input
                type="text"
                name="city"
                onChange={handleChange}
                className={styles.input}
              />

              <label className={styles.label}>Code postal</label>
              <input
                type="text"
                name="pc"
                onChange={handleChange}
                className={styles.input}
              />
            </section>

            {/* Sécurité */}
            <section>
              <h3 className={styles.subtitle}>4. Connexion et Sécurité</h3>
              <label className={styles.label}>Mot de passe</label>
              <div className={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handleChange}
                  className={styles.input}
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                </span>
              </div>

              <label className={styles.label}>Confirmer le mot de passe</label>
              <div className={styles.passwordField}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  onChange={handleChange}
                  className={`${styles.input} ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? styles.inputError
                      : ""
                  }`}
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                </span>
              </div>
            </section>

            {/* Conditions */}
            <section>
              <h3 className={styles.subtitle}>6. Acceptation et validation</h3>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  onChange={handleChange}
                />
                J'accepte les CGU et la politique de confidentialité
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="subscribeNewsletter"
                  onChange={handleChange}
                />
                Je souhaite recevoir les actualités
              </label>
            </section>

            <button type="submit" className={styles.button}>
              Créer un compte
            </button>
          </form>
        </div>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default InscriptionSociete;