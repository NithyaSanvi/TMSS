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
        if (action.link) {
            action.link();
        }
    };

    const onButtonClick = (e, action) => {
        if (action.actOn && action.actOn === 'click') {
            action.props.callback(e);
        }
    };

    const onButtonMouseOver = (e, action) => {
        if (action.actOn && action.actOn === 'mouseOver') {
            action.props.callback(e);
        }
    }

    return (
        <div className="page-header">
            <div className="title">
                <h2 className="page-title">{title || page.title}</h2>
                {(page.subTitle || subTitle) && <h6 className="page-subtitle">{subTitle || page.subTitle}</h6>}
            </div>
            <div className="page-action-menu">
                {(actions || []).map((action, index) =>{
                    if (action.type === 'button') {
                        return (
                            <button className="p-link" key={index} title={action.title || ''}>
                                <i className={`fa ${action.disabled?'fa-disabled':''} ${action.icon}`}  
                                    onMouseOver={(e) => action.disabled?'':onButtonMouseOver(e, action)}
                                    onClick={(e) => action.disabled?'':onButtonClick(e, action)} />
                            </button>
                        );
                    }   else {
                        return (
                            <Link key={index} className={action.classname} to={action.disabled?{}:{ ...action.props }} 
                                    title={action.title || ''} onClick={() => action.disabled?'':onClickLink(action)}>
                                <i className={`fa ${action.disabled?'fa-disabled':''} ${action.icon}`}></i>
                            </Link>
                        );
                    }
                })}
            </div>
        </div>
    );
}