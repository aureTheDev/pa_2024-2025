import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout, Modal, message } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const AntButton = dynamic(() => import("antd/es/button"), { ssr: false });
const Table = dynamic(() => import("antd/es/table"), { ssr: false });

const SalariesPage = ({ salaries }) => {
  const router = useRouter();
  const [filteredData, setFilteredData] = useState(salaries);

  useEffect(() => {
    setFilteredData(salaries);
  }, [salaries]);


  const handleRetour = () => {
    router.push("/societes/accueil");
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: "Êtes-vous sûr de vouloir supprimer ce collaborateur ?",
      icon: <ExclamationCircleOutlined />,
      okText: "Confirmer",
      cancelText: "Annuler",
      onOk: async () => {
        try {
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("access_token="))
            ?.split("=")[1];

          if (!token) {
            message.error("Token manquant !");
            return;
          }

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/company/collaborators/${record.collaborator_id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                token: token,
              },
            }
          );

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.detail || "Échec de la suppression");
          }

          message.success("Collaborateur supprimé !");
          setFilteredData((prev) =>
            prev.filter(
              (item) => item.collaborator_id !== record.collaborator_id
            )
          );
        } catch (err) {
          console.error(err);
          message.error(err.message || "Erreur lors de la suppression");
        }
      },
    });
  };

  const columns = [
    { title: "Nom", dataIndex: "lastname", key: "lastname" },
    { title: "Prénom", dataIndex: "firstname", key: "firstname" },
    {
      title: "Date d'inscription",
      dataIndex: "inscription_date",
      key: "inscription_date",
    },
    {
      title: "Statut",
      dataIndex: "verified",
      key: "verified",
      render: (verified) => (
        <span style={{ color: verified ? "#007b7f" : "#d32029" }}>
          {verified ? "Vérifié" : "Non vérifié"}
        </span>
      ),
    },
    {
      title: "Voir",
      key: "voir",
      render: (_, record) => (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{ textAlign: "center" }}
        >
          <AntButton
            type="text"
            icon={
              <EyeOutlined style={{ fontSize: "18px", color: "#007b7f" }} />
            }
            onClick={(e) => {
              e.stopPropagation();
              if (record.collaborator_id) {
                router.push(`/societes/salaries/${record.collaborator_id}`);
              }
            }}
            style={{ display: "block", margin: "auto" }}
          />
        </motion.div>
      ),
    },
    {
      title: "Supprimer",
      key: "supprimer",
      render: (_, record) => (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{ textAlign: "center" }}
        >
          <AntButton
            type="text"
            danger
            icon={<DeleteOutlined style={{ fontSize: "18px" }} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
            style={{ display: "block", margin: "auto" }}
          />
        </motion.div>
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

      <Layout.Content
        style={{
          padding: "40px 50px",
          background: "#f9fbfd",
          marginTop: "90px",
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
          Liste des Collaborateurs
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ maxWidth: "900px", margin: "auto", width: "100%" }}>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="collaborator_id"
              pagination={{ pageSize: 5 }}
              bordered
            />
          </div>
        </motion.div>
      </Layout.Content>
    </Layout>
  );
};

export default SalariesPage;
