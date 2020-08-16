import React, {Component} from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import classNames from 'classnames';
import {AppTopbar} from './layout/components/AppTopbar';
import {AppMenu} from './layout/components/AppMenu';
import {AppFooter } from './layout/components/AppFooter';
import {RoutedContent} from './routes';
import {AppBreadcrumb } from "./layout/components/AppBreadcrumb";
import {withRouter } from 'react-router';

import 'primeicons/primeicons.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.css';
import './layout/layout.scss';
import 'primeflex/primeflex.css';
import './App.scss';
import './App.css';

class App extends Component {
    constructor() {
    super();
    this.state = {
	  layoutMode: 'static',
      currentMenu: '',
      currentPath: '/',
	  staticMenuInactive: false,
        overlayMenuActive: false,
        mobileMenuActive: false,
        currentPageName: ''
    };
	    this.onWrapperClick = this.onWrapperClick.bind(this);
        this.onToggleMenu = this.onToggleMenu.bind(this);
        this.onSidebarClick = this.onSidebarClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.setCurrentPageName = this.setCurrentPageName.bind(this);
  
      this.menu = [
      {label: 'Dashboard', icon: 'pi pi-fw pi-home', to:'/dashboard'},
      {label: 'Cycle', icon: 'pi pi-fw pi-spinner', to:'/cycle'},
      {label: 'Scheduling Units', icon: 'pi pi-fw pi-calendar', to:'/schedulingunit'},
      {label: 'Tasks', icon: 'pi pi-fw pi-check-square', to:'/task'},
      {label: 'Project', icon: 'fa fa-fw fa-binoculars', to:'/project'}
    ];

    // this.menuComponent = {'Dashboard': Dashboard}
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
                });
            }
            else if (this.state.layoutMode === 'static') {
                this.setState({
                    staticMenuInactive: !this.state.staticMenuInactive
                });
            }
        }
        else {
            const mobileMenuActive = this.state.mobileMenuActive;
            this.setState({
                mobileMenuActive: !mobileMenuActive
            });
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

    setCurrentPageName(currentPageName) {
        if (currentPageName !== this.state.currentPageName) {
            this.setState({ currentPageName })
        }
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
		
     return (
      <React.Fragment>
           <div className="App">
           {/* <div className={wrapperClass} onClick={this.onWrapperClick}> */}
           <div className={wrapperClass}>
            <AppTopbar onToggleMenu={this.onToggleMenu}></AppTopbar>
            <Router basename={ this.state.currentPath }>
			  <AppMenu model={this.menu} onMenuItemClick={this.onMenuItemClick} />
              <div className="layout-main">
			  <AppBreadCrumbWithRouter setCurrentPageName={this.setCurrentPageName} />
              {/* Display current pagename */}
              <h2>{this.state.currentPageName}</h2>
			  <RoutedContent />
              </div>
            </Router>
            <AppFooter></AppFooter>
            </div>
            </div>
	   </React.Fragment>
    );
  }
}

export default App;