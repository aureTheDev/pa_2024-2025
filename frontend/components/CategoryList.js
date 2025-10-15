"use client";
import { Typography, Card, Row, Col, Layout } from "antd";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
const { Title } = Typography;

export default function CategoryList({ categories }) {
  const router = useRouter();

  const handleClick = (categoryId) => {
    router.push(`/forum/${categoryId}`);
  };

  const handleRetour = () => {
    router.push("/salaries/accueil");
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
          Liste des categories
        </motion.h1>
        <Title level={3}>Choisissez une catégorie</Title>
        <Row gutter={[16, 16]}>
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map((cat) => (
              <Col key={cat.category_id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  style={{ textAlign: "center" }}
                  onClick={() => handleClick(cat.category_id)}
                >
                  <Title level={5}>{cat.title}</Title>
                </Card>
              </Col>
            ))
          ) : (
            <p>Aucune catégorie trouvée.</p>
          )}
        </Row>
      </Layout.Content>
    </Layout>
  );
}
