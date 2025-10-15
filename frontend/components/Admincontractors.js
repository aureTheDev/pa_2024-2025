import React, { useEffect, useState } from "react";
import { Table, Typography, message, Layout, Spin } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const { Title } = Typography;

const AdminContractors = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");
  const [interventionFilter, setInterventionFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const router = useRouter();

  const services = [
    ...new Set(contractors.map((c) => c.service).filter(Boolean)),
  ];

  const interventionCounts = ["both", "incall", "outcall"].reduce(
    (acc, type) => {
      acc[type] = contractors.filter((c) => c.intervention === type).length;
      return acc;
    },
    {}
  );

  const serviceCounts = services.reduce((acc, s) => {
    acc[s] = contractors.filter((c) => c.service === s).length;
    return acc;
  }, {});

  const filteredContractors = contractors
    .filter((c) =>
      interventionFilter === "all"
        ? true
        : c.intervention === interventionFilter
    )
    .filter((c) =>
      serviceFilter === "all" ? true : c.service === serviceFilter
    )
    .sort((a, b) => {
      const dateA = new Date(a.sign_date || 0);
      const dateB = new Date(b.sign_date || 0);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const handleRetour = () => router.push("/admin/accueil");

  useEffect(() => {
    const fetchContractors = async () => {
      const token = localStorage.getItem("token");
      if (!token) return message.error("Token non trouvé");

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/contractors`,
          {
            headers: {
              "Content-Type": "application/json",
              token: token,
            },
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Erreur lors du chargement");
        }

        const data = await res.json();
        setContractors(data);
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  const columns = [
    { title: "Nom", dataIndex: "lastname", key: "lastname" },
    { title: "Prénom", dataIndex: "firstname", key: "firstname" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Téléphone", dataIndex: "phone", key: "phone" },
    { title: "Ville", dataIndex: "city", key: "city" },
    { title: "Pays", dataIndex: "country", key: "country" },
    { title: "Service", dataIndex: "service", key: "service" },
    { title: "Prix", dataIndex: "service_price", key: "service_price" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Intervention", dataIndex: "intervention", key: "intervention" },
    {
      title: "Date d'inscription",
      dataIndex: "registration_date",
      key: "registration_date",
    },
    {
      title: "N° d'enregistrement",
      dataIndex: "registration_number",
      key: "registration_number",
    },
    {
      title: "Fichier contrat",
      dataIndex: "contract_file",
      key: "contract_file",
    },
    {
      title: "Date de signature",
      dataIndex: "sign_date",
      key: "sign_date",
    },
    {
      title: "Site web",
      dataIndex: "website",
      key: "website",
      render: (text) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <Layout
      style={{ overflowX: "auto", minHeight: "100vh", background: "#f9fbfd" }}
    >
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
          width: "90%",
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
          Liste des prestataires
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
          Total des prestataires : <strong>{contractors.length}</strong>
        </motion.p>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "space-between",
          }}
        >
          <div>
            <label>Type d'intervention: </label>
            <select
              value={interventionFilter}
              onChange={(e) => setInterventionFilter(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="both">Both</option>
              <option value="incall">Incall</option>
              <option value="outcall">Outcall</option>
            </select>
          </div>
          <div>
            <label>Service: </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">Tous</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              Trier par date de signature ({sortOrder === "asc" ? "↑" : "↓"})
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {["both", "incall", "outcall"].map((type) => (
            <div
              key={type}
              style={{
                padding: "10px",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "6px",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              <strong>{type}</strong>
              <div>{interventionCounts[type] || 0} prestataires</div>
            </div>
          ))}
          {services.map((s) => (
            <div
              key={s}
              style={{
                padding: "10px",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "6px",
                minWidth: "120px",
                textAlign: "center",
              }}
            >
              <strong>{s}</strong>
              <div>{serviceCounts[s]} prestataires</div>
            </div>
          ))}
        </div>

        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            dataSource={filteredContractors}
            columns={columns}
            rowKey="contractor_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Layout.Content>
    </Layout>
  );
};

export default AdminContractors;
