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
    updateReservation: async function (reservation) {
        try {
            const response = await axios.put((`/api/reservation/${reservation.id}/`), reservation);
            return response.data;
          } catch (error) {
            console.error(error);
            return null;
          }
    },
    getReservations: async function () {
        try {
            const url = `/api/reservation/?ordering=id`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
    getReservation: async function (id) {
        try {
            const response = await axios.get(`/api/reservation/${id}`);
            return response.data;
        }   catch(error) {
            console.error(error);
            return null;
        };
    },
    getReservationTemplate: async function(templateId) {
        try {
          const response = await axios.get('/api/reservation_template/' + templateId);
          return response.data;
        } catch (error) {
          console.log(error);
        }
      },
     
    deleteReservation: async function(id) {
        try {
            const url = `/api/reservation/${id}`;
            await axios.delete(url);
            return true;
        } catch(error) {
            console.error(error);
            return false;
        }
    },
    getReservationStrategyTemplates: async function () {
        try {
            const url = `/api/reservation_strategy_template/?ordering=id`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
    getReservationStrategyTemplates: async function () {
        try {
            const url = `/api/reservation_strategy_template/?ordering=id`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
}

export default ReservationService;
