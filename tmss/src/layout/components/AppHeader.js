import React, { useEffect, useState } from 'react';
import { routes } from '../../routes';
import {matchPath, Link} from 'react-router-dom';

export default (props) => {
    const [currentPage, setCurrentPage] = useState({});

    useEffect(() => {
        const currentRoute = routes.find(route => matchPath(props.location.pathname, {path: route.path, exact: true, strict: true}));
		//for intial route ,there wont be any route object so it failed 
		if(!currentRoute){
			return;
        }
        setCurrentPage(currentRoute);
    }, []);

    // In future we need to enable the click functionality instead of link
    // const onTrigger = (action) => {
    //     if (action.callback) {
    //         action.callback();
    //     }
    // }

    return (
        <div className="app-header">
            <div className="title">
                <h2 className="app-header-name">{currentPage.name}</h2>
                {currentPage.subtitle && <h6 className="app-header-subtitle">{currentPage.subtitle}</h6>}
            </div>
            <div className="app-header-actions">
                {(props.actions || []).map(action => (
                    <Link to={{ pathname: action.link }}>
                        <i className={`fa ${action.name}`}></i>
                    </Link>
                ))}
            </div>
        </div>
    );
}