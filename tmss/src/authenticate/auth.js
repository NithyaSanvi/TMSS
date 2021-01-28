// import AuthService from "../services/auth.service";

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
        // const user = await AuthService.authenticate();
        if (user) {
            //TODO set token and username
        }
        localStorage.setItem("user", JSON.stringify({name:user, token: "ABCDEFGHIJ"}));
        return true;
    },
    /** Remove user details from localstorage on logout */
    logout: () => {
        localStorage.removeItem("user");
    }
}

export default Auth;