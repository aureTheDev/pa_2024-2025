import React from "react";
import { Layout, Table, Tag, Button } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import styles from "../styles/FacturesPrestataires.module.css";
import { useRouter } from "next/router";

const MesFactures = () => {
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
      title: "Nom de prestation",
      dataIndex: "prestation",
      key: "prestation",
    },
    {
      title: "Montant",
      dataIndex: "montant",
      key: "montant",
      render: (text) => <strong>{text} €</strong>,
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (statut) => {
        let color = "green";
        let icon = <CheckCircleOutlined />;
        if (statut === "En attente") {
          color = "orange";
          icon = <ClockCircleOutlined />;
        } else if (statut === "Refusée") {
          color = "red";
          icon = <CloseCircleOutlined />;
        }
        return (
          <Tag color={color} icon={icon}>
            {statut}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<DownloadOutlined />}
          type="link"
          href={record.fichier}
          target="_blank"
        >
          Télécharger
        </Button>
      ),
    },
  ];

  const data = [
    {
      key: 1,
      date: "2024-04-01",
      prestation: "Consultation médicale",
      montant: 320,
      statut: "Payée",
      fichier: "/factures/facture_01.pdf",
    },
    {
      key: 2,
      date: "2024-03-01",
      prestation: "Atelier bien-être",
      montant: 280,
      statut: "En attente",
      fichier: "/factures/facture_02.pdf",
    },
    {
      key: 3,
      date: "2024-02-01",
      prestation: "Séance de yoga",
      montant: 300,
      statut: "Refusée",
      fichier: "/factures/facture_03.pdf",
    },
  ];

  const totalFactures = data.reduce((sum, facture) => sum + facture.montant, 0);

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
          <FileTextOutlined /> Mes Factures
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
          <div className={styles.total}>
            <strong>Total des factures : </strong> {totalFactures} €
          </div>
        </motion.div>
      </Layout.Content>
    </Layout>
  );
};

export default MesFactures;
