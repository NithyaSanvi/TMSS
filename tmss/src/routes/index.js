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

export const RoutedContent = () => {
    return (
	     
        <Switch>
            <Redirect from="/" to="/" exact />
			<Route path="/Not-found" exact component= {NotFound} />
            <Route path="/Dashboard" exact component={Dashboard} />
            <Route path="/Scheduling" exact component={Scheduling} />
            <Route path="/Task" exact component={TaskView} />
            <Route path="/Task/View" exact component={TaskView} />
            <Route path="/Task/view/:type/:id" exact component={TaskView} />
            <Route path="/Task/Edit" exact component={TaskEdit} />
            <Route path="/Scheduling/View" exact component={ViewSchedulingUnit} />
        </Switch>
    );
}