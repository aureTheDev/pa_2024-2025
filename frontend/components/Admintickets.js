import { useEffect, useState } from "react";
import { Table, Typography, Button, Tag, message, Layout } from "antd";
import { DeleteOutlined, MailOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { Modal, Input } from "antd";
import { useRouter } from "next/router";
const { Title } = Typography;

const { TextArea } = Input;

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  const router = useRouter();

  const fetchTickets = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets`,
        {
          headers: { token },
        }
      );
      const data = await res.json();
      console.log("Tickets reçus :", data);
      setTickets(data);
    } catch {
      message.error("Erreur de chargement des tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async () => {
    const token = localStorage.getItem("token");
    if (!replyMessage.trim()) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${currentTicketId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({ text: replyMessage }),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la réponse au ticket");
      message.success("Réponse envoyée avec succès");
      setReplyModalVisible(false);
      setReplyMessage("");
      fetchTickets();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: "Titre", dataIndex: "title", key: "title" },
    { title: "Message", dataIndex: "text", key: "text" },
    {
      title: "Statut",
      key: "status",
      render: (_, record) =>
        record.close_date ? (
          <Tag color="green">Fermé</Tag>
        ) : (
          <Tag color="orange">Ouvert</Tag>
        ),
    },
    {
      title: "Créé par",
      key: "user",
      render: (_, record) => `${record.user_firstname} ${record.user_lastname}`,
    },
    { title: "Rôle", dataIndex: "user_role", key: "user_role" },
    {
      title: "Répondre",
      key: "reply",
      render: (_, record) => (
        <Button
          icon={<MailOutlined />}
          onClick={() => router.push(`/admin/${record.ticket_id}`)}
        />
      ),
    },

    {
      title: "Fermer",
      key: "close",
      render: (_, record) =>
        record.status === "Terminé" ? null : (
          <Button
            type="primary"
            onClick={async () => {
              const confirmed = window.confirm("Fermer ce ticket ?");
              if (!confirmed) return;
              const token = localStorage.getItem("token");
              try {
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${record.ticket_id}/close`,
                  {
                    method: "POST",
                    headers: { token },
                  }
                );
                if (!res.ok) throw new Error("Échec de la fermeture");
                message.success("Ticket fermé !");
                fetchTickets();
              } catch (err) {
                message.error(err.message);
              }
            }}
          >
            Fermer
          </Button>
        ),
    },
    ,
    {
      title: "Supprimer",
      key: "delete",
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={async () => {
            const confirmed = window.confirm(
              "Confirmer la suppression de ce ticket ?"
            );
            if (!confirmed) return;

            const token = localStorage.getItem("token");

            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${record.ticket_id}`,
                {
                  method: "DELETE",
                  headers: { token },
                }
              );

              if (!res.ok) throw new Error("Échec de la suppression");

              message.success("Ticket supprimé avec succès !");
              setTickets((prev) =>
                prev.filter((t) => t.ticket_id !== record.ticket_id)
              );
            } catch (err) {
              console.error(err);
              message.error("Erreur lors de la suppression.");
            }
          }}
        />
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
          Liste des tickets
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
          Total des tickets: <strong>{tickets.length}</strong>
        </motion.p>
        <Table
          columns={columns}
          dataSource={
            Array.isArray(tickets)
              ? tickets.map((t) => ({ ...t, key: t.ticket_id }))
              : []
          }
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
        />
        <Modal
          open={replyModalVisible}
          title="Répondre au ticket"
          onCancel={() => setReplyModalVisible(false)}
          onOk={handleSendReply}
          okText="Envoyer"
        >
          <TextArea
            rows={5}
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Saisissez votre réponse ici"
          />
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
