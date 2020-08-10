import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from "react-dom/test-utils";
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import _ from 'lodash';
import moment from 'moment';

import {ProjectEdit} from './edit';
import ProjectService from '../../services/project.service';
import CycleService from '../../services/cycle.service';

import ProjectServiceMock from '../../__mocks__/project.service.data';


let projectCategoriesSpy, allCycleSpy, periodCategoriesSpy, projectDetailsSpy, resourcesSpy, projectQuotaSpy, 
    updateProjectSpy, savePQSpy, updatePQSpy, deletePQSpy;

beforeEach(() => {
  setMockSpy();
});

afterEach(() => {
  // cleanup on exiting
  clearMockSpy();
  cleanup();
});

/**
 * To set mock spy for Services that have API calls to the back end to fetch data
 */
const setMockSpy = (() => {
    projectCategoriesSpy = jest.spyOn(ProjectService, 'getProjectCategories');
    projectCategoriesSpy.mockImplementation(() => { return Promise.resolve([{url: "Regular", value: 'Regular'}, {url: "User Shared Support", value: 'User Shared Support'}])});
    periodCategoriesSpy = jest.spyOn(ProjectService, 'getPeriodCategories');
    periodCategoriesSpy.mockImplementation(() => { return Promise.resolve([{url: "Single Cycle", value: 'Single Cycle'}, {url: "Long Term", value: 'Long Term'}])});
    allCycleSpy = jest.spyOn(CycleService, 'getAllCycles');
    allCycleSpy.mockImplementation(() => { 
        return Promise.resolve([{url: "http://localhost:3000/api/cycle/Cycle-0/", name: 'Cycle-0'},
                                {url: "http://localhost:3000/api/cycle/Cycle-1/", name: 'Cycle-1'},
                                {url: "http://192.168.99.100:8008/api/cycle/Cycle%200/", name: 'Cycle 0'}]);
    });
    projectDetailsSpy = jest.spyOn(ProjectService, 'getProjectDetails');
    projectDetailsSpy.mockImplementation((id) => { 
        return Promise.resolve(_.find(ProjectServiceMock.project, {name: id}))});
    resourcesSpy = jest.spyOn(ProjectService, 'getResources');
    resourcesSpy.mockImplementation(() => {
        // console.log(ProjectServiceMock.resources);
        let resourceList= [];
        Object.assign(resourceList, ProjectServiceMock.resources);
        return Promise.resolve(resourceList);
    });
    projectQuotaSpy = jest.spyOn(ProjectService, 'getProjectQuota');
    projectQuotaSpy.mockImplementation((id) => {
        let quota = {};
        Object.assign(quota, _.find(ProjectServiceMock.projectQuota, {id: id}));
        return Promise.resolve(quota);
    });
    updateProjectSpy = jest.spyOn(ProjectService, 'updateProject');
    updateProjectSpy.mockImplementation((id, project) => {
        let updatedProject = {};
        Object.assign(updatedProject, _.find(ProjectServiceMock.project, {name: id}));
        updatedProject.name = project.name;
        updatedProject.updated_at = new Date();
        return Promise.resolve(updatedProject);
    });
    savePQSpy = jest.spyOn(ProjectService, 'saveProjectQuota');
    savePQSpy.mockImplementation(() => {
        return Promise.resolve(ProjectServiceMock.projectQuota[0]);
    });
    updatePQSpy = jest.spyOn(ProjectService, 'updateProjectQuota');
    updatePQSpy.mockImplementation((quota) => {
        return Promise.resolve(_.find(ProjectServiceMock.projectQuota, {id: quota.id}));
    });
    deletePQSpy = jest.spyOn(ProjectService, 'deleteProjectQuota');
    deletePQSpy.mockImplementation(() => {
        return Promise.resolve({message: 'deleted'});
    });
});

const clearMockSpy = (() => {
    projectCategoriesSpy.mockRestore();
    periodCategoriesSpy.mockRestore();
    projectDetailsSpy.mockRestore();
    resourcesSpy.mockRestore();
    projectQuotaSpy.mockRestore();
    updateProjectSpy.mockRestore();
    savePQSpy.mockRestore();
    updatePQSpy.mockRestore();
    deletePQSpy.mockRestore();
});

