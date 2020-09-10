import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from "react-dom/test-utils";
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import {ProjectCreate} from './create';
import ProjectService from '../../services/project.service';
import CycleService from '../../services/cycle.service';

import ProjectServiceMock from '../../__mocks__/project.service.data';

let projectCategoriesSpy, allCycleSpy, periodCategoriesSpy, saveProjectSpy, resourcesSpy, projectResourceDefaultsSpy;

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
    projectCategoriesSpy.mockImplementation(() => { return Promise.resolve(ProjectServiceMock.project_categories)});
    periodCategoriesSpy = jest.spyOn(ProjectService, 'getPeriodCategories');
    periodCategoriesSpy.mockImplementation(() => { return Promise.resolve(ProjectServiceMock.period_categories)});
    allCycleSpy = jest.spyOn(CycleService, 'getAllCycles');
    allCycleSpy.mockImplementation(() => { 
        return Promise.resolve([{url: "http://localhost:3000/api/cycle/Cycle-0", name: 'Cycle-0'},
                                    {url: "http://localhost:3000/api/cycle/Cycle-1", name: 'Cycle-1'}]);
    });
    resourcesSpy = jest.spyOn(ProjectService, 'getResources');
    resourcesSpy.mockImplementation(() => {
        return Promise.resolve(ProjectServiceMock.resources);
    });
    projectResourceDefaultsSpy = jest.spyOn(ProjectService, 'getDefaultProjectResources');
    projectResourceDefaultsSpy.mockImplementation(() => {
        return Promise.resolve(ProjectServiceMock.projectResourceDefaults);
    });
    
    saveProjectSpy = jest.spyOn(ProjectService, 'saveProject');
    saveProjectSpy.mockImplementation((project, projectQuota) => { 
        project.url = `http://localhost:3000/api/project/${project.name}`;
        return Promise.resolve(project)
    });
});

const clearMockSpy = (() => {
    projectCategoriesSpy.mockRestore();
    periodCategoriesSpy.mockRestore();
    allCycleSpy.mockRestore();
    saveProjectSpy.mockRestore();
});

it("renders without crashing with all back-end data loaded", async () => {
    console.log("renders without crashing with all back-end data loaded ------------------------");
    
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });
    
    expect(content.queryByText('Project - Add')).not.toBe(null);        // Page loaded successfully
    expect(projectCategoriesSpy).toHaveBeenCalled();                    // Mock Spy called successfully
    expect(content.queryByText('Regular')).toBeInTheDocument();         // Project Category Dropdown  loaded successfully
    expect(content.queryByText('Single Cycle')).toBeInTheDocument();    // Period Category Dropdown loaded successfully
    expect(content.queryByText('Cycle-0')).toBeInTheDocument();         // Cycle multi-select loaded successfully
    expect(content.queryAllByText('Add Resources').length).toBe(2);     // Resource Dropdown loaded successfully
    expect(content.queryByText('Support hours')).toBeInTheDocument();         // Resources other than Default Resources listed in dropdown
    expect(content.queryByPlaceholderText('Support Hours')).toBe(null);       // No resources other than Default Resources listed to get input
    expect(content.queryByPlaceholderText('LOFAR Observing Time').value).toBe('1 Hours');         // Default Resource Listed with default value
});

