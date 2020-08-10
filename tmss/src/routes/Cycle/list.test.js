import "babel-polyfill";
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, fireEvent } from '@testing-library/react';
import CycleList from './list';
import UnitConversion from '../../utils/unit.converter';
import mockData from '../../__mocks__/cycle.service.data';

jest.mock('../../services/cycle.service', () => {
    return {
        getProjects: () => Promise.resolve({ data: mockData.getProjects }),
        getCycleQuota: () => Promise.resolve({ data: mockData.getCycleQuota }),
        getAllCycles: () => Promise.resolve(mockData.getAllCycle.results ),
        getResources: () => Promise.resolve({ data: mockData.getresources })
    }
});

const flushPromises = () => new Promise(setImmediate);

describe('<CycleList />', () => {
    test('render table in the cycle list', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        expect(container.querySelector('table')).toBeInTheDocument();
    });

    test('render cycle list in row', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        expect(container.querySelectorAll('tr').length).toBe(4);
    });

    test('render columns in the cycle list', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        expect(container.querySelectorAll('th').length).toBe(11);
    });

    test('render cycleId - cycle name conversion', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        expect(container.querySelectorAll('tr')[1].innerHTML.includes('Cycle00')).toBeTruthy();
    });

    test('render observing time in hours', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        const observing_time = Math.floor(Number(mockData.getCycleQuota.results[0].value) / 3600);
        expect(container.querySelectorAll('tr')[1].innerHTML.includes(observing_time)).toBeTruthy();
    });

    test('render commissioning time in hours', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        const commissioning_time = UnitConversion.getUIResourceUnit('bytes',Number(mockData.getCycleQuota.results[1].value));
        expect(container.querySelectorAll('tr')[1].innerHTML.includes(commissioning_time)).toBeTruthy();
    });

    test('toggle columns in table', async () => {
        const { container } = render(<MemoryRouter><CycleList /></MemoryRouter>);
        await flushPromises();
        const panel = container.querySelector('#overlay_panel');
        expect(panel).toHaveStyle('display: block');
        fireEvent.click(container.querySelector('.col-filter-btn'));
        await flushPromises();
        expect(panel).toHaveStyle('display: none');
        expect(container.querySelectorAll("input[type=checkbox]:checked").length).toBe(container.querySelectorAll('th').length)
    });
});