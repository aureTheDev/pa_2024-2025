import { useEffect, useState } from "react";
import { Table, Button, Typography, message, Layout } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const { Title } = Typography;

export default function DevisListe() {
  const [estimates, setEstimates] = useState([]);
  const router = useRouter();

  const handleRetour = () => {
    router.push("/societes/accueil");
  };

  useEffect(() => {
    const fetchEstimates = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Token manquant");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/company/estimates`,
          {
            method: "GET",
            headers: {
              token,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error("Erreur de chargement");
        setEstimates(data);
      } catch (err) {
        message.error("Erreur de récupération des devis");
      }
    };

    fetchEstimates();
  }, []);

  const columns = [
    {
      title: "Référence",
      dataIndex: "company_subscription_id",
    },
    {
      title: "Fichier",
      dataIndex: "file",
      render: (filePath) => {
        const parts = filePath.split("/");
        return parts[parts.length - 1];
      },
    },
    {
      title: "Date de création",
      dataIndex: "creation_date",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("fr-FR") : "—",
    },
    {
      title: "Date de signature",
      dataIndex: "signature_date",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("fr-FR") : "—",
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_API_URL}/${record.file}`,
              "_blank"
            )
          }
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="Retour"
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

      <Layout.Content
        style={{
          padding: "40px 50px",
          marginTop: "70px",
          width: "70%",
          margin: "0 auto",
        }}
      >
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
          Liste des Devis
        </motion.h1>

        <Table
          rowKey="company_subscription_id"
          columns={columns}
          dataSource={estimates}
          bordered
        />
      </Layout.Content>
    </Layout>
  );
}
