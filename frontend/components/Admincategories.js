import { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Button,
  Input,
  message,
  Space,
  Layout,
  Popconfirm,
  Modal,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const { Title } = Typography;

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const router = useRouter();
  const handleRetour = () => router.push("/admin/accueil");

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/categories`,
        {
          headers: { token },
        }
      );
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      message.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newTitle) return message.warning("Veuillez entrer un titre");
    const token = localStorage.getItem("token");
    if (!token) return message.warning("Token manquant");

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(newTitle),
        }
      );
      if (!res.ok) throw new Error();
      message.success("Catégorie ajoutée");
      setNewTitle("");
      fetchCategories();
    } catch {
      message.error("Erreur lors de l'ajout de la catégorie");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category_id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/categories/${category_id}`,
        {
          method: "DELETE",
          headers: { token },
        }
      );
      if (!res.ok) throw new Error();
      message.success("Catégorie supprimée");
      fetchCategories();
    } catch {
      message.error("Erreur lors de la suppression");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setEditedTitle(category.title);
  };

  const submitEdit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/categories/${editingCategory.category_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(editedTitle),
        }
      );
      if (!res.ok) throw new Error();
      message.success("Catégorie mise à jour");
      setEditingCategory(null);
      fetchCategories();
    } catch {
      message.error("Erreur lors de la mise à jour");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "category_id", key: "category_id" },
    { title: "Titre", dataIndex: "title", key: "title" },
    {
      title: "Modifier",
      key: "edit",
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
      ),
    },
    {
      title: "Supprimer",
      key: "delete",
      render: (_, record) => (
        <Popconfirm
          title="Supprimer cette catégorie ?"
          onConfirm={() => handleDelete(record.category_id)}
          okText="Oui"
          cancelText="Non"
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
          Liste des catégories de forum
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
          Total des categories : <strong>{categories.length}</strong>
        </motion.p>
        <Table
          columns={columns}
          dataSource={categories.map((cat) => ({
            ...cat,
            key: cat.category_id,
          }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
        />

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Nom de la nouvelle catégorie"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ maxWidth: 500 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={submitting}
              onClick={handleAddCategory}
            >
              Ajouter
            </Button>
          </Space.Compact>
        </div>

        <Modal
          title="Modifier le titre"
          visible={!!editingCategory}
          onOk={submitEdit}
          onCancel={() => setEditingCategory(null)}
          okText="Enregistrer"
          cancelText="Annuler"
        >
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
          />
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
