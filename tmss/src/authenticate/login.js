import { InputText } from 'primereact/inputtext';
import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';
import Auth from '../authenticate/auth';

/**
 * Component to authenticate users in the application.
 */
export class Login extends Component {
    constructor(props){
        super(props);
        this.state = {
            username: null,
            password: null,
            redirect: Auth.isAuthenticated()?"/":null,          //If already logged in, redirect to home page
            error: null,
            errors: {},
            validFields: {}
        };
        this.login = this.login.bind(this);
        this.setCredentials = this.setCredentials.bind(this);
    }

    /**
     * To set form field values.
     * @param {String} field 
     * @param {String} value 
     */
    setCredentials(field, value) {
        let state = this.state;
        let errors = state.errors;
        let validFields = state.validFields;
        // If value is null or empty set error field and remove from valid field and vice versa
        if (!value) {
            errors[field] = `${field} required`;
            delete validFields[field];
        }   else {
            delete errors[field];
            validFields[field] = field;
        }
        state[field] = value;
        state.errors = errors;
        state.validFields = validFields;
        this.setState(state);
    }

    /**
     * Login function called on click of 'Login' button. 
     * If authenticated, callback parent component function.
     */
    async login() {
        const loggedIn = await Auth.login(this.state.username, this.state.password);
        if (loggedIn) {
            this.setState({error: false});
            this.props.onLogin();
        }   else {
            this.setState({error: true});
        }
    }

    render() {
        if (this.state.redirect) {
            return (<Redirect to={{pathname: this.state.redirect}} />);
        }
        return (
            <>
            <div className="container-fluid bg-login">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-9 col-md-12 login-card">
                            <div className="row">
                                {/* Left panel with image and TMSS title */}
                                <div className="col-md-5 detail-part">
                                    <h3>Telescope Manager Specification System</h3>
                                    <p>By ASTRON</p>
                                </div>
                                {/* Right panel with login form */}
                                <div className="col-md-7 logn-part">
                                    <div className="row">
                                        <div className="col-lg-10 col-md-12 mx-auto">
                                            <div className="logo-cover">
                                                {/* <img src="./logo.png" alt="" /> */}
                                            </div>
                                            <div className="login-form">
                                                <h4>Login</h4>
                                                <div className="form-field">
                                                    <span className="p-float-label">
                                                        <InputText id="inputtext" className={`${this.state.errors.username?"input-error ":""} form-control`} 
                                                                    value={this.state.username} onChange={(e) => this.setCredentials('username', e.target.value)} />
                                                        <label htmlFor="inputtext"><i className="fa fa-user"></i>Enter Username</label>
                                                    </span>
                                                    <label className={this.state.errors.username?"error":""}>
                                                        {this.state.errors.username?this.state.errors.username : ""}
                                                    </label>
                                                </div>
                                                <div className="form-field">
                                                    <span className="p-float-label">
                                                        <InputText id="inputtext" className={`${this.state.errors.password?"input-error ":""} form-control`} 
                                                                type="password" value={this.state.password} onChange={(e) => this.setCredentials('password', e.target.value )} />
                                                        <label htmlFor="inputtext"><i className="fa fa-key"></i>Enter Password</label>
                                                    </span>
                                                    <label className={this.state.errors.password?"error":""}>
                                                        {this.state.errors.password?this.state.errors.password : ""}
                                                    </label>
                                                </div>
                                                <div className="row form-footer">
                                                    <div className="col-md-6 forget-paswd">
                                                        
                                                    </div>
                                                    <div className="col-md-6 button-div">
                                                        <button className="btn btn-primary" 
                                                                disabled={Object.keys(this.state.validFields).length<2} 
                                                                onClick={this.login}>Login</button>
                                                    </div>
                                                </div>
                                                {this.state.error &&
                                                <div className="row error">
                                                    Unable to login, please try with different Username and/or Password.
                                                </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </>
        );
    }
}