import { Card, Col, Row, Typography, Layout } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

import { Modal, Button, Form, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;


const getCookie = (cookieName) => {
  if (typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
  return cookie ? cookie.split("=")[1] : null;
};

export default function SubjectsByCategory({ subjects }) {
  const router = useRouter();
  const categoryId = router.query.categoryId || "";
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleClick = (subjectId) => {
    router.push(`/forum/${categoryId}/${subjectId}`);
  };

  const handleRetour = () => {
    router.push("/forum");
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreateSubject = async (values) => {
    try {
      const token = getCookie("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forum/subjects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify({
            title: values.title,
            category_id: categoryId,
          }),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la création");
      message.success("Sujet créé avec succès !");
      setIsModalVisible(false);
      form.resetFields();
      router.reload();
    } catch (err) {
      message.error("Impossible de créer le sujet.");
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
          padding: "40px",
          marginTop: "70px",
          width: "80%",
          margin: "0 auto",
        }}
      >
        <Title level={2} style={{ textAlign: "center", color: "#007b7f" }}>
          Sujets de la catégorie
        </Title>

        <Row gutter={[16, 16]}>
          {Array.isArray(subjects) && subjects.length > 0 ? (
            subjects.map((subject) => (
              <Col key={subject.subject_id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  style={{ textAlign: "center" }}
                  onClick={() => handleClick(subject.subject_id)}
                >
                  <Title level={5}>{subject.title}</Title>
                </Card>
              </Col>
            ))
          ) : (
            <p style={{ textAlign: "center", width: "100%" }}>
              Aucun sujet trouvé pour cette catégorie.
            </p>
          )}

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "120px",
              }}
              onClick={showModal}
            >
              <PlusOutlined style={{ fontSize: "24px" }} />
            </Card>
          </Col>
        </Row>

        <Modal
          title="Créer un sujet"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleCreateSubject}>
            <Form.Item
              name="title"
              label="Titre"
              rules={[{ required: true, message: "Veuillez entrer un titre" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Créer
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
