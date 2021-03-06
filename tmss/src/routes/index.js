import React from 'react';
import {
    Route,
    Switch,
    // Redirect,
} from 'react-router-dom';

import {NotFound} from '../layout/components/NotFound';
import {ProjectList, ProjectCreate, ProjectView, ProjectEdit} from './Project';
import {Dashboard} from './Dashboard';
import {Scheduling} from './Scheduling';
import {TaskEdit, TaskView, DataProduct, TaskList} from './Task';
import ViewSchedulingUnit from './Scheduling/ViewSchedulingUnit'
import SchedulingUnitCreate from './Scheduling/create';
import EditSchedulingUnit from './Scheduling/edit';
import { CycleList, CycleCreate, CycleView, CycleEdit } from './Cycle';
import { TimelineView, WeekTimelineView} from './Timeline';
import { ReservationCreate, ReservationList, ReservationView, ReservationEdit } from './Reservation';
import { FindObjectResult } from './Search/'
import SchedulingSetCreate from './Scheduling/excelview.schedulingset';
import Workflow from './Workflow';
import { Growl } from 'primereact/components/growl/Growl';
import { setAppGrowl } from '../layout/components/AppGrowl';

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
        name: 'Scheduling Unit Add',
        title: 'Scheduling Unit - Add'
    },{
        path: "/task",
        component: TaskList,
        name: 'Task',
        title: 'Task-List'
    },{
        path: "/task/view",
        component: TaskView,
        name: 'Task',
        title: 'Task View'
    },{
        path: "/task/view/:type/:id",
        component: TaskView,
        name: 'Task View',
        title: 'Task - View'
    },{
        path: "/task/edit",
        component: TaskEdit,
        name: 'Task Edit',
        title: 'Task-Edit'
    },{
        path: "/task/edit/draft/:id",
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
        path: "/project/view/:id",
        component: ProjectView,
        name: 'Project View',
        title: 'Project - Details '
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
        path: "/su/timelineview",
        component: TimelineView,
        name: 'Scheduling Unit Timeline',
        title:'SU Timeline View'
    },
    {
        path: "/su/timelineview/week",
        component: WeekTimelineView,
        name: 'Scheduling Unit Timeline - Week',
        title:'SU Weekly Timeline View'
    },
    {
        path: "/task/view/blueprint/:id/dataproducts",
        component: DataProduct,
        name: 'Data Product'
    },
    {
        path: "/schedulingset/schedulingunit/create",
        component: SchedulingSetCreate,
        name: 'Scheduling Set Add'
    },
    {
       path: "/schedulingunit/:id/workflow",
       component: Workflow,
       name: 'Workflow',
       title: 'QA Reporting (TO)'
    },
    {
        path: "/reservation/list",
        component: ReservationList,
        name: 'Reservation List',
        title:'Reservation List'
    },
    {
        path: "/reservation/create",
        component: ReservationCreate,
        name: 'Reservation Add',
        title: 'Reservation - Add'
    },
    {
        path: "/reservation/view/:id",
        component: ReservationView,
        name: 'Reservation View',
        title: 'Reservation - View'
    },
    {
        path: "/reservation/edit/:id",
        component: ReservationEdit,
        name: 'Reservation Edit',
        title: 'Reservation - Edit'
    },
    {
        path: "/find/object/:type/:id",
        component: FindObjectResult,
        name: 'Find Object',
        title: 'Find Object'
    }
];

export const RoutedContent = () => {
    return (
        <>
        <Growl ref={(el) => setAppGrowl(el)} />
	    <Switch>
            {/* <Redirect from="/" to="/" exact /> */}
            {routes.map(routeProps => <Route {...routeProps} exact key={routeProps.path} />)}
        </Switch>
        </>
    );
}