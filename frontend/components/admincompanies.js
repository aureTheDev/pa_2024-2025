import React, { useEffect, useState } from "react";
import { Table, Button, Input, message } from "antd";
import { Layout } from "antd";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [selectedIndustry, setSelectedIndustry] = useState("all");

  const industries = [
    ...new Set(companies.map((c) => c.industry).filter(Boolean)),
  ];

  const industryCounts = industries.reduce((acc, ind) => {
    acc[ind] = companies.filter((c) => c.industry === ind).length;
    return acc;
  }, {});

  const filteredCompanies = companies.filter((c) =>
    selectedIndustry === "all" ? true : c.industry === selectedIndustry
  );
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  const handleRetour = () => router.push("/admin/accueil");

  const fetchCompanies = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/companies`,
        {
          headers: { token },
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(data);
    } catch {
      message.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleEdit = (record) => {
    setEditingId(record.company_id);
    setEditedData({ ...record });
  };

  const handleChange = (e, field) => {
    setEditedData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/companies/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(editedData),
        }
      );
      if (!res.ok) throw new Error();
      message.success("Entreprise mise à jour");
      setEditingId(null);
      setEditedData({});
      fetchCompanies();
    } catch {
      message.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/companies/${id}`,
        {
          method: "DELETE",
          headers: { token },
        }
      );
      if (!res.ok) throw new Error();
      message.success("Entreprise supprimée");
      fetchCompanies();
    } catch {
      message.error("Erreur lors de la suppression");
    }
  };

  const renderEditable = (field, r) =>
    editingId === r.company_id ? (
      <Input
        value={editedData[field]}
        onChange={(e) => handleChange(e, field)}
      />
    ) : (
      r[field]
    );

  const columns = [
    { title: "Entreprise", render: (_, r) => renderEditable("name", r) },
    { title: "Secteur", render: (_, r) => renderEditable("industry", r) },
    {
      title: "Chiffre d'affaires",
      render: (_, r) => renderEditable("revenue", r),
    },
    { title: "Taille", render: (_, r) => renderEditable("size", r) },
    { title: "Site Web", render: (_, r) => renderEditable("website", r) },
    {
      title: "Responsable",
      render: (_, r) =>
        editingId === r.company_id ? (
          <>
            <Input
              placeholder="Prénom"
              value={editedData.firstname}
              onChange={(e) => handleChange(e, "firstname")}
              style={{ marginBottom: 4 }}
            />
            <Input
              placeholder="Nom"
              value={editedData.lastname}
              onChange={(e) => handleChange(e, "lastname")}
            />
          </>
        ) : (
          `${r.firstname} ${r.lastname}`
        ),
    },
    { title: "Email", render: (_, r) => renderEditable("email", r) },
    { title: "Téléphone", render: (_, r) => renderEditable("phone", r) },
    {
      title: "Adresse",
      render: (_, r) =>
        editingId === r.company_id ? (
          <>
            <Input
              placeholder="Rue"
              value={editedData.street}
              onChange={(e) => handleChange(e, "street")}
              style={{ marginBottom: 4 }}
            />
            <Input
              placeholder="Ville"
              value={editedData.city}
              onChange={(e) => handleChange(e, "city")}
              style={{ marginBottom: 4 }}
            />
            <Input
              placeholder="Code postal"
              value={editedData.pc}
              onChange={(e) => handleChange(e, "pc")}
              style={{ marginBottom: 4 }}
            />
            <Input
              placeholder="Pays"
              value={editedData.country}
              onChange={(e) => handleChange(e, "country")}
            />
          </>
        ) : (
          `${r.street}, ${r.city}, ${r.pc}, ${r.country}`
        ),
    },
    {
      title: "Actions",
      render: (_, r) =>
        editingId === r.company_id ? (
          <Button type="link" onClick={handleSave}>
            Enregistrer
          </Button>
        ) : (
          <>
            <Button type="link" onClick={() => handleEdit(r)}>
              Modifier
            </Button>
            <Button
              type="link"
              danger
              onClick={() => handleDelete(r.company_id)}
            >
              Supprimer
            </Button>
          </>
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
          Liste des sociétés
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
          Total des sociétés : <strong>{companies.length}</strong>
        </motion.p>
        <div style={{ marginBottom: 20, textAlign: "right" }}>
          <span style={{ marginRight: 10 }}>Filtrer par secteur :</span>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option value="all">Tous les secteurs</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "10px",
            marginBottom: "20px",
          }}
        >
          {industries.map((ind) => (
            <div
              key={ind}
              style={{
                background: "#fff",
                border: "1px solid #ddd",
                padding: "10px 15px",
                borderRadius: "8px",
                minWidth: "150px",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <strong>{ind}</strong>
              <div>{industryCounts[ind]} sociétés</div>
            </div>
          ))}
        </div>
        <Table
          columns={columns}
          dataSource={filteredCompanies.map((c) => ({
            ...c,
            key: c.company_id,
          }))}
          loading={loading}
        />
      </Layout.Content>
    </Layout>
  );
}
