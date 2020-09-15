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
import {TaskEdit, TaskView, DataProduct} from './Task';
import ViewSchedulingUnit from './Scheduling/ViewSchedulingUnit'
import SchedulingUnitCreate from './Scheduling/create';
import EditSchedulingUnit from './Scheduling/edit';
import { CycleList, CycleCreate, CycleView, CycleEdit } from './Cycle';

export const routes = [
    {
        path: "/not-found",
        component: NotFound,
        
    },{
        path: "/dashboard",
        component: Dashboard,
        name: 'Dashboard',
        title: 'Dashboard'
    },{
        path: "/schedulingunit",
        component: Scheduling,
        name: 'Scheduling Unit',
        title: 'Scheduling Unit - List'
    },{
        path: "/schedulingunit/create",
        component: SchedulingUnitCreate,
        name: 'Scheduling Unit Add'
    },{
        path: "/task",
        component: TaskView,
        name: 'Task',
        title: 'Task-View'
    },{
        path: "/task/view",
        component: TaskView,
        name: 'Task',
        title: 'Task View'
    },{
        path: "/task/view/:type/:id",
        component: TaskView,
        name: 'Task Details',
        title: 'Task Details'
    },{
        path: "/task/edit",
        component: TaskEdit,
        name: 'Task Edit',
        title: 'Task-Edit'
    },{
        path: "/schedulingunit/view",
        component: ViewSchedulingUnit,
        name: 'Scheduling View',
        title: 'Scheduling Unit - Details'
    },{
        path: "/schedulingunit/edit/:id",
        component: EditSchedulingUnit,
        name: 'Scheduling Edit',
        title: 'Scheduling Unit - Edit'
    },{
        path: "/schedulingunit/view/:type/:id",
        component: ViewSchedulingUnit,
        name: 'Scheduling View'
    },{
        path: "/project",
        component: ProjectList,
        name: 'Project List',
        title: 'Project - List'
    },{
        path: "/project/create",
        component: ProjectCreate,
        name: 'Project Add',
        title: 'Project - Add'
    },{
        path: "/project/view",
        component: ProjectView,
        name: 'Project View',
        title: 'Project - Details '
    },{
        path: "/project/view/:id",
        component: ProjectView,
        name: 'Project View',
        title: 'Project - View'
    },
    {
        path: "/project/edit/:id",
        component: ProjectEdit,
        name: 'Project Edit',
        title: 'Project Edit'
    },{
        path: "/project/:project/schedulingunit/create",
        component: SchedulingUnitCreate,
        name: 'Scheduling Unit Add',
        title: 'Scheduling Unit - Add'
    },{
        path: "/cycle/edit/:id",
        component: CycleEdit,
        name: 'Cycle Edit',
        title:'Cycle-Edit'
    },{
        path: "/cycle/view",
        component: CycleView,
        name: 'Cycle View',
        title:'Cycle-View'
    },{
        path: "/cycle/view/:id",
        component: CycleView,
        name: 'Cycle View',
        title:'Cycle-View'
    }, {
        path: "/cycle/create",
        component: CycleCreate,
        name: 'Cycle Add',
        title:'Cycle-Add'
    },
    {
        path: "/cycle",
        component: CycleList,
        name: 'Cycle List',
        title:'Cycle-List'
    },
    {
        path: "/task/view/blueprint/:id/dataproducts",
        component: DataProduct,
        name: 'Data Product'
    } 
];

export const RoutedContent = () => {
    return (
	    <Switch>
            <Redirect from="/" to="/" exact />
			{routes.map(routeProps => <Route {...routeProps} exact key={routeProps.path} />)}
        </Switch>
    );
}