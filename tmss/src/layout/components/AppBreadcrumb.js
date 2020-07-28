import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';

export class AppBreadcrumb extends Component {
	 
    static propTypes = {
        match: PropTypes.object,
    }

	renderSeparator() {
        return (
            <li className="pi pi-chevron-right b-separator"></li>
        );
    }
	
	render() {
        const { location } = this.props;
		const path = location.pathname === '/' ? [] : location.pathname.split('/').slice(1);
        return (
            <div className="p-breadcrumb">
                <li className="pi b-home"><Link className="b-link pi pi-home" to="/"/></li>
                {path.map((name, index) => (
                    <li className="pi">
                        {this.renderSeparator()}
                        {index != path.length - 1 ? <span className="b-link" onClick={this.props.history.goBack}>{name}</span> : name}
                    </li>
                ))}
            </div>
        );
    }
}