it("Save button disabled initially when no data entered", async () => {
    console.log("Save button disabled initially when no data entered -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });
    expect(content.queryByTestId('save-btn')).toHaveAttribute("disabled");
});

it("Save button enabled when mandatory data entered", async () => {
    console.log("Save button enabled when mandatory data entered -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });
    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const spinButtons = content.queryAllByRole("spinbutton");
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];
    
    // Set values for all mandatory input and test if save button is enabled
    fireEvent.change(nameInput, { target: { value: 'OSR' } });
    expect(nameInput.value).toBe("OSR");
    fireEvent.change(descInput, { target: { value: 'OSR' } });
    expect(descInput.value).toBe("OSR");
    fireEvent.blur(rankInput, { target: { value: 1 } });
    expect(rankInput.value).toBe("1");
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
});

it("renders Save button enabled when all data entered", async () => {
    console.log("renders Save button enabled when all data entered -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const spinButtons = content.queryAllByRole("spinbutton");
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];
    const trigPrioInput = spinButtons.filter(function(element) { return element.id==="trig_prio"})[0];
    const trigger = content.getByLabelText(/trigger/i);
    const projCatInput = content.getAllByRole("listbox")[0].children[0] ;
    const projPeriodInput = content.getAllByRole("listbox")[1].children[0] ;
    const cycleInput = content.getAllByRole("listbox")[2].children[0] ;
        
        fireEvent.change(nameInput, { target: { value: 'OSR' } });
        expect(nameInput.value).toBe("OSR");
        
        fireEvent.change(descInput, { target: { value: 'OSR' } });
        expect(descInput.value).toBe("OSR");
        
        fireEvent.blur(rankInput, { target: { value: 1 } });
        expect(rankInput.value).toBe("1");
        
        expect(trigPrioInput.value).toBe("1000");                       // Check for default value
        fireEvent.blur(trigPrioInput, { target: { value: 100 } });
        expect(trigPrioInput.value).toBe("100");                        // Check for new value
        
        fireEvent.click(trigger);
        expect(trigger.hasAttribute("checked")).toBeTruthy();
        
        // Before selecting Project Category
        expect(content.queryAllByText('Select Project Category').length).toBe(2);
        expect(content.queryAllByText('Regular').length).toBe(1);
        expect(content.getAllByRole("listbox")[0].children.length).toBe(2);
        fireEvent.click(projCatInput);
        // After selecting Project Category
        expect(content.queryAllByText('Select Project Category').length).toBe(1);
        expect(content.queryAllByText('Regular').length).toBe(3);
        
        // Before selecting Period Category
        expect(content.queryAllByText('Select Period Category').length).toBe(2);
        expect(content.queryAllByText('Single Cycle').length).toBe(1);
        expect(content.getAllByRole("listbox")[1].children.length).toBe(2);
        fireEvent.click(projPeriodInput);
        // After selecting Period Category
        expect(content.queryAllByText('Select Period Category').length).toBe(1);
        expect(content.queryAllByText('Single Cycle').length).toBe(3);
        
        // Before selecting Cycle
        expect(content.queryAllByText('Cycle-0').length).toBe(1);
        expect(content.getAllByRole("listbox")[2].children.length).toBe(2);
        fireEvent.click(cycleInput);
        // After selecting Cycle
        expect(content.queryAllByText('Cycle-0').length).toBe(2);
        
        expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    // });
});

it("save project with mandatory fields", async () => {
    console.log("save project -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const spinButtons = content.queryAllByRole("spinbutton");
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];
    
    fireEvent.change(nameInput, { target: { value: 'OSR' } });
    expect(nameInput.value).toBe("OSR");
    fireEvent.change(descInput, { target: { value: 'OSR' } });
    expect(descInput.value).toBe("OSR");
    fireEvent.blur(rankInput, { target: { value: 1 } });
    expect(rankInput.value).toBe("1");
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    expect(content.queryByTestId('projectId').value).toBe("");
    expect(content.queryByText("Success")).toBe(null);
    
    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    
    // After saving project, URL should be available and Success dialog should be displayed
    expect(content.queryByTestId('projectId').value).toBe("http://localhost:3000/api/project/OSR");
    expect(content.queryByText("Success")).not.toBe(null);
});

it("save project with default resources", async () => {
    console.log("save project with default resources -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const spinButtons = content.queryAllByRole("spinbutton");
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];

    fireEvent.change(nameInput, { target: { value: 'OSR' } });
    expect(nameInput.value).toBe("OSR");
    fireEvent.change(descInput, { target: { value: 'OSR' } });
    expect(descInput.value).toBe("OSR");
    fireEvent.blur(rankInput, { target: { value: 1 } });
    expect(rankInput.value).toBe("1");
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    expect(content.queryByTestId('projectId').value).toBe("");
    expect(content.queryByText("Success")).toBe(null);
    
    const lofarObsTimeInput = content.queryByPlaceholderText('LOFAR Observing Time');
    fireEvent.change(lofarObsTimeInput, { target: { value: 10 } });
    expect(lofarObsTimeInput.value).toBe('10');
    
    const lofarObsTimeAInput = content.queryByPlaceholderText('LOFAR Observing Time prio A');
    fireEvent.change(lofarObsTimeAInput, { target: { value: 15 } });
    expect(lofarObsTimeAInput.value).toBe('15');
    
    const lofarObsTimeBInput = content.queryByPlaceholderText('LOFAR Observing Time prio B');
    fireEvent.change(lofarObsTimeBInput, { target: { value: 20 } });
    expect(lofarObsTimeBInput.value).toBe('20');
    
    const cepProcTimeInput = content.queryByPlaceholderText('CEP Processing Time');
    fireEvent.change(cepProcTimeInput, { target: { value: 5 } });
    expect(cepProcTimeInput.value).toBe('5');
    
    const ltaStorageInput = content.queryByPlaceholderText('LTA Storage');
    fireEvent.change(ltaStorageInput, { target: { value: 2 } });
    expect(ltaStorageInput.value).toBe('2');
    
    const noOfTriggerInput = content.queryByPlaceholderText('Number of triggers');
    fireEvent.change(noOfTriggerInput, { target: { value: 3 } });
    expect(noOfTriggerInput.value).toBe('3');
    
    const lofarSupTimeInput = content.queryByPlaceholderText('LOFAR Support Time');
    fireEvent.change(lofarSupTimeInput, { target: { value: 25 } });
    expect(lofarSupTimeInput.value).toBe('25');
    
    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    
    // After saving project, URL should be available and Success dialog should be displayed
    expect(content.queryByTestId('projectId').value).toBe("http://localhost:3000/api/project/OSR");
    expect(content.queryByText("Success")).not.toBe(null);
});

it("save project with added resources", async () => {
    console.log("save project with added resources -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const spinButtons = content.queryAllByRole("spinbutton");
    const rankInput = spinButtons.filter(function(element) { return element.id==="proj-rank"})[0];

    fireEvent.change(nameInput, { target: { value: 'OSR' } });
    expect(nameInput.value).toBe("OSR");
    fireEvent.change(descInput, { target: { value: 'OSR' } });
    expect(descInput.value).toBe("OSR");
    fireEvent.blur(rankInput, { target: { value: 1 } });
    expect(rankInput.value).toBe("1");
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    expect(content.queryByTestId('projectId').value).toBe("");
    expect(content.queryByText("Success")).toBe(null);
    
    const lofarObsTimeInput = content.queryByPlaceholderText('LOFAR Observing Time');
    fireEvent.change(lofarObsTimeInput, { target: { value: 10 } });
    expect(lofarObsTimeInput.value).toBe('10');
    
    const lofarObsTimeAInput = content.queryByPlaceholderText('LOFAR Observing Time prio A');
    fireEvent.change(lofarObsTimeAInput, { target: { value: 15 } });
    expect(lofarObsTimeAInput.value).toBe('15');
    
    const lofarObsTimeBInput = content.queryByPlaceholderText('LOFAR Observing Time prio B');
    fireEvent.change(lofarObsTimeBInput, { target: { value: 20 } });
    expect(lofarObsTimeBInput.value).toBe('20');
    
    const cepProcTimeInput = content.queryByPlaceholderText('CEP Processing Time');
    fireEvent.change(cepProcTimeInput, { target: { value: 5 } });
    expect(cepProcTimeInput.value).toBe('5');
    
    const ltaStorageInput = content.queryByPlaceholderText('LTA Storage');
    fireEvent.change(ltaStorageInput, { target: { value: 2 } });
    expect(ltaStorageInput.value).toBe('2');
    
    const noOfTriggerInput = content.queryByPlaceholderText('Number of triggers');
    fireEvent.change(noOfTriggerInput, { target: { value: 3 } });
    expect(noOfTriggerInput.value).toBe('3');
    
    const lofarSupTimeInput = content.queryByPlaceholderText('LOFAR Support Time');
    fireEvent.change(lofarSupTimeInput, { target: { value: 25 } });
    expect(lofarSupTimeInput.value).toBe('25');
    
    // Before selecting New Resource
    expect(content.queryAllByText('Add Resources').length).toBe(2);
    expect(content.queryAllByText('Support hours').length).toBe(1);
    expect(content.getAllByRole("listbox")[3].children.length).toBe(2);
    expect(content.queryByPlaceholderText('Support hours')).toBe(null);
    const addResourceInput = content.getAllByRole("listbox")[3].children[1] ;
    fireEvent.click(addResourceInput);
    // After selecting New Resource
    expect(content.queryAllByText('Add Resources').length).toBe(1);
    expect(content.queryAllByText('Support hours').length).toBe(3);

    const addResourceBtn = content.queryByTestId('add_res_btn');
    fireEvent.click(addResourceBtn);
    expect(content.queryAllByText('Add Resources').length).toBe(2);
    expect(content.queryByPlaceholderText('Support hours')).not.toBe(null);

    const newResourceInput = content.queryByPlaceholderText('Support hours');
    fireEvent.change(newResourceInput, { target: { value: 30 } });
    expect(newResourceInput.value).toBe('30');
    
    
    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    
    // After saving project, URL should be available and Success dialog should be displayed
    expect(content.queryByTestId('projectId').value).toBe("http://localhost:3000/api/project/OSR");
    expect(content.queryByText("Success")).not.toBe(null);
});

it("remove default resource and added resource", async () => {
    console.log("remove default resource and added resource -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><ProjectCreate /></Router>);
    });

    // Before selecting New Resource
    expect(content.queryAllByText('Add Resources').length).toBe(2);
    expect(content.queryAllByText('Support hours').length).toBe(1);
    expect(content.getAllByRole("listbox")[3].children.length).toBe(2);
    expect(content.queryByPlaceholderText('Support hours')).toBe(null);
    const addResourceInput = content.getAllByRole("listbox")[3].children[1] ;
    fireEvent.click(addResourceInput);
    // After selecting New Resource
    expect(content.queryAllByText('Add Resources').length).toBe(1);
    expect(content.queryAllByText('Support hours').length).toBe(3);

    const addResourceBtn = content.queryByTestId('add_res_btn');
    fireEvent.click(addResourceBtn);
    expect(content.queryAllByText('Add Resources').length).toBe(2);
    expect(content.queryByPlaceholderText('Support hours')).not.toBe(null);

    expect(content.queryByPlaceholderText('CEP Processing Time')).not.toBe(null);
    expect(content.queryByTestId('CEP Processing Time-btn')).not.toBe(null);
    const removeDefResBtn = content.queryByTestId('CEP Processing Time-btn');
    await act(async () => {
        fireEvent.click(content.queryByTestId('CEP Processing Time-btn'));
    });
    expect(content.queryByPlaceholderText('CEP Processing Time')).toBe(null);
    expect(content.queryByTestId('CEP Processing Time-btn')).toBe(null);

    const removeResourceBtn = content.queryByTestId('Support hours-btn');
    fireEvent.click(removeResourceBtn);
    expect(content.queryAllByText('Add Resources').length).toBe(2);
    expect(content.queryAllByText('Support hours').length).toBe(1);
    expect(content.getAllByRole("listbox")[3].children.length).toBe(3);
    
});