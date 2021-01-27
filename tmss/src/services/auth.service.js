const axios = require('axios');

const AuthService = {
    authenticate: async(user, pass) => {
        try {
            delete axios.defaults.headers.common['Authorization'];
            const response = await axios.post("/api/token-auth/", {username: user, password: pass});
            axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
            return response.data;
        }   catch(error) {
            console.error(error);
            return null;
        }
    },
    deAuthenticate: async(token) => {
        try {
            await axios.delete("/api/token-deauth/");
        }   catch(error) {
            console.error(error);
        }
    },
    isValidToken: async(token) => {
        try {
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;
            const response = await axios.get("/api/subtask_type/?limit=1&offset=1");
            console.log(response);
        }   catch(error) {
            console.error(error);
        }
    }
}

export default AuthService;