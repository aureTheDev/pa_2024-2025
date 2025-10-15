import { useRouter } from "next/router";
import { Layout } from "antd";
import { motion } from "framer-motion";
import {
  EditOutlined,
  RollbackOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import styles from "../styles/SalarieDetail.module.css";

const SalarieDetails = ({ salarie }) => {
  const router = useRouter();

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f4f5" }}>
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.icon_back}
        onClick={() => router.push("/societes/accueil")}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          cursor: "pointer",
          fontSize: 28,
          color: "#007b7f",
          zIndex: 999,
        }}
      >
        <ArrowLeftOutlined />
      </motion.div>

      <Layout.Content className={styles.content}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Détails du Salarié
        </motion.h1>

        <motion.div
          className={styles.infoContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p>
            <strong>Nom :</strong> {salarie.lastname}
          </p>
          <p>
            <strong>Prénom :</strong> {salarie.firstname}
          </p>
          <p>
            <strong>Date de naissance :</strong> {salarie.dob}
          </p>
          <p>
            <strong>Téléphone :</strong> {salarie.phone}
          </p>
          <p>
            <strong>Email :</strong> {salarie.email}
          </p>
          <p>
            <strong>Rôle :</strong> {salarie.role}
          </p>
          <p>
            <strong>Pays :</strong> {salarie.country}
          </p>
          <p>
            <strong>Ville :</strong> {salarie.city}
          </p>
          <p>
            <strong>Adresse :</strong> {salarie.street}
          </p>
          <p>
            <strong>Code postal :</strong> {salarie.pc}
          </p>
          <p>
            <strong>Date d'inscription :</strong> {salarie.inscription_date}
          </p>
          <p>
            <strong>Compte vérifié :</strong> {salarie.verified ? "Oui" : "Non"}
          </p>

          <div className={styles.buttonGroup}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className={styles.editButton}
              onClick={() =>
                router.push(
                  `/societes/salaries/edit/${salarie.collaborator_id}`
                )
              }
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <EditOutlined />
              Modifier
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className={styles.backButton}
              onClick={() => router.push("/societes/salaries")}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <RollbackOutlined />
              Retour à la liste
            </motion.button>
          </div>
        </motion.div>
      </Layout.Content>
    </Layout>
  );
};

export default SalarieDetails;
