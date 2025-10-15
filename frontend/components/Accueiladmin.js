import React from "react";
import styles from "../styles/Accueiladmin.module.css";
import CustomHeader from "./HeaderSociete";
import CustomFooter from "./Footer";
import { useRouter } from "next/router";
import {
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  FileDoneOutlined,
  ApartmentOutlined,
  MessageOutlined,
  HeartOutlined,
  SolutionOutlined,
  CommentOutlined,
  TagsOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const statsCards = [
  {
    icon: <FileTextOutlined />,
    label: "Factures",
    link: "/admin/factures",
  },
  {
    icon: <FileDoneOutlined />,
    label: "Devis",
    link: "/admin/devis",
  },
  {
    icon: <SolutionOutlined />,
    label: "Contrats",
    link: "/admin/contrats",
  },
  {
    icon: <ApartmentOutlined />,
    label: "Sociétés",
    link: "/admin/societes",
  },
  {
    icon: <TeamOutlined />,
    label: "Collaborateurs",
    link: "/admin/collaborateurs",
  },
  {
    icon: <UserOutlined />,
    label: "Prestataires",
    link: "/admin/prestataires",
  },
  {
    icon: <MessageOutlined />,
    label: "Categories",
    link: "/admin/forum_categories",
  },
  {
    icon: <CommentOutlined />,
    label: "sujets",
    link: "/admin/forum_sujets",
  },
  {
    icon: <HeartOutlined />,
    label: "Associations",
    link: "/admin/associations",
  },
  {
    icon: <TagsOutlined />,
    label: "Tickets",
    link: "/admin/tickets",
  },
  {
    icon: <ToolOutlined />,
    label: "Services",
    link: "/admin/services",
  },
];

const AdminAccueil = () => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <CustomHeader />

      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Bienvenue Admin</h1>
        <p className={styles.tagline}>
          Supervisez toute l'activité santé & bien-être de la plateforme
        </p>
      </motion.header>

      <section className={styles.statsSection}>
        {statsCards.map((card, index) => (
          <motion.div
            key={index}
            className={styles.card}
            onClick={() => router.push(card.link)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={styles.icon}>{card.icon}</div>
            <h3>{card.label}</h3>
          </motion.div>
        ))}
      </section>

      <section className={styles.aboutSection}>
        <h2>Qui sommes-nous ?</h2>
        <p>
          CareConnect centralise les interactions entre employeurs,
          prestataires, collaborateurs et associations pour un écosystème
          bien-être durable.
        </p>
      </section>

      <CustomFooter />
    </div>
  );
};

export default AdminAccueil;
