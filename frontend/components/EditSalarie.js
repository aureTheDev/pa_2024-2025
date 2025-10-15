import { useRouter } from "next/router";
import { Layout, Form, Input, Button, message } from "antd";
import { useEffect } from "react";
import {
  SaveOutlined,
  CloseCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import styles from "../styles/EditSalarie.module.css";

const EditSalarie = ({ salarie, token }) => {
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    if (salarie) {
      const formattedSalarie = {
        ...salarie,
        dob: salarie.dob?.slice(0, 10) || "",
      };
      form.setFieldsValue(formattedSalarie);
    }
  }, [salarie]);

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        company_id: salarie.company_id,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/collaborators/${salarie.collaborator_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Erreur");

      message.success("Collaborateur mis à jour !");
      router.push("/societes/salaries");
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      message.error("Une erreur est survenue");
    }
  };

  return (
    <Layout className={styles.layout}>
      <Layout.Content className={styles.content}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.title}
        >
          Modifier le Collaborateur
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
            {[
              {
                name: "lastname",
                label: "Nom",
                icon: <UserOutlined />,
                required: true,
              },
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
              { name: "country", label: "Pays", icon: <EnvironmentOutlined /> },
              { name: "city", label: "Ville", icon: <EnvironmentOutlined /> },
              { name: "street", label: "Rue", icon: <EnvironmentOutlined /> },
              {
                name: "pc",
                label: "Code postal",
                icon: <EnvironmentOutlined />,
              },
            ].map(({ name, label, icon, required, type }) => (
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
                    ? [{ required: true, message: `${label} est requis` }]
                    : []
                }
              >
                <Input type={type || "text"} className={styles.input} />
              </Form.Item>
            ))}

            <Form.Item>
              <div className={styles.buttonGroup}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
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

export default EditSalarie;
