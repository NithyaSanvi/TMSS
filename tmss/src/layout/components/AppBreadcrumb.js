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
        if (prev.location.pathname !== this.props.location.pathname) {
            this.onRoute();
        }
    }

    componentDidMount() {
        this.onRoute();
    }

    onRoute() {
        const { breadcrumbs } = this.state;
        const { setCurrentPageName } = this.props;
        const currentRoute = routes.find(route => matchPath(this.props.location.pathname, {path: route.path, exact: true, strict: true}));
		//for intial route ,there wont be any route object so it failed 
		if(!currentRoute){
			return;
        }
        setCurrentPageName(currentRoute.name);
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
            <div className="p-breadcrumb" >
                <span className="pi b-home"><Link className="b-link pi pi-home" to="/"/></span>
                {breadcrumbs.map((item, index) => (
                    <span key={"bc_" + index} >
                        <li className="pi pi-chevron-right b-separator"></li>
                        {index !== breadcrumbs.length - 1 ? 
                            <span className="b-link" onClick={() => this.onNavigate(item)}>{item.name}</span> 
                            : <span className="b-text">{item.name}</span>}
                    </span>
                ))}
            </div>
        );
    }
}