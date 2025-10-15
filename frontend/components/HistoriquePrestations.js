import React from "react";
import { Layout, Table, Tag } from "antd";
import {
  CalendarOutlined,
  HomeOutlined,
  LaptopOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import styles from "../styles/HistoriquePrestations.module.css";
import { useRouter } from "next/router";

const HistoriquePrestations = () => {
  const router = useRouter();
  const handleRetour = () => {
    router.push("/prestataires/accueil");
  };
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Heure",
      dataIndex: "heure",
      key: "heure",
    },
    {
      title: "Prestation",
      dataIndex: "prestation",
      key: "prestation",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type, record) => (
        <Tag
          icon={type === "Présentiel" ? <HomeOutlined /> : <LaptopOutlined />}
          color={type === "Présentiel" ? "blue" : "cyan"}
        >
          {type}{" "}
          {type === "Présentiel" && record.adresse ? `- ${record.adresse}` : ""}
        </Tag>
      ),
    },
  ];

  const data = [
    {
      key: 1,
      date: "2024-04-10",
      heure: "10:00",
      prestation: "Atelier Nutrition",
      type: "Présentiel",
      adresse: "123 Rue Santé, Paris",
    },
    {
      key: 2,
      date: "2024-04-15",
      heure: "14:00",
      prestation: "Consultation Bien-être",
      type: "Distanciel",
    },
    {
      key: 3,
      date: "2024-04-20",
      heure: "16:30",
      prestation: "Séance Yoga",
      type: "Présentiel",
      adresse: "Centre Sportif Zen, Lyon",
    },
  ];

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
          transition={{ delay: 0.2 }}
          className={styles.title}
        >
          <CalendarOutlined /> Historique des Prestations
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={styles.tableWrapper}
        >
          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 5 }}
            bordered
          />
        </motion.div>
      </Layout.Content>
    </Layout>
  );
};

export default HistoriquePrestations;