it("renders nothing if no project details found", async () => {
    console.log("renders nothing if no project details found..........");
    let content;
    await act(async () => {
        content = render(<Router><ProjectEdit match={{params:{id: "OSR-12"}}} location={{}} /></Router>);
    });

    expect(content.queryByText("Project - Edit")).toBe(null);
});

it("renders input fields with Project details if found", async () => {
    console.log("renders input fields with Project details if found..........");
    let content;
    await act(async () => {
        content = render(<Router><ProjectEdit match={{params:{id: "OSR-11"}}} location={{}} /></Router>);
    });

    // expect(content.baseElement).toBe(null);
    expect(content.queryByText("Project - Edit")).not.toBe(null);
    expect(content.queryByTestId("name").value).toBe('OSR-11');

    const spinButtons = content.queryAllByRole("spinbutton");
    const trigPrioInput = spinButtons.filter(function(element) { return element.id==="trig_prio"})[0];
    expect(trigPrioInput.value).toBe("990"); 
    
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];
    expect(rankInput.value).toBe("5"); 

    const trigger = content.getAllByLabelText(/trigger/i).filter((element) => { return element.id==="trigger"})[0];
    expect(trigger.hasAttribute("checked")).toBeTruthy();

    const projCatInput = content.getAllByRole("listbox")[0].children[0] ;
    expect(content.queryAllByText('Select Project Category').length).toBe(1);
    expect(content.queryAllByText('Regular').length).toBe(3);

    const projPeriodInput = content.getAllByRole("listbox")[1].children[0] ;
    expect(content.queryAllByText('Select Period Category').length).toBe(1);
    expect(content.queryAllByText('Single Cycle').length).toBe(3);

    const cycleInput = content.getAllByRole("listbox")[2] ;
    expect(content.queryAllByText('Cycle 0').length).toBe(2);

    expect(content.queryByPlaceholderText("CEP Processing Time").value).toBe("10 Hours");
    expect(content.queryByPlaceholderText("LOFAR Observing Time").value).toBe("20 Hours");
    expect(content.queryByPlaceholderText("LOFAR Observing Time prio A").value).toBe("30 Hours");
    expect(content.queryByPlaceholderText("LOFAR Observing Time prio B").value).toBe("40 Hours");
    expect(content.queryByPlaceholderText("LOFAR Support Time").value).toBe("50 Hours");
    expect(content.queryByPlaceholderText("LTA Storage").value).toBe("6 TB");
    expect(content.queryByPlaceholderText("Number of triggers").value).toBe("7 Numbers");
    expect(content.queryByPlaceholderText("Support hours").value).toBe("8 ");

    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();

});

