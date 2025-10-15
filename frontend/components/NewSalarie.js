import { useRouter } from "next/router";
import { Layout, Form, Input, Button, message } from "antd";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import {
  SaveOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import styles from "../styles/NewSalarie.module.css";

const NewSalarie = () => {
  const router = useRouter();
  const [form] = Form.useForm();
  const handleRetour = () => router.push("/societes/accueil");
  const handleSubmit = async (values) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      if (!token) {
        message.error("Token manquant");
        return;
      }

      const decoded = JSON.parse(atob(token.split(".")[1]));
      const company_id = decoded.user_id;
      const user_id = uuidv4();

      const payload = {
        ...values,
        dob: dayjs(values.dob).format("YYYY-MM-DD"),
        user_id,
        collaborator_id: user_id,
        company_id,
        role: "collaborator",
        function: "collaborator",
        verified: false,
        inscription_date: new Date().toISOString(),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/collaborators`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erreur lors de l’ajout");
      }

      message.success("Collaborateur ajouté !");
      router.push("/societes/salaries");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Une erreur est survenue");
    }
  };
  const fields = [
    { name: "lastname", label: "Nom", icon: <UserOutlined />, required: true },
    {
      name: "firstname",
      label: "Prénom",
      icon: <UserOutlined />,
      required: true,
    },
    {
      name: "email",
      label: "Email",
      icon: <MailOutlined />,
      required: true,
      type: "email",
    },
    { name: "phone", label: "Téléphone", icon: <PhoneOutlined /> },
    {
      name: "dob",
      label: "Date de naissance",
      icon: <CalendarOutlined />,
      type: "date",
    },
    {
      name: "password",
      label: "Mot de passe",
      icon: <LockOutlined />,
      password: true,
    },
    { name: "country", label: "Pays", icon: <EnvironmentOutlined /> },
    { name: "city", label: "Ville", icon: <EnvironmentOutlined /> },
    { name: "street", label: "Rue", icon: <EnvironmentOutlined /> },
    { name: "pc", label: "Code postal", icon: <EnvironmentOutlined /> },
  ];

  return (
    <Layout className={styles.layout}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="go back"
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
      <Layout.Content className={styles.content}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.title}
        >
          Ajouter un Collaborateur
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={styles.formWrapper}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.form}
          >
            {fields.map(({ name, label, icon, required, type, password }) => (
              <Form.Item
                key={name}
                name={name}
                label={
                  <span className={styles.label}>
                    {icon} {label}
                  </span>
                }
                rules={
                  required
                    ? [{ required: true, message: `${label} requis` }]
                    : []
                }
              >
                {password ? (
                  <Input.Password className={styles.input} />
                ) : (
                  <Input className={styles.input} type={type || "text"} />
                )}
              </Form.Item>
            ))}

            <Form.Item>
              <div className={styles.buttonGroup}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  className={styles.saveButton}
                >
                  Enregistrer
                </Button>
                <Button
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => router.push("/societes/salaries")}
                  className={styles.cancelButton}
                >
                  Annuler
                </Button>
              </div>
            </Form.Item>
          </Form>
        </motion.div>
      </Layout.Content>
    </Layout>
  );
};

export default NewSalarie;
