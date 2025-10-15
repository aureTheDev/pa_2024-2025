import { useEffect, useState } from "react";
import { Table, Typography, message, Button, Layout, Tag } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DeleteOutlined } from "@ant-design/icons";
import { Dropdown, Menu } from "antd";
const { Title } = Typography;


const getCookie = (cookieName) => {
const cookies = document.cookie.split("; ");
const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
return cookie ? cookie.split("=")[1] : null;
};

export default function AllBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();

  const handleRetour = () => {
    router.push("/admin/accueil");
  };

  const menu = (
    <Menu
      onClick={({ key }) => {
        setFilterStatus(key);
      }}
      items={[
        { key: "all", label: "Toutes les factures" },
        { key: "payed", label: "Payée" },
        { key: "not_payed", label: "Non payée" },
      ]}
    />
  );

  // Filtrer les données en fonction de l'état sélectionné
  const filteredBills = bills.filter((bill) => {
    if (filterStatus === "payed") return bill.payed === true;
    if (filterStatus === "not_payed") return bill.payed === false;
    return true; // "all"
  });
  useEffect(() => {
    const fetchBills = async () => {
      const token = getCookie("access_token");
      if (!token) {
        message.warning("Aucun token trouvé. Connexion requise.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/bills`,
          {
            headers: {
              token,
              accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Erreur réseau");

        const data = await res.json();
        setBills(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des factures :", error);
        message.error("Impossible de charger les factures");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
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
        <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Payée",
      dataIndex: "payed",
      key: "payed",
      render: (payed) => (
        <Tag color={payed ? "green" : "volcano"}>{payed ? "Oui" : "Non"}</Tag>
      ),
    },
    {
      title: "Voir",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_API_URL}/${record.file.replace(
                /^\/+/,
                ""
              )}`,
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
          onClick={async () => {
            const confirmed = window.confirm(
              "Confirmer la suppression de la facture ?"
            );
            if (!confirmed) return;

            try {
              const token = getCookie("access_token");
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/bills/${record.company_subscription_id}`,
                {
                  method: "DELETE",
                  headers: { token },
                }
              );
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Erreur lors de la suppression");
              }

              message.success("Facture supprimée avec succès !");
              setBills((prev) =>
                prev.filter(
                  (b) =>
                    b.company_subscription_id !== record.company_subscription_id
                )
              );
            } catch (err) {
              message.error("Erreur : " + err.message);
            }
          }}
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
          Liste des factures
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
          Total des factures : <strong>{bills.length}</strong>
        </motion.p>
        <div style={{ marginBottom: "20px", textAlign: "right" }}>
          <Dropdown overlay={menu} placement="bottomRight" arrow>
            <Button>Filtrer les factures</Button>
          </Dropdown>
        </div>

        <Table
          columns={columns}
          dataSource={filteredBills.map((b) => ({
            ...b,
            key: b.company_subscription_id,
          }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Layout.Content>
    </Layout>
  );
}
