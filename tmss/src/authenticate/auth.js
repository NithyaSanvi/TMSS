import AuthService from "../services/auth.service";

const axios = require('axios');

/**
 * Global functions to authenticate user and get user details from browser local storage.
 */
const Auth = {
    /** To check if user already logged in and the token is available in the browser local storage */
    isAuthenticated: () => {
        let user = localStorage.getItem("user");
        if (user) {
            user = JSON.parse(user);
            if (user.token) {
                axios.defaults.headers.common['Authorization'] = `Token ${user.token}`;
                return true;
            }
        }
        return false;
    },
    /** Gets user details from browser local storage */
    getUser: () => {
        return JSON.parse(localStorage.getItem("user"));
    },
    /** Authenticate user from the backend and store user details in local storage */
    login: async(user, pass) => {
        const authData = await AuthService.authenticate(user, pass);
        if (authData) {
            localStorage.setItem("user", JSON.stringify({name:user, token: authData.token}));
            return true;
        }   else {
            return false;
        }
    },
    /** Remove user details from localstorage on logout */
    logout: () => {
        AuthService.deAuthenticate();
        localStorage.removeItem("user");
    }
}

export default Auth;