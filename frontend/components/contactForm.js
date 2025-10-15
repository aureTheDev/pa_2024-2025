import { useState, useEffect } from "react";
import { Form, Input, Button, message, Typography, Layout } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Table, Modal, List } from "antd";

const { Title } = Typography;
const { TextArea } = Input;


const getCookie = (cookieName) => {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
    return cookie ? cookie.split("=")[1] : null;
};

export default function CreateTicket() {
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ticket/myTickets`,
        {
          headers: { token },
        }
      );
      const data = await res.json();
      setTickets(data);
    };

    fetchTickets();
  }, []);

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    if (!token || !activeTicket) return;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ticket/${activeTicket.ticket_id}/reply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: token,
        },
        body: JSON.stringify({ text: reply }),
      }
    );

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ticket/${activeTicket.ticket_id}/messages`,
      {
        headers: {
          "Content-Type": "application/json",
          token: token,
        },
      }
    );

    const data = await res.json();
    setMessages(data.messages);
    setReply("");
  };

  const onFinish = async (values) => {
    setLoading(true);
    const token = getCookie("access_token");
    if (!token) {
      message.error("Vous devez être connecté pour envoyer un ticket.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ticket/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erreur lors de la création du ticket");
      }

      const ticketCreated = await res.json();
      setTickets((prev) =>
        Array.isArray(prev) ? [...prev, ticketCreated] : [ticketCreated]
      );

      message.success("Ticket envoyé avec succès !");
    } catch (err) {
      message.error(err.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="Retour"
        style={{
          height: 40,
          width: 40,
          position: "fixed",
          top: 20,
          left: 20,
          cursor: "pointer",
        }}
      />
      <Layout.Content style={{ padding: "40px 50px", marginTop: 90 }}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: "center", fontSize: "2rem", color: "#007b7f" }}
        >
          Creer un ticket
        </motion.h1>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Titre"
            name="title"
            rules={[{ required: true, message: "Veuillez entrer un titre" }]}
          >
            <Input placeholder="Problème ou sujet..." />
          </Form.Item>

          <Form.Item
            label="Message"
            name="text"
            rules={[{ required: true, message: "Veuillez entrer un message" }]}
          >
            <TextArea
              rows={6}
              placeholder="Expliquez votre demande ou problème..."
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Envoyer le ticket
            </Button>
          </Form.Item>
        </Form>
        <Table
          dataSource={tickets}
          rowKey="ticket_id"
          pagination={false}
          style={{ marginTop: 40 }}
          columns={[
            { title: "Titre", dataIndex: "title", key: "title" },
            { title: "Message", dataIndex: "text", key: "text" },
            {
              title: "Écrire",
              key: "action",
              render: (_, record) => (
                <Button
                  type="link"
                  onClick={async () => {
                    setActiveTicket(record);
                    const token = localStorage.getItem("token");
                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/ticket/${record.ticket_id}/messages`,
                      {
                        headers: {
                          "Content-Type": "application/json",
                          token: token,
                        },
                      }
                    );
                    const data = await res.json();
                    setMessages(data.messages);
                    setMessageModalVisible(true);
                  }}
                >
                  Écrire
                </Button>
              ),
            },
          ]}
        />
        <Modal
          open={messageModalVisible}
          title={`Échange - ${activeTicket?.title}`}
          onCancel={() => setMessageModalVisible(false)}
          footer={null}
        >
          <List
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
          />

          <TextArea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Votre réponse..."
            style={{ marginTop: 10 }}
          />
          <Button
            type="primary"
            onClick={handleSend}
            style={{ marginTop: 10 }}
            block
          >
            Envoyer
          </Button>
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
