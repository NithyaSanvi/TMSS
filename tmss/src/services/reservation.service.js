const axios = require('axios');

const ReservationService = {
    getReservationTemplates: async function () {
        try {
            const url = `/api/reservation_template`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
    saveReservation: async function (reservation) {
        try {
            const response = await axios.post(('/api/reservation/'), reservation);
            return response.data;
          } catch (error) {
            console.error(error);
            return null;
          }
    },
    getReservations: async function () {
        try {
            const url = `/api/reservation`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
}

export default ReservationService;
