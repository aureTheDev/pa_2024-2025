import React, { useState, useEffect } from "react";
import moment from "moment";

const Calendar = ({ contractorId, onSlotSelect }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("isoWeek"));
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false); // État de chargement pour le calendrier
  const [calendarError, setCalendarError] = useState(null); // État d'erreur pour le calendrier

  const today = moment().startOf("day");
  const maxDate = moment().add(3, "months").endOf("isoWeek");

  const getCookie = (cookieName) => {
    if (typeof document === 'undefined') { // Vérification pour SSR, bien que moins critique ici
        return null;
    }
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
    return cookie ? cookie.split("=")[1] : null;
  };

  useEffect(() => {
    if (!contractorId) return;

    setLoadingCalendar(true);
    setCalendarError(null);
    const token = getCookie("access_token");
    if (!token) {
        setCalendarError("Token d'authentification manquant pour charger le calendrier.");
        setLoadingCalendar(false);
        return;
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/contractor/calendar/${contractorId}`;
    fetch(`${apiUrl}?weekStart=${currentWeekStart.format("YYYY-MM-DD")}`, {
      headers: {
        token: token,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.detail || "Erreur lors de la récupération des indisponibilités.")});
        }
        return response.json();
      })
      .then((data) => {
        setUnavailableSlots(data);
      })
      .catch((error) => {
        console.error("Calendar fetch error:", error);
        setCalendarError(error.message);
      })
      .finally(() => {
        setLoadingCalendar(false);
      });
  }, [currentWeekStart, contractorId]);

  const startTime = moment().hour(10).minute(0).second(0); // Heure de début fixe pour l'affichage
  const endTime = moment().hour(19).minute(0).second(0);   // Heure de fin fixe
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

  // isPastDay vérifie si le jour est avant aujourd'hui OU si c'est un dimanche (isoWeekday 7)
  const isPastDay = (day) => day.isBefore(today, "day") || day.isoWeekday() === 7;

  const isSlotUnavailable = (day, slotTimeMoment) => {
    // Vérifie les indisponibilités récupérées de l'API
    return unavailableSlots.some((apiSlot) => {
      const slotStart = moment(apiSlot.beginning);
      const slotEnd = moment(apiSlot.end);
      // Un créneau est indisponible s'il commence en même temps ou après 'slotStart'
      // ET avant 'slotEnd'.
      return slotTimeMoment.isSameOrAfter(slotStart) && slotTimeMoment.isBefore(slotEnd);
    });
  };

  const navigateWeek = (direction) => {
    if (direction === "prev") {
      const newPrevWeek = currentWeekStart.clone().subtract(1, "week");
      // Optionnel: empêcher d'aller trop loin dans le passé si nécessaire
      // if (newPrevWeek.isBefore(moment().startOf('isoWeek'))) return;
      setCurrentWeekStart(newPrevWeek);
    } else if (direction === "next") {
      const newNextWeek = currentWeekStart.clone().add(1, "week");
      if (newNextWeek.isAfter(maxDate)) return; // Respecter la date max
      setCurrentWeekStart(newNextWeek);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <button
            onClick={() => navigateWeek("prev")}
            disabled={currentWeekStart.isSameOrBefore(moment().startOf('isoWeek'))} // Désactiver si c'est la semaine actuelle ou avant
        >
            Précédent
        </button>
        <h2 style={{ margin: "0 10px" }}>
          Semaine du {currentWeekStart.format("DD/MM/YYYY")}
        </h2>
        <button
            onClick={() => navigateWeek("next")}
            disabled={currentWeekStart.clone().add(1, 'week').isAfter(maxDate)} // Désactiver si la semaine suivante dépasse maxDate
        >
            Suivant
        </button>
      </div>

      {loadingCalendar && <p>Chargement du calendrier...</p>}
      {calendarError && <p style={{color: 'red'}}>Erreur calendrier: {calendarError}</p>}

      {!loadingCalendar && !calendarError && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "5px", minWidth: "80px" }}>Créneau</th>
              {days.map((day) => (
                <th
                  key={day.format("YYYY-MM-DD")}
                  style={{
                    border: "1px solid #ddd",
                    padding: "5px",
                    backgroundColor: isPastDay(day) ? "#e0e0e0" : "#f9f9f9", // Grise les jours passés/dimanche dans l'entête
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

                  const isThisDayPast = isPastDay(day); // Jour passé ou dimanche
                  const isThisSlotPastToday = day.isSame(today, "day") && slotDateTime.isBefore(now); // Créneau passé aujourd'hui
                  const isApiUnavailable = isSlotUnavailable(day, slotDateTime);

                  const isUnavailable = isThisDayPast || isThisSlotPastToday || isApiUnavailable;

                  let cellText = "Disponible";
                  let cellBackgroundColor = "white";
                  let cellColor = "black";
                  let cellCursor = "pointer";

                  if (isThisDayPast) {
                    cellText = "-";
                    cellBackgroundColor = "#e0e0e0"; // Gris pour jour passé/dimanche
                    cellColor = "#666";
                    cellCursor = "default";
                  } else if (isThisSlotPastToday) {
                    cellText = "Passé";
                    cellBackgroundColor = "#f0f0f0"; // Gris clair pour créneau passé aujourd'hui
                    cellColor = "#666";
                    cellCursor = "default";
                  } else if (isApiUnavailable) {
                    cellText = "Indisponible";
                    cellBackgroundColor = "#d3d3d3"; // Gris pour indisponibilité API
                    cellColor = "#666";
                    cellCursor = "default";
                  }

                  const cellStyle = {
                    border: "1px solid #ddd",
                    padding: "5px",
                    textAlign: "center",
                    backgroundColor: cellBackgroundColor,
                    color: cellColor,
                    cursor: cellCursor,
                  };

                  return (
                    <td
                      key={`${day.format("YYYY-MM-DD")}-${slot.format("HH:mm")}`}
                      style={cellStyle}
                      onClick={() => {
                        if (!isUnavailable && onSlotSelect) {
                          onSlotSelect(day, slot);
                        }
                      }}
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
  );
};

export default Calendar;
