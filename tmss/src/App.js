import React, {Component} from 'react';
import { Redirect} from 'react-router-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import classNames from 'classnames';
import {AppTopbar} from './layout/components/AppTopbar';
import {AppMenu} from './layout/components/AppMenu';
import {AppFooter } from './layout/components/AppFooter';
import {RoutedContent} from './routes';
import {AppBreadcrumb } from "./layout/components/AppBreadcrumb";
import {withRouter } from 'react-router';
import handleResponse from "./response.handler"
import { setAppGrowl } from './layout/components/AppGrowl';
import { Growl } from 'primereact/components/growl/Growl';

import 'primeicons/primeicons.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.css';
import './layout/layout.scss';
import 'primeflex/primeflex.css';
import './App.scss';
import './App.css';
import Auth from'./authenticate/auth';
import { Login } from './authenticate/login';

class App extends Component {
    constructor() {
        super();
        this.state = {
        layoutMode: 'static',
        currentMenu: '',
        currentPath: '/',
        PageTitle:'',
        staticMenuInactive: localStorage.getItem('staticMenuInactive') === 'true' ? true : false,
        overlayMenuActive: localStorage.getItem('overlayMenuActive') === 'true' ? true : false,
        mobileMenuActive: localStorage.getItem('mobileMenuActive') === 'true' ? true : false,
        authenticated: Auth.isAuthenticated(),
        redirect: (Auth.isAuthenticated() && window.location.pathname === "/login")?"/":window.location.pathname,
        findObjectPlaceholder: 'Sub Task',
        };
        this.onWrapperClick = this.onWrapperClick.bind(this);
        this.onToggleMenu = this.onToggleMenu.bind(this);
        this.onSidebarClick = this.onSidebarClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.setPageTitle = this.setPageTitle.bind(this);
        this.loggedIn = this.loggedIn.bind(this);
        this.logout = this.logout.bind(this);
        this.setSearchField = this.setSearchField.bind(this);

        this.menu = [ {label: 'Dashboard', icon: 'pi pi-fw pi-home', to:'/dashboard',section: 'dashboard'},
                        {label: 'Cycle', icon:'pi pi-fw pi-spinner', to:'/cycle',section: 'cycle'},
                        {label: 'Project', icon: 'fab fa-fw fa-wpexplorer', to:'/project',section: 'project'},
                        {label: 'Scheduling Units', icon: 'pi pi-fw pi-calendar', to:'/schedulingunit',section: 'schedulingunit'},
                        {label: 'Tasks', icon: 'pi pi-fw pi-check-square', to:'/task'},
                        {label: 'Timeline', icon: 'pi pi-fw pi-clock', to:'/su/timelineview',section: 'su/timelineview'},
                      
                    ];
    }

    onWrapperClick(event) {
        if (!this.menuClick) {
            this.setState({
                overlayMenuActive: false,
                mobileMenuActive: false
            });
        }

        this.menuClick = false;
    }

    onToggleMenu(event) {
        this.menuClick = true;
        if (this.isDesktop()) {
            if (this.state.layoutMode === 'overlay') {
                this.setState({
                    overlayMenuActive: !this.state.overlayMenuActive
                }, () => {
                    localStorage.setItem('overlayMenuActive', this.state.overlayMenuActive);
                }
                );
            }
            else if (this.state.layoutMode === 'static') {
                this.setState({
                    staticMenuInactive: !this.state.staticMenuInactive
                }, () => {
                    localStorage.setItem('staticMenuInactive', this.state.staticMenuInactive);
                });
            }
        }
        else {
            const mobileMenuActive = this.state.mobileMenuActive;
            this.setState({
                mobileMenuActive: !mobileMenuActive
            },() => {
                localStorage.setItem('mobileMenuActive', this.state.mobileMenuActive);
            }
            );
        }
       event.preventDefault();
    }

    onSidebarClick(event) {
        this.menuClick = true;
    }

    onMenuItemClick(event) {
        this.setState({currentMenu:event.item.label, currentPath: event.item.path});
    }
		
	isDesktop() {
        return window.innerWidth > 1024;
    }

    setPageTitle(PageTitle) {
        if (PageTitle !== this.state.PageTitle) {
            this.setState({ PageTitle })
        }
    } 

    /**
     * Callback function from login page to set the authentication state to true amd redirect to the 
     * original requested URL.
     */
    loggedIn() {
        const redirect = this.state.redirect;
        this.setState({authenticated: true, redirect: redirect==="/login"?"/":redirect});
    }

    /**
     * Logout and redirect to login page.
     */
    logout() {
        Auth.logout();
        this.setState({authenticated: false, redirect:"/"});
    }

    /**
     * Set search param
     * @param {*} key 
     * @param {*} value 
     */
    setSearchField(key, value) {
        this.setState({
            objectType: key, 
            findObjectId: value, 
            redirect:"/find/object/"+key+"/"+value
        });
    }

    render() {
        const wrapperClass = classNames('layout-wrapper', {
            'layout-overlay': this.state.layoutMode === 'overlay',
            'layout-static': this.state.layoutMode === 'static',
            'layout-static-sidebar-inactive': this.state.staticMenuInactive && this.state.layoutMode === 'static',
            'layout-overlay-sidebar-active': this.state.overlayMenuActive && this.state.layoutMode === 'overlay',
            'layout-mobile-sidebar-active': this.state.mobileMenuActive			
        });
        const AppBreadCrumbWithRouter = withRouter(AppBreadcrumb);
        //console.log(this.props);
        return (
        <React.Fragment>
            <Growl ref={(el) => setAppGrowl(el)} />
            <div className="App">
                {/* <div className={wrapperClass} onClick={this.onWrapperClick}> */}
                <div className={wrapperClass}>
                    
                    {/* Load main routes and application only if the application is authenticated */}
                    {this.state.authenticated &&
                    <>
                        <AppTopbar 
                            onToggleMenu={this.onToggleMenu} 
                            isLoggedIn={this.state.authenticated} 
                            onLogout={this.logout} 
                            setSearchField={this.setSearchField}
                        />
                        <Router basename={ this.state.currentPath }>
                            <AppMenu model={this.menu} onMenuItemClick={this.onMenuItemClick} layoutMode={this.state.la} active={this.state.menuActive}/>
                            <div className="layout-main">
                                {this.state.redirect &&
                                    <Redirect to={{pathname: this.state.redirect }}/> }
                                <AppBreadCrumbWithRouter setPageTitle={this.setPageTitle} />
                                <RoutedContent />
                            </div>
                        </Router>
                        <AppFooter></AppFooter>
                    </>
                    }

                    {/* If not authenticated, show only login page */}
                    {!this.state.authenticated &&
                    <>
                        <Router basename={ this.state.currentPath }>
                            <Redirect to={{pathname: "/login"}} />
                            <Login onLogin={this.loggedIn} />
                        </Router>
                    </>
                    }
                    
                </div>
            </div>
        </React.Fragment>
        );
    }
}

export default handleResponse(App);
