import React, { useEffect, useState } from "react";
import { Table, Typography, Layout, Spin, Tag, Button, message } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

const EventsByNgo = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const router = useRouter();
  const { ngoId } = router.query;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchEvents = async () => {
    if (!ngoId || !token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/ngos/${ngoId}/events`,
        {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      if (!res.ok) throw new Error("Erreur de chargement des événements");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedEvents = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/events/joined`,
        {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      const data = await res.json();
      setJoinedEvents(data.map((event) => event.event_id));
    } catch (err) {
      console.error("Erreur de chargement des événements rejoints", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchJoinedEvents();
  }, [ngoId]);

  const handleJoin = async (eventId) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/events/${eventId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      if (res.status === 409) {
        message.error("Événement complet");
        return;
      }
      if (!res.ok) throw new Error("Erreur lors de la participation");
      message.success("Vous avez rejoint l'événement");
      setJoinedEvents([...joinedEvents, eventId]);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleLeave = async (eventId) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/events/${eventId}/leave`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token,
          },
        }
      );
      if (!res.ok) throw new Error("Erreur lors de l'annulation");
      message.success("Participation annulée");
      setJoinedEvents(joinedEvents.filter((id) => id !== eventId));
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: "Titre", dataIndex: "title", key: "title" },
    { title: "Lieu", dataIndex: "place", key: "place" },
    { title: "Date de début", dataIndex: "begin_at", key: "begin_at" },
    { title: "Date de fin", dataIndex: "end_at", key: "end_at" },
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
      title: "Joindre",
      key: "join",
      render: (_, record) => {
        const isFuture = dayjs().isBefore(dayjs(record.begin_at));
        if (!isFuture) return null;
        const joined = joinedEvents.includes(record.event_id);
        return joined ? (
          <Button danger onClick={() => handleLeave(record.event_id)}>
            Annuler
          </Button>
        ) : (
          <Button type="primary" onClick={() => handleJoin(record.event_id)}>
            Rejoindre
          </Button>
        );
      },
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
        onClick={() => router.back()}
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
      <Layout.Content style={{ width: "85%", margin: "70px auto" }}>
        <Title level={2} style={{ textAlign: "center", color: "#007b7f" }}>
          Événements de l'association
        </Title>
        {loading ? (
          <Spin size="large" />
        ) : (
          <Table
            dataSource={events}
            columns={columns}
            rowKey="event_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        )}
      </Layout.Content>
    </Layout>
  );
};

export default EventsByNgo;
