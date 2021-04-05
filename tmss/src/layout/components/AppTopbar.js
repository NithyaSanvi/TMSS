
import React, {Component} from 'react';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import { PropTypes } from 'prop-types';
import Auth from '../../authenticate/auth';
import { FindObject } from './FindObject';
export class AppTopbar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            username: Auth.getUser().name,
        };
    }
        
    static defaultProps = {
        onToggleMenu: null
    }
    
    static propTypes = {
        onToggleMenu: PropTypes.func.isRequired
    }
    
    render() {
        return (
            <React.Fragment>
                <div className="layout-wrapper layout-static layout-static-sidebar-inactive">
                    <div className="layout-topbar clearfix">
                        
                        <button className="p-link layout-menu-button" onClick={this.props.onToggleMenu}>
						<i className="pi pi-bars"></i></button>
                        <span className="header-title">TMSS</span>
                       
                        {this.props.isLoggedIn &&
                            <div className="top-right-bar">
                                <span><i className="fa fa-user"></i>{this.state.username}</span>
                                <button className="p-link layout-menu-button" onClick={this.props.onLogout}>
                                <i className="pi pi-power-off"></i></button>
                            </div>
                        }
                       <FindObject setSearchField={this.props.setSearchField} />
                    </div>
                        
                </div>
            </React.Fragment>
        )
    }
}
