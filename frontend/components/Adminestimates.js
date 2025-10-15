// /components/allestimates.js
import { useEffect, useState } from "react";
import { Table, Typography, message, Button, Layout } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";

const { Title } = Typography;

export default function AllEstimates() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" ou "desc"

  const statusCounts = {
    "EN ATTENTE": estimates.filter(
      (e) => e.subscription_status === "EN ATTENTE"
    ).length,
    EXPIREE: estimates.filter((e) => e.subscription_status === "EXPIREE")
      .length,
    ACTIVE: estimates.filter((e) => e.subscription_status === "ACTIVE").length,
    RESILIE: estimates.filter((e) => e.subscription_status === "RESILIE")
      .length,
  };

  const router = useRouter();

  const handleRetour = () => {
    router.push("/admin/accueil");
  };

  const menu = (
    <Menu
      onClick={({ key }) => setFilterStatus(key)}
      items={[
        { key: "all", label: "Tous les statuts" },
        { key: "EN ATTENTE", label: "En attente" },
        { key: "EXPIREE", label: "Expirée" },
        { key: "ACTIVE", label: "Active" },
        { key: "RESILIE", label: "Résilié" },
      ]}
    />
  );

  const filteredEstimates = estimates
    .filter((e) =>
      filterStatus === "all" ? true : e.subscription_status === filterStatus
    )
    .sort((a, b) => {
      const dateA = new Date(a.signature_date);
      const dateB = new Date(b.signature_date);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const handleDelete = async (subscription_id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      message.error("Token manquant");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/estimates/${subscription_id}`,
        {
          method: "DELETE",
          headers: {
            token,
            accept: "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      message.success("Devis supprimé avec succès !");
      setEstimates((prev) =>
        prev.filter((e) => e.company_subscription_id !== subscription_id)
      );
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de la suppression du devis");
    }
  };

  useEffect(() => {
    const fetchEstimates = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("Aucun token trouvé. Connexion requise.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/estimates`,
          {
            headers: {
              token,
              accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Erreur ${res.status}: ${msg}`);
        }

        const data = await res.json();
        setEstimates(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des devis :", error);
        message.error("Impossible de charger les devis");
      } finally {
        setLoading(false);
      }
    };

    fetchEstimates();
  }, []);

  const columns = [
    { title: "Entreprise", dataIndex: "company_name", key: "company_name" },
    {
      title: "Abonnement ID",
      dataIndex: "company_subscription_id",
      key: "company_subscription_id",
    },
    {
      title: "Statut abonnement",
      dataIndex: "subscription_status",
      key: "subscription_status",
      render: (status) => (
        <span style={{ color: status === "ACTIVE" ? "green" : "red" }}>
          {status}
        </span>
      ),
    },
    {
      title: "Date de création",
      dataIndex: "creation_date",
      key: "creation_date",
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      title: "Date de signature",
      dataIndex: "signature_date",
      key: "signature_date",
      render: (val) => new Date(val).toLocaleDateString(),
    },
    { title: "Employés", dataIndex: "employees", key: "employees" },
    { title: "Montant (€)", dataIndex: "amount", key: "amount" },
    {
      title: "Voir",
      key: "action",
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
    {
      title: "Supprimer",
      key: "delete",
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.company_subscription_id)}
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
          Liste des devis
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            textAlign: "center",
            fontSize: "1.1rem",
            marginBottom: "20px",
            color: "#333",
          }}
        >
          Total des devis: <strong>{estimates.length}</strong>
        </motion.p>
        <div style={{ marginBottom: "20px", textAlign: "right" }}>
          <Dropdown overlay={menu} placement="bottomRight" arrow>
            <Button>Filtrer par statut d'abonnement</Button>
          </Dropdown>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          {["ACTIVE", "EN ATTENTE", "EXPIREE", "RESILIE"].map((status) => (
            <div
              key={status}
              style={{
                background: "#fff",
                border: "1px solid #ddd",
                padding: "10px 15px",
                borderRadius: "8px",
                minWidth: "120px",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <strong>{status}</strong>
              <div>{statusCounts[status]} devis</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: "10px", textAlign: "right" }}>
          <Button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            Trier par date de signature (
            {sortOrder === "asc" ? "Croissante" : "Décroissante"})
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredEstimates.map((e) => ({
            ...e,
            key: e.company_subscription_id,
          }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Layout.Content>
    </Layout>
  );
}