it("save Project after editing fields", async () => {
    console.log("save Project after editing fields ..........");
    let content;
    await act(async () => {
        content = render(<Router><ProjectEdit match={{params:{id: "OSR-11"}}} location={{}} /></Router>);
    });

    // expect(content.baseElement).toBe(null);
    expect(content.queryByText("Project - Edit")).not.toBe(null);
    expect(content.queryByTestId("name").value).toBe('OSR-11');

    const spinButtons = content.queryAllByRole("spinbutton");
    const trigPrioInput = spinButtons.filter(function(element) { return element.id==="trig_prio"})[0];
    fireEvent.blur(trigPrioInput, { target: { value: 900 } });
    expect(trigPrioInput.value).toBe("900"); 
    
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];
    fireEvent.blur(rankInput, { target: { value: 2 } });
    expect(rankInput.value).toBe("2");

    const trigger = content.getAllByLabelText(/trigger/i).filter((element) => { return element.id==="trigger"})[0];
    fireEvent.click(trigger);
    expect(trigger.hasAttribute("checked")).toBeFalsy();

    const projCatInput = content.getAllByRole("listbox")[0].children[1] ;
    fireEvent.click(projCatInput);
    // After selecting Project Category
    expect(content.queryAllByText('Select Project Category').length).toBe(1);
    expect(content.queryAllByText('Regular').length).toBe(1);
    expect(content.queryAllByText('User Shared Support').length).toBe(3);

    const projPeriodInput = content.getAllByRole("listbox")[1].children[1] ;
    fireEvent.click(projPeriodInput);
    expect(content.queryAllByText('Select Period Category').length).toBe(1);
    expect(content.queryAllByText('Single Cycle').length).toBe(1);
    expect(content.queryAllByText('Long Term').length).toBe(3);

    const oldCycleInput = content.getAllByRole("listbox")[2].children[2] ;
    const newCycleInput = content.getAllByRole("listbox")[2].children[0] ;
    fireEvent.click(oldCycleInput);
    fireEvent.click(newCycleInput);
    // After selecting Cycle
    expect(content.queryAllByText('Cycle-0').length).toBe(2);
    expect(content.queryAllByText('Cycle 0').length).toBe(1);

    const lofarObsTimeInput = content.queryByPlaceholderText('LOFAR Observing Time');
    fireEvent.blur(lofarObsTimeInput, { target: { value: 10 } });
    expect(lofarObsTimeInput.value).toBe('10 Hours');
    
    const cepProcTimeInput = content.queryByPlaceholderText('CEP Processing Time');
    fireEvent.blur(cepProcTimeInput, { target: { value: 5 } });
    expect(cepProcTimeInput.value).toBe('5 Hours');
    
    const ltaStorageInput = content.queryByPlaceholderText('LTA Storage');
    fireEvent.blur(ltaStorageInput, { target: { value: 2 } });
    expect(ltaStorageInput.value).toBe('2 TB');
    
    const noOfTriggerInput = content.queryByPlaceholderText('Number of triggers');
    fireEvent.blur(noOfTriggerInput, { target: { value: 3 } });
    expect(noOfTriggerInput.value).toBe('3 Numbers');
    
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();

    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    
    // After saving project, Success dialog should be displayed
    expect(updateProjectSpy).toHaveBeenCalledTimes(1);
    expect(updatePQSpy).toHaveBeenCalledTimes(4);
    expect(content.queryByText("Success")).not.toBe(null);
});

it("save Project after adding, modifying and deleting resources", async () => {
    console.log("save Project after adding, modifying and deleting resource..........");
    let content;
    await act(async () => {
        content = render(<Router><ProjectEdit match={{params:{id: "OSR-11"}}} location={{}} /></Router>);
    });

    // expect(content.baseElement).toBe(null);
    expect(content.queryByText("Project - Edit")).not.toBe(null);
    expect(content.queryByTestId("name").value).toBe('OSR-11');

    // Adding new resource
    const addResourceInput = content.getAllByRole("listbox")[3].children[0] ;
    fireEvent.click(addResourceInput);
    // After selecting New Resource
    expect(content.queryAllByText('Add Resources').length).toBe(1);
    expect(content.queryAllByText('LOFAR Support hours').length).toBe(3);
    const addResourceBtn = content.queryByTestId('add_res_btn');
    fireEvent.click(addResourceBtn);
    expect(content.queryAllByText('Add Resources').length).toBe(2);
    expect(content.queryByPlaceholderText('LOFAR Support hours')).not.toBe(null);
    const lofarSupHrsInput = content.queryByPlaceholderText('LOFAR Support hours');
    fireEvent.blur(lofarSupHrsInput, { target: { value: 100 } });
    expect(lofarSupHrsInput.value).toBe('100 ');

    // Editing existing resource
    const lofarObsTimeInput = content.queryByPlaceholderText('LOFAR Observing Time');
    fireEvent.blur(lofarObsTimeInput, { target: { value: 10 } });
    expect(lofarObsTimeInput.value).toBe('10 Hours');
    
    // Deleting existing resource
    const removeResourceBtn = content.queryByTestId('Support hours-btn');
    fireEvent.click(removeResourceBtn);
    
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();

    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    
    // After saving project, Success dialog should be displayed
    expect(updateProjectSpy).toHaveBeenCalledTimes(1);
    expect(savePQSpy).toHaveBeenCalledTimes(1);
    expect(updatePQSpy).toHaveBeenCalledTimes(1);
    expect(deletePQSpy).toHaveBeenCalledTimes(1);
    expect(content.queryByText("Success")).not.toBe(null);
});