import React, { useEffect, useState } from "react";
import { Table, Button, message, Modal, Input } from "antd";
import { Layout } from "antd";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

export default function AdminCollaborators() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const router = useRouter();

  const handleRetour = () => router.push("/admin/accueil");

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/collaborators`,
        {
          headers: { token },
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCollaborators(data);
    } catch {
      message.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/collaborators/${id}`,
        {
          method: "DELETE",
          headers: { token },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur lors de la suppression");
      }
      message.success("Collaborateur supprimé");
      fetchCollaborators();
    } catch (error) {
      message.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleEdit = (record) => {
    setEditing(record);
    setEditValues({ ...record });
  };

  const submitEdit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/collaborators/${editing.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(editValues),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la modification");
      message.success("Collaborateur modifié");
      setEditing(null);
      fetchCollaborators();
    } catch (error) {
      message.error(error.message || "Erreur lors de la modification");
    }
  };

  const columns = [
    { title: "Prénom", dataIndex: "firstname" },
    { title: "Nom", dataIndex: "lastname" },
    { title: "Date de naissance", dataIndex: "dob" },
    { title: "Email", dataIndex: "email" },
    { title: "Téléphone", dataIndex: "phone" },
    {
      title: "Adresse",
      render: (_, r) => `${r.street}, ${r.city}, ${r.pc}, ${r.country}`,
    },
    { title: "Entreprise", dataIndex: "company_name" },
    {
      title: "Actions",
      render: (_, r) => (
        <>
          <Button type="link" onClick={() => handleEdit(r)}>
            Modifier
          </Button>
          <Button type="link" danger onClick={() => handleDelete(r.user_id)}>
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
          Liste des collaborateurs
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
          Total des collaborateurs : <strong>{collaborators.length}</strong>
        </motion.p>
        <Table
          columns={columns}
          dataSource={collaborators.map((c) => ({ ...c, key: c.user_id }))}
          loading={loading}
        />
        <Modal
          title="Modifier le collaborateur"
          open={!!editing}
          onOk={submitEdit}
          onCancel={() => setEditing(null)}
        >
          {Object.entries(editValues).map(([key, value]) =>
            key !== "user_id" && key !== "company_name" ? (
              <Input
                key={key}
                value={value}
                onChange={(e) =>
                  setEditValues({ ...editValues, [key]: e.target.value })
                }
                placeholder={key}
                style={{ marginBottom: 10 }}
              />
            ) : null
          )}
        </Modal>
      </Layout.Content>
    </Layout>
  );
}