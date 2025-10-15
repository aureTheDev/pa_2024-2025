import React, { useState, useEffect } from "react";
import { Layout, Form, Button, message, Modal } from "antd";
import moment from "moment";
import "moment/locale/fr";
import styles from "../styles/MonPlanning.module.css";
import { FaCalendarCheck } from "react-icons/fa";
import { useRouter } from "next/router";

moment.locale("fr");

const getCookie = (cookieName) => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
  return cookie ? cookie.split("=")[1] : null;
};

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (err) {
    return null;
  }
};

const MonPlanning = () => {
  const router = useRouter();
  const handleRetour = () => {
    router.push("/prestataires/accueil");
  };

  const token = getCookie("access_token");
  const decodedToken = token ? decodeToken(token) : null;
  const contractorId = decodedToken ? decodedToken.user_id : null;

  const [form] = Form.useForm();
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("isoWeek"));
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [indisposList, setIndisposList] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [collaboratorData, setCollaboratorData] = useState(null);

  const initialIndispoStart = moment().format("YYYY-MM-DDTHH:mm");
  const initialIndispoEnd = moment().add(1, "hours").format("YYYY-MM-DDTHH:mm");

  // Récupère le planning pour l'affichage des créneaux
  const fetchCalendar = async () => {
    if (!contractorId || !token) return;
    const weekStartStr = currentWeekStart.format("YYYY-MM-DD");
    setLoadingCalendar(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/calendar/${contractorId}?weekStart=${weekStartStr}`,
        {
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur lors du chargement du planning.");
      }
      const data = await res.json();
      setUnavailableSlots(data);
    } catch (err) {
      setCalendarError(err.message);
      message.error(err.message);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Récupère la liste des indisponibilités via le nouvel endpoint
  const fetchIndispos = async () => {
    if (!contractorId || !token) return;
    const dateFilter = currentWeekStart.format("YYYY-MM-DD"); // on utilise la date de début de semaine comme filtre
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/calendar/indispo/${dateFilter}`,
        {
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur lors du chargement des indisponibilités.");
      }
      const data = await res.json();
      setIndisposList(data);
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentWeekStart, contractorId]);

  // On récupère la liste au montage et après modification
  useEffect(() => {
    fetchIndispos();
  }, [contractorId]);

  const handleAddEvent = async (values) => {
    if (!contractorId || !token) {
      message.error("Informations manquantes");
      return;
    }
    try {
      const payload = {
        unvailable_begin_date: new Date(values.indispoStart).toISOString(),
        unvailable_end_date: new Date(values.indispoEnd).toISOString(),
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/calendar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.detail || "Erreur lors de la création du créneau d'indisponibilité."
        );
      }
      message.success("Créneau d'indisponibilité ajouté avec succès !");
      form.resetFields();
      form.setFieldsValue({
        indispoStart: initialIndispoStart,
        indispoEnd: initialIndispoEnd,
      });
      fetchCalendar();
      fetchIndispos();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteEvent = async (calendarId) => {
    if (!contractorId || !token) {
      message.error("Informations manquantes");
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/calendar/indispo/${calendarId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erreur lors de la suppression.");
      }
      message.success("Indisponibilité supprimée avec succès.");
      fetchCalendar();
      fetchIndispos();
    } catch (err) {
      message.error(err.message);
    }
  };

  const today = moment().startOf("day");
  const maxDate = moment().add(3, "months").endOf("isoWeek");

  const startTime = moment().hour(10).minute(0).second(0);
  const endTime = moment().hour(19).minute(0).second(0);
  const timeSlots = [];
  let timeIterator = startTime.clone();
  while (timeIterator.isBefore(endTime)) {
    timeSlots.push(timeIterator.clone());
    timeIterator.add(30, "minutes");
  }

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(currentWeekStart.clone().add(i, "days"));
  }

  const isPastDay = (day) =>
    day.isBefore(today, "day") || day.isoWeekday() === 7;

  const getEventForSlot = (slotTimeMoment) => {
    return unavailableSlots.find((apiSlot) => {
      const slotStart = moment(apiSlot.beginning);
      const slotEnd = moment(apiSlot.end);
      return slotTimeMoment.isSameOrAfter(slotStart) && slotTimeMoment.isBefore(slotEnd);
    });
  };

  const handleReservedClick = async (appointmentDate) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/collaborator/byAppointmentDate?appointment_date=${encodeURIComponent(
          appointmentDate.toISOString()
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.detail || "Erreur lors de la récupération des informations du collaborateur"
        );
      }
      const data = await res.json();
      setCollaboratorData(data);
      setModalVisible(true);
    } catch (err) {
      message.error(err.message);
    }
  };

  const navigateWeek = (direction) => {
    if (direction === "prev") {
      setCurrentWeekStart((prev) => prev.clone().subtract(1, "week"));
    } else if (direction === "next") {
      const newNextWeek = currentWeekStart.clone().add(1, "week");
      if (newNextWeek.isAfter(maxDate)) return;
      setCurrentWeekStart(newNextWeek);
    }
  };

  return (
    <Layout className={styles.layout}>
      <img
        src="/back_icon.png"
        alt="Retour"
        className={styles.iconBack}
        onClick={handleRetour}
        style={{ cursor: "pointer" }}
      />
      <Layout.Content className={styles.content}>
        <h1 className={styles.title}>Mon planning</h1>
        <div className={styles.flexWrapper}>
          <div className={styles.formBlock}>
            <h1 className={styles.title}>
              <FaCalendarCheck className={styles.icon} /> Créer un créneau d'indisponibilité
            </h1>
            <Form
              layout="vertical"
              form={form}
              onFinish={handleAddEvent}
              initialValues={{
                indispoStart: initialIndispoStart,
                indispoEnd: initialIndispoEnd,
              }}
            >
              <Form.Item
                label="Début indisponibilité"
                name="indispoStart"
                rules={[
                  {
                    required: true,
                    message: "Veuillez choisir la date et l'heure de début",
                  },
                ]}
              >
                <input
                  type="datetime-local"
                  style={{ width: "100%", padding: "4px" }}
                  min={moment().format("YYYY-MM-DDTHH:mm")}
                />
              </Form.Item>
              <Form.Item
                label="Fin indisponibilité"
                name="indispoEnd"
                dependencies={["indispoStart"]}
                rules={[
                  {
                    required: true,
                    message: "Veuillez choisir la date et l'heure de fin",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue("indispoStart");
                      if (!value || !start || new Date(value) > new Date(start)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("La date de fin doit être ultérieure à la date de début")
                      );
                    },
                  }),
                ]}
              >
                <input
                  type="datetime-local"
                  style={{ width: "100%", padding: "4px" }}
                  min={form.getFieldValue("indispoStart") || moment().format("YYYY-MM-DDTHH:mm")}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className={styles.addBtn}>
                  Ajouter
                </Button>
              </Form.Item>
            </Form>
          </div>
          <div className={styles.calendarBlock}>
            <div className={styles.weekNavigation}>
              <Button onClick={() => navigateWeek("prev")}>Précédent</Button>
              <span>Semaine du {currentWeekStart.format("DD/MM/YYYY")}</span>
              <Button onClick={() => navigateWeek("next")}>Suivant</Button>
            </div>
            {loadingCalendar && <p>Chargement du calendrier...</p>}
            {calendarError && <p style={{ color: "red" }}>Erreur calendrier : {calendarError}</p>}
            {!loadingCalendar && !calendarError && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ddd", padding: "5px", minWidth: "80px" }}>
                      Créneau
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.format("YYYY-MM-DD")}
                        style={{
                          border: "1px solid #ddd",
                          padding: "5px",
                          backgroundColor: isPastDay(day) ? "#e0e0e0" : "#f9f9f9",
                          color: isPastDay(day) ? "#666" : "black",
                        }}
                      >
                        {day.format("ddd DD/MM")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, index) => (
                    <tr key={index}>
                      <td style={{ border: "1px solid #ddd", padding: "5px", textAlign: "center" }}>
                        {slot.format("HH:mm")}
                      </td>
                      {days.map((day) => {
                        const slotDateTime = day.clone().hour(slot.hour()).minute(slot.minute());
                        const now = moment();
                        const isThisDayPast = isPastDay(day);
                        const isThisSlotPastToday =
                          day.isSame(today, "day") && slotDateTime.isBefore(now);
                        const event = getEventForSlot(slotDateTime);
                        let cellText = "Disponible";
                        let cellBg = "white";
                        let cellColor = "black";
                        let onClickAction = null;

                        if (isThisDayPast) {
                          cellText = "-";
                          cellBg = "#e0e0e0";
                          cellColor = "#666";
                        } else if (isThisSlotPastToday) {
                          cellText = "Passé";
                          cellBg = "#f0f0f0";
                          cellColor = "#666";
                        } else if (event) {
                          const duration = moment
                            .duration(moment(event.end).diff(moment(event.beginning)))
                            .asMinutes();
                          if (duration === 30) {
                            cellText = "Réservé";
                            cellBg = "#a0d911";
                            cellColor = "#fff";
                            onClickAction = () => {
                              handleReservedClick(moment(event.beginning));
                            };
                          } else {
                            cellText = "Indisponible";
                            cellBg = "#d3d3d3";
                            cellColor = "#666";
                          }
                        }

                        return (
                          <td
                            key={`${day.format("YYYY-MM-DD")}-${slot.format("HH:mm")}`}
                            style={{
                              border: "1px solid #ddd",
                              padding: "5px",
                              textAlign: "center",
                              backgroundColor: cellBg,
                              color: cellColor,
                              cursor: onClickAction ? "pointer" : "default",
                            }}
                            onClick={onClickAction}
                          >
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section détachée : liste des indisponibilités via le nouvel endpoint */}
        <div className={styles.unavailabilityList} style={{ marginTop: "20px" }}>
          <h2>Liste des indisponibilités</h2>
          {indisposList && indisposList.length > 0 ? (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {indisposList.map((slot) => (
                <li
                  key={slot.calendar_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <span>
                    {moment(slot.unvailable_begin_date).format("DD/MM/YYYY HH:mm")} -{" "}
                    {moment(slot.unvailable_end_date).format("DD/MM/YYYY HH:mm")}
                  </span>
                  <Button
                    type="primary"
                    danger
                    size="small"
                    onClick={() => handleDeleteEvent(slot.calendar_id)}
                  >
                    Supprimer
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucune indisponibilité</p>
          )}
        </div>
        <Modal
          visible={modalVisible}
          title="Informations collaborateur"
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
              Fermer
            </Button>,
          ]}
        >
          {collaboratorData ? (
            <div>
              <p>
                <strong>Nom :</strong> {collaboratorData.lastname} {collaboratorData.firstname}
              </p>
              <p>
                <strong>Email :</strong> {collaboratorData.email}
              </p>
              <p>
                <strong>Téléphone :</strong> {collaboratorData.phone}
              </p>
            </div>
          ) : (
            <p>Aucune donnée</p>
          )}
        </Modal>
      </Layout.Content>
    </Layout>
  );
};

export default MonPlanning;