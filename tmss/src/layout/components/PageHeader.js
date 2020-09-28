import React, { useEffect, useState } from 'react';
import { routes } from '../../routes';
import {matchPath, Link} from 'react-router-dom';

export default ({ title, subTitle, actions, ...props}) => {
    const [page, setPage] = useState({});

    useEffect(() => {
        const currentRoute = routes.find(route => matchPath(props.location.pathname, {path: route.path, exact: true, strict: true}));
		//for intial route ,there wont be any route object so it failed 
		if(!currentRoute){
			return;
        }
        setPage(currentRoute);
    }, [props.location.pathname]);

    const onClickLink = (action) => {
        console.log('Hi')
        if (action.link) {
            action.link();
        }
    };

    return (
        <div className="page-header">
            <div className="title">
                <h2 className="page-title">{title || page.title}</h2>
                {(page.subTitle || subTitle) && <h6 className="page-subtitle">{subTitle || page.subTitle}</h6>}
            </div>
            <div className="page-action-menu">
                {(actions || []).map(action => {
                    return (
                        <Link to={{ ...action.props }} title={action.title || ''} onClick={() => onClickLink(action)}>
                        <i className={`fa ${action.icon}`}></i>
                    </Link>
                )})}
            </div>
        </div>
    );
}