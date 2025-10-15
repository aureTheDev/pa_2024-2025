"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DeleteOutlined } from "@ant-design/icons";
import {
  Layout,
  Input,
  Button,
  Card,
  Typography,
  message as antdMessage,
} from "antd";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function SubjectDiscussion() {
  const router = useRouter();
  const { subjectId, categoryId } = router.query;
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [loading, setLoading] = useState(false);
  const [collaboratorId, setCollaboratorId] = useState(null);

  const token =
    typeof window !== "undefined"
      ? document.cookie
          ?.split("; ")
          ?.find((row) => row.startsWith("access_token="))
          ?.split("=")[1]
      : "";
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCollaboratorId(payload.user_id);
      } catch (err) {
        console.error("Erreur de décodage du token :", err);
      }
    }
  }, [token]);

  const fetchPosts = async () => {
    if (!subjectId || !token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forum/subjects/${subjectId}/posts`,
        {
          headers: { token },
        }
      );
      if (!res.ok) throw new Error("Erreur lors du chargement des messages");
      const data = await res.json();

      const sorted = data.sort(
        (a, b) => new Date(a.creation_date) - new Date(b.creation_date)
      );

      setPosts(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forum/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({
            text: newPostText,
            subject_id: subjectId,
          }),
        }
      );
      if (!res.ok) throw new Error("Échec de l'envoi du message");
      setNewPostText("");
      await fetchPosts();
    } catch (err) {
      antdMessage.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forum/posts/${postId}`,
        {
          method: "DELETE",
          headers: { token },
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      await fetchPosts();
    } catch (err) {
      antdMessage.error(err.message);
    }
  };

  const handleRetour = () => {
    if (categoryId) {
      router.push(`/forum/${categoryId}`);
    } else {
      antdMessage.warning("Catégorie non définie, impossible de revenir.");
    }
  };

  useEffect(() => {
    if (subjectId && token) fetchPosts();
  }, [subjectId, token]);

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
          padding: 0,
          marginTop: 70,
          width: "100%",
          height: "calc(100vh - 70px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ textAlign: "center", color: "#007b7f" }}>
          Discussion
        </Title>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            overflowY: "auto",
            width: "70%",
            margin: "0 auto",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          {posts.length === 0 ? (
            <Paragraph style={{ textAlign: "center" }}>
              Aucun message pour ce sujet.
            </Paragraph>
          ) : (
            posts.map((post) => {
              console.log("POST", post);
              console.log("POST.collaborator_id:", post.collaborator_id);
              console.log("Token collaborator_id:", collaboratorId);

              return (
                <Card
                  key={post.post_id}
                  style={{
                    marginBottom: 16,
                    display: "inline-block",
                    maxWidth: "80%",
                    wordBreak: "break-word",
                  }}
                  title={`${post.firstname} ${post.lastname}`}
                  extra={
                    collaboratorId &&
                    String(post.collaborator_id) === String(collaboratorId) ? (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(post.post_id)}
                      />
                    ) : null
                  }
                >
                  <Paragraph>{post.text}</Paragraph>
                  <Paragraph type="secondary" style={{ fontSize: "0.85rem" }}>
                    Posté le {new Date(post.creation_date).toLocaleString()}
                  </Paragraph>
                </Card>
              );
            })
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #ccc",
            padding: "16px",
            background: "#f9fbfd",
            position: "sticky",
            bottom: 0,
            width: "100%",
          }}
        >
          <div style={{ width: "70%", margin: "0 auto" }}>
            <TextArea
              rows={3}
              placeholder="Écrire un message..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
            />
            <Button
              type="primary"
              onClick={handlePost}
              loading={loading}
              style={{ marginTop: 12 }}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </Layout.Content>
    </Layout>
  );
}
