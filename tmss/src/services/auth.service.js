import Cookies from 'js-cookie';

const axios = require('axios');
delete axios.defaults.headers.common['Authorization'];
const AuthService = {
    authenticate: async() => {
        try {
            console.log(Cookies.get('csrftoken'));
            const response = await axios.post("/accounts/login/", {csrfmiddlewaretoken: Cookies.get('csrftoken'), username: "test", password: "test"});
            // const response = await axios.post("/accounts/login/", {username: "test", password: "test"});
            console.log(response);
        }   catch(error) {
            console.error(error);
        }
    }
}

export default AuthService;