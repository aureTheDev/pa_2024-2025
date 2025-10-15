import React, { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Layout,
  Spin,
  Button,
  Form,
  Input,
  DatePicker,
  message,
  Modal,
  Tag,
} from "antd";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { EyeOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { TextArea } = Input;

const AdminAssociations = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const [visibleNgoEvents, setVisibleNgoEvents] = useState(null);
  const [ngoEvents, setNgoEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventForm] = Form.useForm();

  const handleCreateEvent = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const values = await eventForm.validateFields();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/ngos/${visibleNgoEvents}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({
            ...values,
            begin_at: values.begin_at.toISOString(),
            end_at: values.end_at.toISOString(),
          }),
        }
      );

      if (!res.ok) throw new Error("Erreur lors de la création");

      message.success("Événement créé");
      setShowCreateEventModal(false);
      eventForm.resetFields();
      fetchNgoEvents(visibleNgoEvents);
    } catch (err) {
      message.error(err.message);
    }
  };

  const fetchNgoEvents = async (ngoId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setLoadingEvents(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/ngos/${ngoId}/events`,
        {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      if (!res.ok) throw new Error("Erreur de chargement des événements");
      const data = await res.json();
      setNgoEvents(data);
      setVisibleNgoEvents(ngoId);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  const deleteEvent = async (eventId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/events/${eventId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      message.success("Événement supprimé");
      fetchNgoEvents(visibleNgoEvents);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleRetour = () => router.push("/admin/accueil");

  const fetchNgos = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ngos`, {
        headers: {
          "Content-Type": "application/json",
          token,
        },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des associations");
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

  const handleDelete = async (ngoId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/ngos/${ngoId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur lors de la suppression");
      }
      message.success("Association supprimée");
      fetchNgos();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async (values) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ngos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      message.success("Association ajoutée");
      form.resetFields();
      setShowForm(false);
      fetchNgos();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: "Nom", dataIndex: "name", key: "name" },
    {
      title: "N° d'enregistrement",
      dataIndex: "registration_number",
      key: "registration_number",
    },
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="text"
          icon={<DeleteOutlined style={{ color: "red" }} />}
          onClick={() => handleDelete(record.ngo_id)}
        />
      ),
    },
    {
      title: "Événements",
      key: "events",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => fetchNgoEvents(record.ngo_id)}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fbfd", overflowX: "auto" }}>
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
          Liste des associations
        </motion.h1>
        {loading ? (
          <Spin size="large" />
        ) : (
          <>
            <Table
              dataSource={ngos}
              columns={columns}
              rowKey="ngo_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: "max-content" }}
            />
            <div style={{ marginTop: "30px", textAlign: "center" }}>
              <Button type="primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Annuler" : "Ajouter une association"}
              </Button>
            </div>
            {showForm && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                style={{
                  marginTop: "30px",
                  background: "#fff",
                  padding: 20,
                  borderRadius: 8,
                }}
              >
                <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item
                  name="registration_number"
                  label="N° d'enregistrement"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="address" label="Adresse" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="country" label="Pays" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="presentation" label="Présentation" rules={[{ required: true }]}>
                  <TextArea rows={4} />
                </Form.Item>
                <Form.Item name="website" label="Site web" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="phone" label="Téléphone" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Enregistrer
                  </Button>
                </Form.Item>
              </Form>
            )}
          </>
        )}
        <Modal
          open={!!visibleNgoEvents}
          onCancel={() => setVisibleNgoEvents(null)}
          title="Événements de l'association"
          footer={null}
          width={1000}
        >
          {loadingEvents ? (
            <Spin />
          ) : (
            <>
              <Table
                dataSource={ngoEvents}
                rowKey="event_id"
                pagination={false}
                columns={[
                  { title: "Titre", dataIndex: "title", key: "title" },
                  { title: "Lieu", dataIndex: "place", key: "place" },
                  { title: "Début", dataIndex: "begin_at", key: "begin_at" },
                  { title: "Fin", dataIndex: "end_at", key: "end_at" },
                  { title: "Capacité", dataIndex: "capacity", key: "capacity" },
                  {
                    title: "Statut",
                    key: "statut",
                    render: (_, record) => {
                      const isFuture = dayjs().isBefore(dayjs(record.begin_at));
                      return (
                        <Tag color={isFuture ? "blue" : "green"}>
                          {isFuture ? "À venir" : "Passé"}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: "",
                    key: "delete",
                    render: (_, record) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => deleteEvent(record.event_id)}
                      />
                    ),
                  },
                ]}
              />
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowCreateEventModal(true)}
                >
                  Créer un événement
                </Button>
              </div>
            </>
          )}
        </Modal>
        <Modal
          open={showCreateEventModal}
          onCancel={() => setShowCreateEventModal(false)}
          title="Créer un événement"
          onOk={handleCreateEvent}
          okText="Créer"
        >
          <Form form={eventForm} layout="vertical">
            <Form.Item
              name="title"
              label="Titre"
              rules={[{ required: true, message: "Veuillez entrer le titre" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="place"
              label="Lieu"
              rules={[{ required: true, message: "Veuillez entrer le lieu" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="begin_at"
              label="Début"
              rules={[{ required: true, message: "Date de début requise" }]}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="end_at"
              label="Fin"
              rules={[{ required: true, message: "Date de fin requise" }]}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="capacity"
              label="Capacité"
              rules={[{ required: true, message: "Capacité requise" }]}
            >
              <Input type="number" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Content>
    </Layout>
  );
};

export default AdminAssociations;