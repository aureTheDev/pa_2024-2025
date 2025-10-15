import { useEffect, useState } from "react";
import { Table, Typography, message, Button, Layout, Modal } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import SignaturePad from "react-signature-canvas";
import React from "react";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import { StopOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function AllContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const sigCanvasRef = React.useRef();
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // pour trier la date de signature

  const router = useRouter();

  const handleRetour = () => {
    router.push("/admin/accueil");
  };

  const filteredContracts = contracts
    .filter((c) =>
      filterStatus === "all" ? true : c.subscription_status === filterStatus
    )
    .sort((a, b) => {
      const dateA = new Date(a.signature_date || 0);
      const dateB = new Date(b.signature_date || 0);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const handleResiliation = async (contract) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/contracts/${contract.company_id}/${contract.company_subscription_id}/resiliate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Erreur inconnue");
      }

      message.success("Contrat résilié avec succès");

      setContracts((prevContracts) =>
        prevContracts.map((c) =>
          c.company_id === contract.company_id &&
          c.company_subscription_id === contract.company_subscription_id
            ? {
                ...c,
                status: "RESILIE",
              }
            : c
        )
      );
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (record) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        ` ${process.env.NEXT_PUBLIC_API_URL}/admin/contracts/${record.company_id}/${record.company_subscription_id}`,
        {
          method: "DELETE",
          headers: {
            token,
          },
        }
      );

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      message.success("Contrat supprimé avec succès !");

      setContracts((prev) =>
        prev.filter(
          (c) => c.company_subscription_id !== record.company_subscription_id
        )
      );
    } catch (err) {
      console.error(err);
      message.error("Échec de la suppression du contrat.");
    }
  };

  const handleValidateSignature = async () => {
    const token = localStorage.getItem("token");
    const signatureBase64 = sigCanvasRef.current
      .getCanvas()
      .toDataURL("image/png");

    setIsSigning(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/sign-contract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({
            company_id: selectedContract.company_id,
            subscription_id: selectedContract.company_subscription_id,
            admin_signature: signatureBase64,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Erreur back:", data);
        throw new Error(data?.detail || "Erreur lors de la signature");
      }

      message.success("Contrat signé avec succès !");
      setShowModal(false);

      setContracts((prevContracts) =>
        prevContracts.map((c) =>
          c.company_subscription_id === selectedContract.company_subscription_id
            ? {
                ...c,
                admin_signed: true,
                signature_date: new Date().toISOString(),
                subscription_status: "ACTIVE",
                subscription: {
                  ...(c.subscription || {}),
                  status: "ACTIVE",
                },
              }
            : c
        )
      );

      sigCanvasRef.current?.clear();
      setSelectedContract(null);
    } catch (err) {
      console.error("Erreur JS :", err);
      message.error(err.message || "Échec de la signature du contrat");
    } finally {
      setIsSigning(false);
    }
  };

  useEffect(() => {
    const fetchContracts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        message.warning("Aucun token trouvé. Connexion requise.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/contracts`,
          {
            headers: {
              token,
              accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Erreur réseau");

        const data = await res.json();
        setContracts(
          data.map((c) => ({
            ...c,
          }))
        );
      } catch (error) {
        console.error("Erreur lors de la récupération des contrats :", error);
        message.error("Impossible de charger les contrats");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
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
      render: (status) => {
        if (!status) return <span style={{ color: "gray" }}>Inconnu</span>;

        let color = "gray";
        if (status === "ACTIVE") color = "green";
        else if (status === "RESILIE") color = "red";
        else if (status === "EN ATTENTE") color = "orange";
        else if (status === "EXPIREE") color = "gray";

        return <span style={{ color }}>{status}</span>;
      },
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
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      title: "Signer",
      key: "action",
      render: (_, record) =>
        record.company_signed && !record.admin_signed ? (
          <Button
            type="primary"
            onClick={() => {
              setSelectedContract(record);
              setShowModal(true);
            }}
          >
            Signer
          </Button>
        ) : (
          <span style={{ color: "green" }}>
            {record.admin_signed ? "Signé" : "-"}
          </span>
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
              `${process.env.NEXT_PUBLIC_API_URL}/${record.file}`,
              "_blank"
            )
          }
        />
      ),
    },
    {
      title: "Résilier",
      key: "resilier",
      render: (_, record) => {
        if (
          ["RESILIE", "EXPIREE", "EN ATTENTE"].includes(
            record.subscription_status
          )
        ) {
          return null;
        }

        return (
          <Popconfirm
            title="Êtes-vous sûr de vouloir résilier ce contrat ?"
            onConfirm={() => handleResiliation(record)}
            okText="Oui"
            cancelText="Non"
          >
            <Button danger icon={<StopOutlined />}>
              Résilier
            </Button>
          </Popconfirm>
        );
      },
    },

    {
      title: "Supprimer",
      key: "delete",
      render: (_, record) => (
        <Popconfirm
          title="Supprimer ce contrat ?"
          okText="Oui"
          cancelText="Non"
          onConfirm={() => handleDelete(record)}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
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
          Liste des contrats
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
          Total des contrats : <strong>{contracts.length}</strong>
        </motion.p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <span style={{ marginRight: 10 }}>Filtrer par statut :</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="ACTIVE">Active</option>
              <option value="EN ATTENTE">En attente</option>
              <option value="EXPIREE">Expirée</option>
              <option value="RESILIE">Résilié</option>
            </select>
          </div>

          <div>
            <Button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              Trier par date de signature ({sortOrder === "asc" ? "↑" : "↓"})
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredContracts.map((c) => ({
            ...c,
            key: c.company_subscription_id,
            company_id: c.company_id,
          }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
        />

        <Modal
          open={showModal}
          title="Signature du contrat"
          onCancel={() => setShowModal(false)}
          onOk={handleValidateSignature}
          okText="Signer"
          cancelText="Annuler"
          confirmLoading={isSigning}
        >
          <div style={{ marginBottom: 10 }}>
            <SignaturePad
              ref={sigCanvasRef}
              canvasProps={{
                width: 400,
                height: 150,
                style: {
                  border: "1px solid #ccc",
                  display: "block",
                  margin: "0 auto",
                },
              }}
            />
          </div>
          <Button onClick={() => sigCanvasRef.current?.clear()}>
            Effacer la signature
          </Button>
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
