import { Layout } from "antd";
import { motion } from "framer-motion";
import {
  FaBriefcase,
  FaHandsHelping,
  FaUsers,
  FaClock,
  FaHeartbeat,
  FaChartLine,
  FaChartPie,
} from "react-icons/fa";
import styles from "../styles/StatistiquePrestataire.module.css";
import { useRouter } from "next/router";

const stats = [
  {
    label: "Total services",
    value: 10,
    icon: <FaBriefcase />,
  },
  {
    label: "Total prestations",
    value: 50,
    icon: <FaChartPie />,
  },
  {
    label: "Nombre de clients",
    value: 5,
    icon: <FaUsers />,
  },
  {
    label: "Prestation + demandée",
    value: "Yoga",
    icon: <FaHeartbeat />,
  },
  {
    label: "Prestation - demandée",
    value: "Massage",
    icon: <FaChartLine />,
  },
  {
    label: "Heures effectuées",
    value: 200,
    icon: <FaClock />,
  },
  {
    label: "Heures / semaine",
    value: 30,
    icon: <FaClock />,
  },
];

const HistoriquePrestataire = () => {
  const router = useRouter();

  const handleRetour = () => {
    router.push("/prestataires/accueil");
  };

  return (
    <Layout className={styles.layout}>
      <img
        src="/back_icon.png"
        alt="go back"
        className={styles.icon_back}
        onClick={handleRetour}
        style={{ cursor: "pointer" }}
      />
      <Layout.Content className={styles.content}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.title}
        >
          Mon historique d'activité
        </motion.h1>

        <div className={styles.grid}>
          {stats.map((item, index) => (
            <motion.div
              key={index}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className={styles.icon}>{item.icon}</div>
              <div className={styles.label}>{item.label}</div>
              <div className={styles.value}>{item.value}</div>
            </motion.div>
          ))}
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default HistoriquePrestataire;
