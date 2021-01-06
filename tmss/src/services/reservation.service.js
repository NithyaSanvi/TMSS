const axios = require('axios');

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

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
    }  
}

export default ReservationService;
