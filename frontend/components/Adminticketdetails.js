import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Layout, Typography, message, Input, Button, List } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title } = Typography;
const { TextArea } = Input;

export default function TicketDetails() {
  const router = useRouter();
  const { ticket_id } = router.query;
  const [messages, setMessages] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}/messages`,
        { headers: { token } }
      );
      const data = await res.json();
      setMessages(data.messages || []);
      setTicket(data.ticket);
    } catch {
      message.error("Erreur lors du chargement du ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticket_id) fetchMessages();
  }, [ticket_id]);

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    if (!reply.trim()) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ text: reply }),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la réponse");
      message.success("Réponse envoyée");
      setReply("");
      fetchMessages();
    } catch (err) {
      message.error(err.message);
    }
  };

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
        <Title level={3} style={{ color: "#007b7f" }}>
          {ticket?.title || "Ticket"}
        </Title>

        <List
          loading={loading}
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <Typography.Text strong>
                {msg.user_name || msg.admin_name || "Utilisateur"}
              </Typography.Text>
              <Typography.Paragraph>{msg.text}</Typography.Paragraph>
              <Typography.Text type="secondary" style={{ fontSize: "0.8em" }}>
                {new Date(msg.creation_date).toLocaleString()}
              </Typography.Text>
            </List.Item>
          )}
          style={{ marginTop: 20, marginBottom: 30 }}
        />

        <TextArea
          rows={4}
          placeholder="Votre réponse"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />

        <Button type="primary" onClick={handleSend} style={{ marginTop: 10 }}>
          Envoyer
        </Button>
      </Layout.Content>
    </Layout>
  );
}
