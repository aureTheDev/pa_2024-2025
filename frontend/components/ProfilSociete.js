import { useState, useEffect } from "react";
import {
  Layout,
  Input,
  Button,
  Divider,
  Typography,
  Tooltip,
  message,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import styles from "../styles/ProfileSociete.module.css";
import { useRouter } from "next/router";

const { Title } = Typography;

const companyFields = [
  "name",
  "website",
  "registration_number",
  "registration_date",
  "industry",
  "revenue",
  "size",
];

const userFields = [
  "firstname",
  "lastname",
  "dob",
  "phone",
  "email",
  "country",
  "city",
  "street",
  "pc",
];

export default function ProfileSociete() {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    societe: {},
    responsable: {},
    full: {},
  });

  const router = useRouter();

  const handleRetour = () => {
    router.push("/societes/accueil");
  };

  const handleChange = (section, name, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  useEffect(() => {
    const fetchCompany = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/company/companies/me`,
          {
            headers: {
              "Content-Type": "application/json",
              token: localStorage.getItem("token"),
            },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Erreur de chargement");

        const companyData = {};
        const userData = {};

        Object.entries(data).forEach(([key, value]) => {
          if (companyFields.includes(key)) companyData[key] = value;
          else if (userFields.includes(key)) userData[key] = value;
        });

        setFormData({
          societe: companyData,
          responsable: userData,
          full: data,
        });
      } catch (error) {
        console.error("Erreur récupération société :", error.message);
        if (error.message.includes("Failed to fetch")) {
          message.error("Connexion impossible au serveur (fetch failed).");
        } else {
          message.error("Erreur lors du chargement des données.");
        }
      }
    };

    fetchCompany();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    try {
      const companyPayload = {
        name: formData.societe.name,
        website: formData.societe.website,
        registration_number: formData.societe.registration_number,
        registration_date: formData.societe.registration_date,
        industry: formData.societe.industry,
        revenue: Number(formData.societe.revenue),
        size: Number(formData.societe.size),
      };

      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/companies/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(companyPayload),
        }
      );

      if (!companyRes.ok) {
        const error = await companyRes.json();
        throw new Error("Erreur update société : " + JSON.stringify(error));
      }

      const userPayload = {
        firstname: formData.responsable.firstname,
        lastname: formData.responsable.lastname,
        dob: formData.responsable.dob,
        phone: formData.responsable.phone,
        email: formData.responsable.email,
        country: formData.responsable.country,
        city: formData.responsable.city,
        street: formData.responsable.street,
        pc: formData.responsable.pc,
      };

      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/user/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(userPayload),
        }
      );

      if (!userRes.ok) {
        const error = await userRes.json();
        throw new Error("Erreur update user : " + JSON.stringify(error));
      }

      message.success("Modifications enregistrées !");
      setEditMode(false);
    } catch (error) {
      console.error("Erreur sauvegarde :", error);
      message.error("Échec de l'enregistrement : " + error.message);
    }
  };

  return (
    <Layout className={styles.content}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="go back"
        onClick={handleRetour}
        style={{
          height: "40px",
          width: "40px",
          position: "fixed",
          top: "20px",
          left: "20px",
          cursor: "pointer",
          zIndex: 999,
        }}
      />

      <Layout.Content>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            textAlign: "center",
            fontSize: "2rem",
            marginBottom: "30px",
            color: "#007b7f",
          }}
        >
          Mon Profil
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.profileContainer}
        >
          <div className={styles.block}>
            <Divider orientation="left">
              Informations Société <BankOutlined style={{ color: "#5cc3b3" }} />
            </Divider>

            {companyFields.map((field) => (
              <div className={styles.inputGroup} key={field}>
                <label className={styles.label}>{field}</label>
                {editMode ? (
                  <Input
                    value={formData.societe[field] || ""}
                    onChange={(e) =>
                      handleChange("societe", field, e.target.value)
                    }
                  />
                ) : (
                  <p className={styles.infoItem}>
                    {String(formData.societe[field] || "")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className={styles.block}>
            <Divider orientation="left">
              Responsable de la Société{" "}
              <UserOutlined style={{ color: "#5cc3b3" }} />
            </Divider>

            {userFields.map((field) => (
              <div className={styles.inputGroup} key={field}>
                <label className={styles.label}>{field}</label>
                {editMode ? (
                  <Input
                    value={formData.responsable[field] || ""}
                    onChange={(e) =>
                      handleChange("responsable", field, e.target.value)
                    }
                  />
                ) : (
                  <p className={styles.infoItem}>
                    {String(formData.responsable[field] || "")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className={styles.centerButton}>
          <Tooltip
            title={
              editMode ? "Enregistrer les modifications" : "Modifier le profil"
            }
          >
            <Button
              type="primary"
              icon={editMode ? <SaveOutlined /> : <EditOutlined />}
              onClick={editMode ? handleSave : () => setEditMode(true)}
              style={{
                width: "200px",
                height: "50px",
                background: "#5cc3b3",
                borderColor: "#5cc3b3",
              }}
            >
              {editMode ? "Enregistrer" : "Modifier"}
            </Button>
          </Tooltip>
        </div>
      </Layout.Content>
    </Layout>
  );
}
