import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from "react-dom/test-utils";
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import {CycleCreate} from './create';
import CycleService from '../../services/cycle.service';

import CycleServiceMock from '../../__mocks__/cycle.service.data';

let saveCycleSpy, resourcesSpy, cycleResourceDefaultsSpy;

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
    
    resourcesSpy = jest.spyOn(CycleService, 'getResources');
    resourcesSpy.mockImplementation(() => {
        return Promise.resolve(CycleServiceMock.resources);
    });
    
    
    saveCycleSpy = jest.spyOn(CycleService, 'saveCycle');
    saveCycleSpy.mockImplementation((cycle, cycleQuota) => { 
       cycle.url = `http://localhost:3000/api/cycle/${cycle.name}`;
        return Promise.resolve(cycle)
    });
});

const clearMockSpy = (() => {
    saveCycleSpy.mockRestore();
});

it("renders without crashing with all back-end data loaded", async () => {
    console.log("renders without crashing with all back-end data loaded ------------------------");
    
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });
    
    expect(content.queryByText('Cycle - Add')).not.toBe(null);        // Page loaded successfully
    expect(content.queryAllByText('Add Resources').length).toBe(2);     // Resource Dropdown loaded successfully
    expect(content.queryByText('Support hours')).toBeInTheDocument();         // Resources other than Default Resources listed in dropdown
    expect(content.queryByPlaceholderText('Support Hours')).toBe(null);       // No resources other than Default Resources listed to get input
    expect(content.queryByPlaceholderText('LOFAR Observing Time').value).toBe('1 Hours');         // Default Resource Listed with default value
});

it("Save button disabled initially when no data entered", async () => {
    console.log("Save button disabled initially when no data entered -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });
    expect(content.queryByTestId('save-btn')).toHaveAttribute("disabled");
});

it("Save button enabled when mandatory data entered", async () => {
    console.log("Save button enabled when mandatory data entered -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });
    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const startInput = content.queryByTestId('start');
    const stopInput = content.queryByTestId('stop');
     
    fireEvent.change(nameInput, { target: { value: 'Cycle-12' } });
    expect(nameInput.value).toBe("Cycle-12");
    
    fireEvent.change(descInput, { target: { value: 'Cycle-12' } });
    expect(descInput.value).toBe("Cycle-12");
    
    fireEvent.change(startInput, { target: { value: '2020-07-29 11:12:15' } });
    expect(startInput.value).toBe("2020-07-29 11:12:15");
    
    fireEvent.change(stopInput, { target: { value: '2020-07-30 11:12:15' } });
    expect(stopInput.value).toBe("2020-07-30 11:12:15");
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
});

it("renders Save button enabled when all data entered", async () => {
    console.log("renders Save button enabled when all data entered -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const startInput = content.queryByTestId('start');
    const stopInput = content.queryByTestId('stop');
     
    fireEvent.change(nameInput, { target: { value: 'Cycle-12' } });
    expect(nameInput.value).toBe("Cycle-12");
    
    fireEvent.change(descInput, { target: { value: 'Cycle-12' } });
    expect(descInput.value).toBe("Cycle-12");
    
    fireEvent.change(startInput, { target: { value: '2020-07-29 11:12:15' } });
    expect(startInput.value).toBe("2020-07-29 11:12:15");
    
    fireEvent.change(stopInput, { target: { value: '2020-07-30 11:12:15' } });
    expect(stopInput.value).toBe("2020-07-30 11:12:15");
    
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();    
    
});

it("save cycle with mandatory fields", async () => {
    console.log("save cycle -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const startInput = content.queryByTestId('start');
    const stopInput = content.queryByTestId('stop');
    
    fireEvent.change(nameInput, { target: { value: 'Cycle-12' } });
    expect(nameInput.value).toBe("Cycle-12");
    fireEvent.change(descInput, { target: { value: 'Cycle-12' } });
    expect(descInput.value).toBe("Cycle-12");

    fireEvent.change(startInput, { target: { value: '2020-07-29 11:12:15' } });
    expect(startInput.value).toBe("2020-07-29 11:12:15");
    
    fireEvent.change(stopInput, { target: { value: '2020-07-30 11:12:15' } });
    expect(stopInput.value).toBe("2020-07-30 11:12:15");
     
    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    expect(content.queryByTestId('cycleId').value).toBe("");
    expect(content.queryByText("Success")).toBe(null);
    
    await act(async () => {
        fireEvent.click(content.queryByTestId('save-btn'));
    });
    
    // After saving cycle, URL should be available and Success dialog should be displayed
    expect(content.queryByTestId('cycleId').value).toBe("http://localhost:3000/api/cycle/Cycle-12");
    expect(content.queryByText("Success")).not.toBe(null);
});

it("save cycle with default resources", async () => {
    console.log("save cycle with default resources -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const startInput = content.queryByTestId('start');
    const stopInput = content.queryByTestId('stop');
    
    fireEvent.change(nameInput, { target: { value: 'Cycle-12' } });
    expect(nameInput.value).toBe("Cycle-12");
    fireEvent.change(descInput, { target: { value: 'Cycle-12' } });
    expect(descInput.value).toBe("Cycle-12");

    fireEvent.change(startInput, { target: { value: '2020-07-29 11:12:15' } });
    expect(startInput.value).toBe("2020-07-29 11:12:15");
    
    fireEvent.change(stopInput, { target: { value: '2020-07-30 11:12:15' } });
    expect(stopInput.value).toBe("2020-07-30 11:12:15");

    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    expect(content.queryByTestId('cycleId').value).toBe("");
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
    
    // After saving cycle, URL should be available and Success dialog should be displayed
    expect(content.queryByTestId('cycleId').value).toBe("http://localhost:3000/api/cycle/Cycle-12");
    expect(content.queryByText("Success")).not.toBe(null);
});

it("save cycle with added resources", async () => {
    console.log("save cycle with added resources -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
    });

    const nameInput = content.queryByTestId('name');
    const descInput = content.queryByTestId('description');
    const startInput = content.queryByTestId('start');
    const stopInput = content.queryByTestId('stop');
    
    fireEvent.change(nameInput, { target: { value: 'Cycle-12' } });
    expect(nameInput.value).toBe("Cycle-12");
    fireEvent.change(descInput, { target: { value: 'Cycle-12' } });
    expect(descInput.value).toBe("Cycle-12");

    fireEvent.change(startInput, { target: { value: '2020-07-29 11:12:15' } });
    expect(startInput.value).toBe("2020-07-29 11:12:15");
    
    fireEvent.change(stopInput, { target: { value: '2020-07-30 11:12:15' } });
    expect(stopInput.value).toBe("2020-07-30 11:12:15");

    expect(content.queryByTestId('save-btn').hasAttribute("disabled")).toBeFalsy();
    expect(content.queryByTestId('cycleId').value).toBe("");
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
    
    // After saving cycle, URL should be available and Success dialog should be displayed
    expect(content.queryByTestId('cycleId').value).toBe("http://localhost:3000/api/cycle/Cycle-12");
    expect(content.queryByText("Success")).not.toBe(null);
});

it("remove default resource and added resource", async () => {
    console.log("remove default resource and added resource -----------------------");
    let content;
    await act(async () => {
        content = render(<Router><CycleCreate /></Router>);
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