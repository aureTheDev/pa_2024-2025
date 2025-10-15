import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { saveAs } from "file-saver";
import styles from "../styles/HistoriqueServicesSalarie.module.css";

// Fonction utilitaire pour récupérer un cookie
const getCookie = (cookieName) => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
  return cookie ? cookie.split("=")[1] : null;
};

// Fonction de formatage de date en format français "jj/mm/aaaa hh:mm"
const formatDate = (dateString) => {
  if (!dateString) return "Date/Heure inconnue";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date/Heure invalide";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const HistoriqueServices = () => {
  const router = useRouter();
  const token = getCookie("access_token");

  const [collaborator, setCollaborator] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractorDetails, setContractorDetails] = useState({});

  // Récupération des données du collaborateur
  useEffect(() => {
    if (!token) return;
    const fetchCollaborator = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collaborator`, {
          method: "GET",
          headers: { token: token, "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Erreur lors de la récupération du collaborateur");
        const data = await response.json();
        setCollaborator(data);
      } catch (error) {
        console.error("Erreur fetch collaborateur:", error);
      }
    };
    fetchCollaborator();
  }, [token]);

  // Récupération des rendez-vous et infos prestataire
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!collaborator || !collaborator.collaborator_id) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical_appointments/${collaborator.collaborator_id}`,
          {
            method: "GET",
            headers: { token: token, "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          console.error("Erreur lors de la récupération des rendez-vous");
          setLoading(false);
          return;
        }
        const data = await response.json();
        // Tri des rendez-vous du plus récent au plus ancien
        data.sort((a, b) => new Date(b.medical_appointment_date) - new Date(a.medical_appointment_date));
        setAppointments(data);

        // Récupération des détails des prestataires
        const uniqueContractorIds = [
          ...new Set(data.map((app) => app.contractor_id).filter((id) => id))
        ];
        const details = {};
        await Promise.all(
          uniqueContractorIds.map(async (id) => {
            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/collaborator/contractor/${id}`,
                {
                  method: "GET",
                  headers: { token: token, "Content-Type": "application/json" },
                }
              );
              if (res.ok) {
                details[id] = await res.json();
              } else {
                details[id] = { error: true, firstname: "Erreur", lastname: "" };
              }
            } catch (err) {
              console.error("Erreur récupération prestataire pour id " + id, err);
              details[id] = { error: true, firstname: "Erreur", lastname: "" };
            }
          })
        );
        setContractorDetails(details);
      } catch (error) {
        console.error("Erreur fetch appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [collaborator, token]);

  const handleRetour = () => {
    router.push("/salaries/accueil");
  };

  // Vérifie si le rendez-vous est à venir
  const isUpcoming = (dateString) => {
    const appointmentDate = new Date(dateString);
    return appointmentDate > new Date();
  };

  // Vérifie si le rendez-vous est passé
  const isPassed = (dateString) => {
    const appointmentDate = new Date(dateString);
    return appointmentDate <= new Date();
  };

  // Action pour annuler un rendez-vous
  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical-appointment/cancel/${appointmentId}`,
        {
          method: "PATCH",
          headers: { token: token, "Content-Type": "application/json" },
        }
      );
      if (res.ok) {
        // Mise à jour locale du statut
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.medical_appointment_id === appointmentId
              ? { ...appt, status: "CANCELED" }
              : appt
          )
        );
      } else {
        console.error("Erreur lors de l'annulation du rendez-vous");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Action de téléchargement de la facture
  const handleDownloadInvoice = async (appointmentId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical/bill/${appointmentId}`,
        {
          method: "GET",
          headers: { token: token },
        }
      );
      if (!res.ok) {
        console.error("Erreur lors du téléchargement de la facture");
        return;
      }
      const blob = await res.blob();
      saveAs(blob, "facture.pdf");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Action pour noter un rendez-vous passé (requête PATCH)
  const handleNote = async (appointmentId) => {
    const noteInput = prompt("Veuillez entrer une note entre 0 et 5 pour ce rendez-vous");
    if (noteInput === null) {
      // L'utilisateur a annulé
      return;
    }
    const numericNote = parseInt(noteInput, 10);
    if (isNaN(numericNote) || numericNote < 0 || numericNote > 5) {
      alert("Note invalide. Veuillez saisir un nombre entre 0 et 5.");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical-appointment/note/${appointmentId}?note=${numericNote}`,
        {
          method: "PATCH",
          headers: {
            token: getCookie("access_token"),
            "Content-Type": "application/json"
          }
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de l'ajout de la note");
      }
      const result = await response.json();
      alert(result.message || "Note ajoutée avec succès");
      // Mise à jour locale de la note
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.medical_appointment_id === appointmentId
            ? { ...appt, note: numericNote }
            : appt
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout de la note", error);
      alert(error.message || "Une erreur est survenue lors de l'ajout de la note");
    }
  };

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <img
          src="/back_icon.png"
          alt="Retour"
          className={styles.icon_back}
          onClick={handleRetour}
          style={{ cursor: "pointer" }}
        />
        <h1 className={styles.title}>
          Historique des <span>services médicaux</span>
        </h1>
        {loading ? (
          <p>Chargement en cours…</p>
        ) : (
          <>
            <div className={styles.stats}>
              <div className={styles.card}>
                <p>Nombre de rendez-vous</p>
                <strong>{appointments.length}</strong>
              </div>
            </div>
            <p className={styles.count}>
              {appointments.length} rendez-vous trouvés
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Statut</th>
                  <th>Prestataire</th>
                  <th>Service</th>
                  <th>Adresse</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const contractor = contractorDetails[appointment.contractor_id] || {};
                  const contractorName = contractor.error
                    ? "Erreur de chargement"
                    : `${contractor.firstname || "N/A"} ${contractor.lastname || ""}`.trim();
                  const service = contractor.service || "N/A";
                  const address =
                    contractor.street && contractor.city && contractor.pc
                      ? `${contractor.street}, ${contractor.pc} ${contractor.city}`
                      : "Adresse non renseignée";
                  return (
                    <tr key={appointment.medical_appointment_id}>
                      <td>{formatDate(appointment.medical_appointment_date)}</td>
                      <td>{appointment.place}</td>
                      <td>{appointment.status}</td>
                      <td>{contractorName}</td>
                      <td>{service}</td>
                      <td>{address}</td>
                      <td>
                        {appointment.note !== undefined && appointment.note !== null ? (
                          appointment.note
                        ) : (
                          isPassed(appointment.medical_appointment_date) &&
                          appointment.status !== "CANCELED" && (
                            <button onClick={() => handleNote(appointment.medical_appointment_id)}>
                              Noter
                            </button>
                          )
                        )}
                      </td>
                      <td>
                        {appointment.bill_file && (
                          <button
                            onClick={() =>
                              handleDownloadInvoice(appointment.medical_appointment_id)
                            }
                            style={{ marginBottom: "5px" }}
                          >
                            Facture
                          </button>
                        )}
                        {isUpcoming(appointment.medical_appointment_date) &&
                          appointment.status !== "CANCELED" && (
                          <button
                            onClick={() => handleCancel(appointment.medical_appointment_id)}
                            style={{ marginTop: "5px", display: "block" }}
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoriqueServices;