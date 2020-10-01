import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from "react-dom/test-utils";
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import {SchedulingUnitCreate} from './create';

import ScheduleService from '../../services/schedule.service';
import ProjectService from '../../services/project.service';
import TaskService from '../../services/task.service';

import SUServiceMock from '../../__mocks__/scheduleunit.service.data';
import ProjectServiceMock from '../../__mocks__/project.service.data';
import TaskServiceMock from '../../__mocks__/task.service.data';



let projectListSpy, scheduleSetListSpy, observStrategiesSpy, taskTemplatesSpy, saveSUFromStrategySpy, updateSUSpy, createSUTasksSpy;

beforeEach(() => {
    setMockSpy();
});

afterEach(() => {
    // cleanup on exiting
    clearMockSpy();
    cleanup();
});

const setMockSpy = () => {
    projectListSpy = jest.spyOn(ProjectService, 'getProjectList');
    projectListSpy.mockImplementation(() => { return Promise.resolve(ProjectServiceMock.projectList)});
    scheduleSetListSpy = jest.spyOn(ScheduleService, 'getSchedulingSets');
    scheduleSetListSpy.mockImplementation(() => { return Promise.resolve(SUServiceMock.scheduleSetList)});
    observStrategiesSpy = jest.spyOn(ScheduleService, 'getObservationStrategies');
    observStrategiesSpy.mockImplementation(() => { return Promise.resolve(SUServiceMock.observStrategies)});
    taskTemplatesSpy = jest.spyOn(TaskService, 'getTaskTemplates');
    taskTemplatesSpy.mockImplementation(() => { return Promise.resolve(TaskServiceMock.taskTemplates)});
    saveSUFromStrategySpy = jest.spyOn(ScheduleService, 'saveSUDraftFromObservStrategy');
    saveSUFromStrategySpy.mockImplementation((observStrategy, schedulingUnit) => { 
        return Promise.resolve(SUServiceMock.schedulingUnitFromObservStrategy);
    });
    updateSUSpy = jest.spyOn(ScheduleService, 'updateSchedulingUnitDraft');
    updateSUSpy.mockImplementation((schedulingUnit) => { 
        return Promise.resolve(SUServiceMock.schedulingUnitFromObservStrategy);
    });
    createSUTasksSpy = jest.spyOn(ScheduleService, 'createSUTaskDrafts');
    createSUTasksSpy.mockImplementation((schedulingUnit) => { 
        return Promise.resolve(SUServiceMock.schedulingUnitFromObservStrategy);
    });
    
}

const clearMockSpy = () => {
    projectListSpy.mockRestore();
    scheduleSetListSpy.mockRestore();
    observStrategiesSpy.mockRestore();
    taskTemplatesSpy.mockRestore();
    saveSUFromStrategySpy.mockRestore();
    updateSUSpy.mockRestore();
    createSUTasksSpy.mockRestore();
}

it("renders create page with all fields and default values", async() => {
    console.log("renders create page with all fields and default values ------------------------");
    
    let content;
    await act(async () => {
        content = render(<Router><SchedulingUnitCreate /></Router>);
    });

    expect(content.queryByText('Scheduling Unit - Add')).not.toBe(null);        // Page loaded successfully
    expect(projectListSpy).toHaveBeenCalled();                                  // Mock Spy called successfully
    expect(observStrategiesSpy).toHaveBeenCalled();                             // Mock Spy called successfully
    expect(scheduleSetListSpy).toHaveBeenCalled();                              // Mock Spy called successfully
    expect(taskTemplatesSpy).toHaveBeenCalled();                                // Mock Spy called successfully
    expect(content.queryByText('TMSS-Commissioning')).toBeInTheDocument();      // Project Dropdown  loaded successfully
    expect(content.queryByText('UC1 observation strategy template')).toBeInTheDocument();      // Observation Strategy Dropdown  loaded successfully
    expect(content.queryByText('Task Parameters')).not.toBeInTheDocument();      // JSON Editor not rendered
    expect(content.queryByTestId('save-btn')).toHaveAttribute("disabled");
});

it("creates new Scheduling Unit with default values", async() => {
    console.log("creates new Scheduling Unit with default values ------------------------");
    
    let content;
    await act(async () => {
        content = render(<Router><SchedulingUnitCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const projInput = content.getAllByRole("listbox")[0].children[2] ;
    const observStrategyInput = content.getAllByRole("listbox")[2].children[0] ;
    
    // Set values for all mandatory input and test if save button is enabled
    fireEvent.change(nameInput, { target: { value: 'UC1 test scheduling unit 1.1' } });
    expect(nameInput.value).toBe("UC1 test scheduling unit 1.1");
    fireEvent.change(descInput, { target: { value: 'UC1 test scheduling unit 1.1' } });
    expect(descInput.value).toBe("UC1 test scheduling unit 1.1");
    
    // After selecting values for all dropdowns
    await act(async () => {
        fireEvent.click(projInput);
    });
    const schedulingSetInput = content.getAllByRole("listbox")[1].children[0] ;
    expect(content.queryAllByText('Select Project').length).toBe(1);
    expect(content.queryAllByText('TMSS-Commissioning').length).toBe(3);
    
    await act(async () => {
        fireEvent.click(schedulingSetInput);
    });
    expect(content.queryAllByText('Select Scheduling Set').length).toBe(1);
    expect(content.queryAllByText('Test Scheduling Set UC1 example 0').length).toBe(3);
    
    await act( async() => {
        fireEvent.click(observStrategyInput);
    });
    expect(content.queryAllByText('Select Strategy').length).toBe(1);
    expect(content.queryAllByText('UC1 observation strategy template').length).toBe(3);
    expect(content.queryByText('Task Parameters')).toBeInTheDocument();
    expect(content.queryByText('Target Pointing 0')).toBeInTheDocument();
    expect(content.queryByText('Not a valid input. Mimimum: 00:00:00, Maximum:23:59:59.')).not.toBeInTheDocument();
    expect(content.queryByText('Not a valid input. Mimimum: 00:00:00, Maximum:90:00:00.')).not.toBeInTheDocument();
    
    /* This is set again to call the validateEditor function in the component. 
        If this is removed, the editor validation will not occur in the test but works in browser.*/
    await act( async() => {
        fireEvent.change(nameInput, { target: { value: 'UC1 test scheduling unit 1.1' } });
    });

    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();

    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    expect(saveSUFromStrategySpy).toHaveBeenCalled();
    
});