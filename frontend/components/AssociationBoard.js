// components/Associations.js
import React, { useEffect, useState } from "react";
import { Table, Typography, Layout, Spin, Button, message } from "antd";
import { motion } from "framer-motion";
import { EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { Input } from "antd";

const { Title } = Typography;

const Associations = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [donationType, setDonationType] = useState(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    iban: "",
    holder: "",
    amount: "",
  });

  const router = useRouter();
  const openDonationModal = (ngo) => {
    setSelectedNgo(ngo);
    setShowChoiceModal(true);
  };

  const handleDonationType = (type) => {
    setDonationType(type);
    setShowChoiceModal(false);

    if (type === "physique") {
      message.success(
        `Merci pour votre don ! Veuillez envoyer le don à l'adresse : ${selectedNgo.address}`
      );
    } else {
      setShowMoneyModal(true);
    }
  };

  const handleSubmitMoneyDonation = async () => {
    const token = localStorage.getItem("token");
    const { iban, holder, amount } = donationForm;

    if (!iban || !holder || !amount) {
      message.warning("Merci de remplir tous les champs");
      return;
    }

    try {
      const payload = {
        ngo_id: selectedNgo.ngo_id,
        donation_type: "argent",
        amount: parseInt(amount, 10),
        billing_name: holder,
        iban: iban.replace(/\s+/g, ""),
      };

      console.log("Payload envoyé:", payload);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/donations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log("Réponse serveur:", data);

      if (!res.ok)
        throw new Error(data.detail || "Erreur lors de l'envoi du don");

      message.success("Merci pour votre don ! Une facture a été générée.");
      setShowMoneyModal(false);
      setDonationForm({ iban: "", holder: "", amount: "" });
    } catch (err) {
      message.error(err.message);
    }
  };

  const fetchNgos = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/ngos`,
        {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );

      if (!res.ok)
        throw new Error("Erreur lors du chargement des associations");

      const data = await res.json();
      setNgos(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, []);

  const columns = [
    { title: "Nom", dataIndex: "name", key: "name" },
    {
      title: "Date d'enregistrement",
      dataIndex: "registration_date",
      key: "registration_date",
    },
    { title: "Adresse", dataIndex: "address", key: "address" },
    { title: "Pays", dataIndex: "country", key: "country" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Présentation", dataIndex: "presentation", key: "presentation" },
    {
      title: "Site Web",
      dataIndex: "website",
      key: "website",
      render: (text) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    { title: "Téléphone", dataIndex: "phone", key: "phone" },
    {
      title: "Faire un don",
      key: "donation",
      render: (_, record) => (
        <Button type="primary" onClick={() => openDonationModal(record)}>
          Faire un don
        </Button>
      ),
    },
    {
      title: "Events",
      key: "events",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          type="link"
          onClick={() =>
            router.push(`/salaries/associations/${record.ngo_id}/events`)
          }
        />
      ),
    },
  ];

  return (
    <Layout
      style={{ minHeight: "100vh", background: "#f9fbfd", overflowX: "auto" }}
    >
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="Retour"
        onClick={() => router.push("/salaries/accueil")}
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
        style={{ width: "80%", margin: "70px auto", padding: 30 }}
      >
        <Title level={2} style={{ textAlign: "center", color: "#007b7f" }}>
          Liste des associations disponnibles
        </Title>

        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            dataSource={ngos}
            columns={columns}
            rowKey="ngo_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            style={{ width: "100%" }}
          />
        )}

        {showChoiceModal && (
          <div className="ant-modal-mask">
            <div className="ant-modal-wrap">
              <div
                className="ant-modal"
                style={{ padding: 20, background: "#fff", borderRadius: 8 }}
              >
                <Title level={4}>Quel type de don souhaitez-vous faire ?</Title>
                <Button
                  type="default"
                  onClick={() => handleDonationType("physique")}
                  style={{ marginRight: 10 }}
                >
                  Don physique
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleDonationType("argent")}
                >
                  Don en argent
                </Button>
              </div>
            </div>
          </div>
        )}

        {showMoneyModal && (
          <div className="ant-modal-mask">
            <div className="ant-modal-wrap">
              <div
                className="ant-modal"
                style={{
                  padding: 20,
                  background: "#fff",
                  borderRadius: 8,
                  width: 400,
                }}
              >
                <Title level={4}>Faire un don en argent</Title>
                <Input
                  placeholder="Nom du titulaire"
                  value={donationForm.holder}
                  onChange={(e) =>
                    setDonationForm({ ...donationForm, holder: e.target.value })
                  }
                  style={{ marginBottom: 10 }}
                />
                <Input
                  placeholder="IBAN"
                  value={donationForm.iban}
                  onChange={(e) =>
                    setDonationForm({ ...donationForm, iban: e.target.value })
                  }
                  style={{ marginBottom: 10 }}
                />
                <Input
                  placeholder="Montant (€)"
                  type="number"
                  value={donationForm.amount}
                  onChange={(e) =>
                    setDonationForm({ ...donationForm, amount: e.target.value })
                  }
                  style={{ marginBottom: 20 }}
                />
                <Button type="primary" onClick={handleSubmitMoneyDonation}>
                  Envoyer le don
                </Button>
                <Button
                  onClick={() => setShowMoneyModal(false)}
                  style={{ marginLeft: 10 }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}
      </Layout.Content>
    </Layout>
  );
};

export default Associations;
