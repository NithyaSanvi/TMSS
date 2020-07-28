import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';


export class AppBreadcrumb extends Component {
	 
    static propTypes = {
        match: PropTypes.object,
		
    }
	
	
	
	renderSeparator() {
		const Seperatorstyle = {
		    'font-size': '1rem',
            'margin': '0 5px'
	}
        return (
            <li style={Seperatorstyle} className="pi pi-chevron-right"></li>
        );
    }
	
	renderHome() {
        return (
            <li className="pi pi-home">Home</li>
        );
    }
	
	


	render() {
        const { location } = this.props;
		const path = location.pathname.split('/').slice(1);
		const separator = this.renderSeparator();
		const home = this.renderHome();
		 
	const breadcrumblink = {'font-size': '1.25rem','color':'black'}	

        return (
            <div className="p-breadcrumb">
					 {home}
						 {path.map((name, index) => (
                  <li className="pi">
                    {this.renderSeparator()}
                    {index != path.length - 1 ? <Link style={breadcrumblink} to={`/${name}`}>{name}</Link> : name}
                  </li>
                ))}
            </div>
        );
    }
}