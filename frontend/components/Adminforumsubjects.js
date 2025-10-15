// components/Adminforumsubjects.js
import { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Layout,
  Space,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const { Title } = Typography;
const { Option } = Select;

export default function AdminForumSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editedTitle, setEditedTitle] = useState("");

  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/subjects`,
        {
          headers: { token },
        }
      );
      const data = await res.json();
      setSubjects(data);
    } catch {
      message.error("Erreur lors du chargement des sujets");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/categories`,
        {
          headers: { token },
        }
      );
      const data = await res.json();
      setCategories(data);
    } catch {
      message.error("Erreur lors du chargement des catégories");
    }
  };

  const handleDelete = async (subject_id) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/subjects/${subject_id}`,
        {
          method: "DELETE",
          headers: { token },
        }
      );
      if (!res.ok) throw new Error();
      message.success("Sujet supprimé");
      fetchSubjects();
    } catch {
      message.error("Erreur lors de la suppression");
    }
  };

  const handleEdit = (record) => {
    setEditing(record);
    setEditedTitle(record.title);
  };

  const submitEdit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/subjects/${editing.subject_id}`,
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
      message.success("Sujet mis à jour");
      setEditing(null);
      fetchSubjects();
    } catch {
      message.error("Erreur lors de la mise à jour");
    }
  };

  const handleAddSubject = async () => {
    if (!newTitle || !selectedCategory) {
      message.warning("Veuillez entrer un titre et choisir une catégorie");
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/forum/subjects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(newTitle, selectedCategory),
        }
      );
      if (!res.ok) throw new Error();
      message.success("Sujet ajouté");
      setNewTitle("");
      setSelectedCategory("");
      fetchSubjects();
    } catch {
      message.error("Erreur lors de l'ajout");
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchCategories();
  }, []);

  const columns = [
    { title: "Titre", dataIndex: "title", key: "title" },
    {
      title: "Date",
      dataIndex: "creation_date",
      render: (val) => new Date(val).toLocaleString(),
    },
    { title: "Catégorie", dataIndex: "category_name" },
    { title: "Collaborateur", dataIndex: "collaborator_name" },
    {
      title: "Modifier",
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
      ),
    },
    {
      title: "Supprimer",
      render: (_, record) => (
        <Popconfirm
          title="Confirmer la suppression ?"
          onConfirm={() => handleDelete(record.subject_id)}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Layout style={{ background: "#f9fbfd" }}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="Retour"
        onClick={() => router.push("/admin/accueil")}
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
        style={{ maxWidth: 1000, margin: "70px auto", padding: 30 }}
      >
        <Title level={2} style={{ textAlign: "center", color: "#007b7f" }}>
          Sujets du forum
        </Title>
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
          Total des Sujets du forum : <strong>{subjects.length}</strong>
        </motion.p>
        <Table
          columns={columns}
          dataSource={subjects.map((s) => ({ ...s, key: s.subject_id }))}
          loading={loading}
          bordered
        />

        <div style={{ marginTop: 32 }}>
          <Space>
            <Input
              placeholder="Titre du nouveau sujet"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Choisir une catégorie"
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 250 }}
            >
              {categories.map((c) => (
                <Option key={c.category_id} value={c.category_id}>
                  {c.title}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddSubject}
            >
              Ajouter
            </Button>
          </Space>
        </div>

        <Modal
          title="Modifier le sujet"
          open={!!editing}
          onOk={submitEdit}
          onCancel={() => setEditing(null)}
        >
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Nouveau titre"
          />
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
