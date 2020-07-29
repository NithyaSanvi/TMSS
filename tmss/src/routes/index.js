import React from 'react';
import {
    Route,
    Switch,
    Redirect,
} from 'react-router-dom';

import {NotFound} from '../layout/components/NotFound';
import {Dashboard} from './Dashboard';
import {Scheduling} from './Scheduling';
import {TaskEdit, TaskView} from './Task';
import ViewSchedulingUnit from './Scheduling/ViewSchedulingUnit'

export const routes = [
    {
        path: "/Not-found",
        component: NotFound
    },{
        path: "/dashboard",
        component: Dashboard,
        name: 'Dashboard'
    },{
        path: "/scheduling",
        component: Scheduling,
        name: 'Scheduling'
    },{
        path: "/task",
        component: TaskView,
        name: 'Task'
    },{
        path: "/task/view",
        component: TaskView,
        name: 'Task'
    },{
        path: "/task/view/:type/:id",
        component: TaskView,
        name: 'Task Details'
    },{
        path: "/task/edit",
        component: TaskEdit,
        name: 'Task Edit'
    },{
        path: "/scheduling/View",
        component: ViewSchedulingUnit,
        name: 'Scheduling View'
    },
];

export const RoutedContent = () => {
    return (
	     
        <Switch>
            <Redirect from="/" to="/" exact />
			{routes.map(routeProps => <Route {...routeProps} exact key={routeProps.path} />)}
        </Switch>
    );
}