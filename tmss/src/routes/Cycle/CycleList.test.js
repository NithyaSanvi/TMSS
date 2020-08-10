import "babel-polyfill";
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CycleList from './CycleList';
import mockData from '../../__mocks__/cycle.service.data';

jest.mock('../../services/cycle.service', () => {
    return {
        getProjects: () => Promise.resolve({ data: mockData.getProjects }),
        getCycleQuota: () => Promise.resolve({ data: mockData.getCycleQuota }),
        getAllCycle: () => Promise.resolve({ data: mockData.getAllCycle }),
        getResources: () => Promise.resolve({ data: mockData.getresources })
    }
});

const flushPromises = () => new Promise(setImmediate);

describe('<CycleList />', () => {
    test('render table in the cycle list', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        expect(container.querySelector('table')).toBeInTheDocument();
    });

    test('render cycle list in row', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        expect(container.querySelectorAll('tr').length).toBe(4);
    });

    test('render columns in the cycle list', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        expect(container.querySelectorAll('th').length).toBe(13);
    });

    test('render cycleId - cycle name conversion', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        console.log(container.querySelector('td').innerHTML);
        expect(container.querySelector('td').innerHTML.includes('Cycle00')).toBeTruthy();
    });

    test('render observing time in hours', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        const observing_time = Math.floor(Number(mockData.getCycleQuota.results[0].value) / 3600);
        expect(container.querySelectorAll('tr')[1].innerHTML.includes(observing_time)).toBeTruthy();
    });

    test('render commissioning time in hours', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        const commissioning_time = Math.floor(Number(mockData.getCycleQuota.results[1].value) / 3600);
        expect(container.querySelectorAll('tr')[1].innerHTML.includes(commissioning_time)).toBeTruthy();
    });

    test('toggle columns in table', async () => {
        const { container } = render(<CycleList />);
        await flushPromises();
        const panel = container.querySelector('#overlay_panel');
        expect(panel).toHaveStyle('display: block');
        fireEvent.click(container.querySelector('.col-filter-btn'));
        await flushPromises();
        expect(panel).toHaveStyle('display: none');
        expect(container.querySelectorAll("input[type=checkbox]:checked").length).toBe(container.querySelectorAll('th').length)
    });
});
