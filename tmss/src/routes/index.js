import React from 'react';
import {
    Route,
    Switch,
    Redirect,
} from 'react-router-dom';

import {NotFound} from '../layout/components/NotFound';
import {ProjectList, ProjectCreate, ProjectView, ProjectEdit} from './Project';
import {Dashboard} from './Dashboard';
import {Scheduling} from './Scheduling';
import {TaskEdit, TaskView} from './Task';
import ViewSchedulingUnit from './Scheduling/ViewSchedulingUnit'
import { CycleList, CycleCreate, CycleView, CycleEdit } from './Cycle';

export const routes = [
    {
        path: "/not-found",
        component: NotFound
    },{
        path: "/dashboard",
        component: Dashboard,
        name: 'Dashboard'
    },{
        path: "/schedulingunit",
        component: Scheduling,
        name: 'Scheduling Unit'
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
        path: "/schedulingunit/view",
        component: ViewSchedulingUnit,
        name: 'Scheduling View'
    },{
        path: "/project",
        component: ProjectList,
        name: 'Project List'
    },{
        path: "/project/create",
        component: ProjectCreate,
        name: 'Project Add'
    },{
        path: "/project/view",
        component: ProjectView,
        name: 'Project View'
    },{
        path: "/project/view/:id",
        component: ProjectView,
        name: 'Project View'
    },{
        path: "/project/edit/:id",
        component: ProjectEdit,
        name: 'Project Edit'
    },{
        path: "/cycle/edit/:id",
        component: CycleEdit,
        name: 'Cycle Edit'
    },{
        path: "/cycle/view",
        component: CycleView,
        name: 'Cycle View'
    },{
        path: "/cycle/view/:id",
        component: CycleView,
        name: 'Cycle View'
    }, {
        path: "/cycle/create",
        component: CycleCreate,
        name: 'Cycle Add'
    },
    {
        path: "/cycle",
        component: CycleList,
        name: 'Cycle List'
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