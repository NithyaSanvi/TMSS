// eslint-disable
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Link, matchPath} from 'react-router-dom';
import { routes } from '../../routes';
export class AppBreadcrumb extends Component {
    
    static propTypes = {
        match: PropTypes.object,
    }

    constructor(props) {
        super(props);
        this.state = {
            breadcrumbs: []
        }
    }

    componentDidUpdate(prev) {
        if (prev.location.pathname != this.props.location.pathname) {
            this.onRoute();
        }
    }

    componentDidMount() {
        this.onRoute();
    }

    onRoute() {
        const { breadcrumbs } = this.state;
        const currentRoute = routes.find(route => matchPath(this.props.location.pathname, {path: route.path, exact: true, strict: true}));
        if (!breadcrumbs.length) {
            this.setState({ breadcrumbs: [{...this.props.location, name: currentRoute.name}] });
            return;
        }
        const index = breadcrumbs.map(i => i.name).indexOf(currentRoute.name);
        if (index === -1) {
            this.setState({ breadcrumbs: [...breadcrumbs, {...this.props.location, name: currentRoute.name}] });
            return;
        }
        this.setState({ breadcrumbs: breadcrumbs.slice(0, index+1) });
    }

    onNavigate(item) {
        this.props.history.push({
            pathname: item.pathname,
            state: item.state
        });
    }
	
	render() {
        const { breadcrumbs } = this.state;
        return (
            <div className="p-breadcrumb">
                <li className="pi b-home"><Link className="b-link pi pi-home" to="/"/></li>
                {breadcrumbs.map((item, index) => (
                    <li className="pi">
                        <li className="pi pi-chevron-right b-separator"></li>
                        {index != breadcrumbs.length - 1 ? <span className="b-link" onClick={() => this.onNavigate(item)}>{item.name}</span> : item.name}
                    </li>
                ))}
            </div>
        );
    }
}