import React from 'react';
import {
    Route,
    Switch,
    Redirect
} from 'react-router-dom';

import {NotFound} from '../layout/components/NotFound';
import {ProjectCreate, ProjectEdit} from './Project';
import {Dashboard} from './Dashboard';
import {Scheduling} from './Scheduling';
import {TaskEdit, TaskView} from './Task';
import {Cycle} from './Cycle';
import ViewSchedulingUnit from './Scheduling/ViewSchedulingUnit'

export const RoutedContent = () => {
    return (
        <Switch>
            <Redirect from="/" to="/" exact />
            <Route path="/not-found" exact component= {NotFound} />
            <Route path="/dashboard" exact component={Dashboard} />
            <Route path="/project" exact component={NotFound} />
            <Route path="/project/create" exact component={ProjectCreate} />
            <Route path="/project/edit" exact component={ProjectEdit} />
            <Route path="/project/edit/:id" exact component={ProjectEdit} />
            <Route path="/scheduling" exact component={Scheduling} />
            <Route path="/task" exact component={TaskView} />
            <Route path="/task/view" exact component={TaskView} />
            <Route path="/task/view/:type/:id" exact component={TaskView} />
            <Route path="/task/edit" exact component={TaskEdit} />
            <Route path="/schedulingunit/view" exact component={ViewSchedulingUnit} />
			 <Route path="/cycle" exact component={Cycle} />
        </Switch>
    );
}