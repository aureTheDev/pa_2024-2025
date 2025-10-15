import React, { useState, useEffect, useMemo } from "react";
import moment from "moment"; // pour la gestion des dates
import { useRouter } from "next/router";
import HeaderSalarie from "./HeaderSalarie";
import Footer from "./Footer";
import Calendar from "./Calendar";
import styles from "../styles/RDVMedical.module.css";
import Link from "next/link";
import {
  FaUser,
  FaLightbulb,
  FaComments,
  FaHandsHelping,
  FaHistory,
  FaEnvelope,
} from "react-icons/fa";
import { loadStripe } from "@stripe/stripe-js";

// Charger Stripe en dehors du composant
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const RDVMedicalPage = () => {
  const router = useRouter();

  // États du composant
  const [collaboratorData, setCollaboratorData] = useState(null);
  const [contractorData, setContractorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState("incall");
  const [freeSlots, setFreeSlots] = useState(null);

  // Fonction utilitaire pour obtenir un cookie
  const getCookie = (cookieName) => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
    return cookie ? cookie.split("=")[1] : null;
  };

  // Charger les données du collaborateur
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token) return;
    const fetchCollaboratorData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/collaborator`,
          {
            method: "GET",
            headers: { token, "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          throw new Error(
            `Failed to load collaborator data: ${response.status} ${errorData.detail}`
          );
        }
        const data = await response.json();
        setCollaboratorData(data);
      } catch (err) {
        console.error("Error loading collaborator data:", err);
      }
    };
    fetchCollaboratorData();
  }, []);

  // Charger les prestataires médicaux en fonction des filtres intervention et service
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token) {
      setError("Authentication required to view contractors.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const fetchMedicalContractors = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedIntervention) params.append("intervention", selectedIntervention);
        if (selectedService) params.append("service", selectedService);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/contractor/medical?${params.toString()}`,
          {
            method: "GET",
            headers: { token, "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          throw new Error(
            `Failed to load contractors: ${response.status} ${errorData.detail}`
          );
        }
        const data = await response.json();
        setContractorData(data);
      } catch (err) {
        console.error("Error loading medical contractors:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicalContractors();
  }, [selectedIntervention, selectedService]);

  // Calculer les services uniques à partir de contractorData
  const uniqueServices = useMemo(() => {
    if (!contractorData || contractorData.length === 0) return [];
    const servicesSet = new Set(contractorData.map((contractor) => contractor.service));
    return Array.from(servicesSet).sort();
  }, [contractorData]);

  // Charger les créneaux de rendez-vous gratuits
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token) return;
    const fetchFreeSlots = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical-appointment/free-slots/`,
          {
            method: "GET",
            headers: { token, "Content-Type": "application/json" },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setFreeSlots(data);
        } else {
          console.error("Erreur lors de la récupération des créneaux gratuits");
        }
      } catch (err) {
        console.error("Error fetching free slots:", err);
      }
    };
    fetchFreeSlots();
  }, []);

  // Mettre à jour le type de RDV par défaut lors de la sélection d'un prestataire
  useEffect(() => {
    if (selectedContractorId) {
      const contractor = contractorData.find(
        (c) => c.contractor_id === selectedContractorId
      );
      if (contractor) {
        if (contractor.intervention === "incall") setAppointmentType("incall");
        else if (contractor.intervention === "outcall") setAppointmentType("outcall");
        else if (contractor.intervention === "both") setAppointmentType("incall");
      }
    }
  }, [selectedContractorId, contractorData]);

  // Formatage pour l'affichage du type d'intervention
  const formatIntervention = (intervention) => {
    if (intervention === "both") return "Présentiel/Distanciel";
    if (intervention === "incall") return "Présentiel";
    if (intervention === "outcall") return "Distanciel";
    return intervention;
  };

  // Fermer la modale du calendrier
  const closeCalendarModal = () => {
    setSelectedContractorId(null);
    setSelectedSlot(null);
  };

  // Gérer la sélection d'un créneau dans le calendrier
  const handleSlotSelect = (day, slot) => {
    setSelectedSlot({ day, slot });
  };

  // Gérer le processus de paiement / réservation de RDV
  const handlePayment = async () => {
    const token = getCookie("access_token");
    if (!token || !selectedContractorId || !selectedSlot) {
      alert("Missing token, contractor selection, or time slot selection.");
      return;
    }

    let finalAppointmentType = appointmentType;
    const contractor = contractorData.find(
      (c) => c.contractor_id === selectedContractorId
    );
    if (contractor) {
      if (contractor.intervention === "incall") finalAppointmentType = "incall";
      else if (contractor.intervention === "outcall") finalAppointmentType = "outcall";
    }

    const localDateTime = moment(
      selectedSlot.day.format("YYYY-MM-DD") + " " + selectedSlot.slot.format("HH:mm:ss")
    );
    const appointmentDateTimeUTC = localDateTime.utc().toISOString();

    try {
      const bookingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/book/medical-appointment`,
        {
          method: "POST",
          headers: {
            token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractor_id: selectedContractorId,
            appointment_datetime_utc: appointmentDateTimeUTC,
            appointment_type: finalAppointmentType,
          }),
        }
      );

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json().catch(() => ({
          detail: `Booking request failed with status ${bookingResponse.status}`,
        }));
        throw new Error(errorData.detail || `Error ${bookingResponse.status}`);
      }
      const bookingData = await bookingResponse.json();

      // Si on reçoit un checkout_session_id, rediriger vers Stripe sinon vérifier le message de succès
      if (bookingData.checkout_session_id) {
        const stripe = await stripePromise;
        if (!stripe) {
          console.error("Stripe.js has not loaded yet.");
          alert("Payment system is not ready. Please try again in a moment.");
          return;
        }
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: bookingData.checkout_session_id,
        });
        if (stripeError) {
          console.error("Stripe redirection error:", stripeError);
          alert(`Could not redirect to payment page: ${stripeError.message}`);
        }
      } else if (bookingData.message === "appointment successfully booked") {
        router.push("/salaries/accueil");
      }
    } catch (err) {
      console.error("Payment process error:", err);
      alert(`An error occurred: ${err.message}`);
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.body}>
        <HeaderSalarie />
        <aside className={styles.sidebar}>
          <div className={styles.profile}>
            <img src="/user.jpeg" alt="profile" className={styles.avatar} />
            {collaboratorData ? (
              <p>
                {collaboratorData.firstname} {collaboratorData.lastname}
              </p>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
          <nav className={styles.menu}>
            <ul className={styles.menuList}>
              <li className={styles.menuItem}>
                <Link href="/salaries/profile" className={styles.menuLink}>
                  <FaUser className={styles.icon} />
                  <span>My profile</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/salaries/conseils" className={styles.menuLink}>
                  <FaLightbulb className={styles.icon} />
                  <span>Advice</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <span
                  className={styles.menuLink}
                  style={{ cursor: "not-allowed", opacity: 0.6 }}
                >
                  <FaComments className={styles.icon} />
                  <span>Forum</span>
                </span>
              </li>
              <li className={styles.menuItem}>
                <Link href="/salaries/associations" className={styles.menuLink}>
                  <FaHandsHelping className={styles.icon} />
                  <span>Associations</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/salaries/historique" className={styles.menuLink}>
                  <FaHistory className={styles.icon} />
                  <span>History</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/support/contactForm" className={styles.menuLink}>
                  <FaEnvelope className={styles.icon} />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        <main className={styles.content}>
          <div className={styles.dashboard_header}>
            <h1>Medical Appointment</h1>
            <p>Manage your appointments on CareConnect.</p>
          </div>
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <div>
              <label htmlFor="intervention-filter" style={{ marginRight: "5px" }}>
                Intervention:
              </label>
              <select
                id="intervention-filter"
                value={selectedIntervention}
                onChange={(e) => setSelectedIntervention(e.target.value)}
              >
                <option value="">--All--</option>
                <option value="incall">Présentiel</option>
                <option value="outcall">Distanciel</option>
                <option value="both">Présentiel/Distanciel</option>
              </select>
            </div>
            <div>
              <label htmlFor="service-filter" style={{ marginRight: "5px" }}>
                Service:
              </label>
              <select
                id="service-filter"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="">--All--</option>
                {uniqueServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {freeSlots !== null && (
            <p style={{ fontSize: "1.1em", margin: "10px 20px" }}>
              {freeSlots > 0
                ? `Il vous reste ${freeSlots} rdv pris en charge par votre entreprise`
                : "Vous n'avez aucun rdv pris en charge par votre entreprise"}
            </p>
          )}
          {loading && <p>Loading available contractors...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && !error && contractorData.length === 0 && (
            <p>No medical contractors found matching your criteria.</p>
          )}
          {!loading && !error && contractorData.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "600px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "left",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "left",
                      }}
                    >
                      Address
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "left",
                      }}
                    >
                      Service
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "left",
                      }}
                    >
                      Intervention
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "right",
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contractorData.map((contractor) => (
                    <tr key={contractor.contractor_id}>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {contractor.firstname} {contractor.lastname}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {`${contractor.street}, ${contractor.pc} ${contractor.city}`}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {contractor.service}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                        {formatIntervention(contractor.intervention)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          textAlign: "right",
                        }}
                      >
                        {contractor.service_price}€
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() => {
                            setSelectedContractorId(contractor.contractor_id);
                            setSelectedSlot(null);
                          }}
                        >
                          Book
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      <Footer />
      {selectedContractorId && !selectedSlot && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px 30px",
              borderRadius: "8px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              width: "auto",
              minWidth: "600px",
              maxWidth: "calc(100% - 40px)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={closeCalendarModal}
              style={{
                float: "right",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#555",
              }}
            >
              &times;
            </button>
            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
              Select an Appointment Slot
            </h3>
            {(() => {
              const contractor = contractorData.find(
                (c) => c.contractor_id === selectedContractorId
              );
              if (contractor) {
                return (
                  <p style={{ marginBottom: "20px" }}>
                    For: <strong>{contractor.firstname} {contractor.lastname}</strong> ({contractor.service})
                  </p>
                );
              }
              return null;
            })()}
            <Calendar
              contractorId={selectedContractorId}
              onSlotSelect={handleSlotSelect}
            />
          </div>
        </div>
      )}
      {selectedSlot && selectedContractorId && (() => {
        const contractor = contractorData.find(
          (c) => c.contractor_id === selectedContractorId
        );
        if (!contractor) return null;
        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "25px 30px",
                borderRadius: "8px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                maxWidth: "500px",
                width: "calc(100% - 40px)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <button
                onClick={() => setSelectedSlot(null)}
                style={{
                  float: "right",
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#555",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
              <h2 style={{ marginTop: 0, marginBottom: "15px" }}>
                Confirm Appointment
              </h2>
              <p>
                With: <strong>{contractor.firstname} {contractor.lastname}</strong> ({contractor.service})
              </p>
              <p>
                Selected slot:{" "}
                <strong>
                  {selectedSlot.day.format("dddd, MMMM Do YYYY")}
                </strong>{" "}
                at <strong>{selectedSlot.slot.format("HH:mm")}</strong> (Your local time)
              </p>
              <div style={{ margin: "15px 0" }}>
                {contractor.intervention === "both" ? (
                  <>
                    <p style={{ marginBottom: "8px" }}>
                      Please select appointment type:
                    </p>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="appointmentType"
                          value="incall"
                          checked={appointmentType === "incall"}
                          onChange={(e) => setAppointmentType(e.target.value)}
                          style={{ marginRight: "5px" }}
                        />
                        Présentiel
                      </label>
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="appointmentType"
                          value="outcall"
                          checked={appointmentType === "outcall"}
                          onChange={(e) => setAppointmentType(e.target.value)}
                          style={{ marginRight: "5px" }}
                        />
                        Distanciel
                      </label>
                    </div>
                  </>
                ) : (
                  <p>
                    Appointment type:{" "}
                    <strong>{formatIntervention(appointmentType)}</strong> (Automatically selected)
                  </p>
                )}
              </div>
              <p style={{ marginTop: "10px", fontSize: "1.1em" }}>
                Price: <strong>{contractor.service_price}€</strong>
              </p>
              <p
                style={{
                  marginTop: "15px",
                  fontStyle: "italic",
                  color: "#e60000",
                  fontSize: "0.9em",
                  border: "1px solid #ffcccc",
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: "#fff0f0",
                }}
              >
                Warning: Cancelled appointments are non-refundable.
              </p>
              <button
                onClick={handlePayment}
                style={{
                  marginTop: "20px",
                  padding: "12px 20px",
                  cursor: "pointer",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "1em",
                  width: "100%",
                }}
              >
                Proceed to Payment ({contractor.service_price}€)
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RDVMedicalPage;