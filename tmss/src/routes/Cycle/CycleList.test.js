import "babel-polyfill";
import React from 'react';
import { render } from '@testing-library/react';
import CycleList from './CycleList';

jest.mock('../../services/cycle.service', () => {
    return {
        getProjects: () => Promise.resolve({ data: mockData.getProjects }),
        getCycleQuota: () => Promise.resolve({ data: mockData.getCycleQuota }),
        getAllCycle: () => Promise.resolve({ data: mockData.getAllCycle })
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
});

const mockData = {
    getProjects: {
        "results": [{
            "name": "TMSS-Commissioning",
            "cycles_ids": ["Cycle 14"],
            "private_data": true,
            "project_category": null,
            "project_category_value": null
        }]
    },
    getCycleQuota: {
        "results": [{
            "id": 1,
            "url": "http://localhost:3000/api/cycle_quota/1/",
            "cycle": "http://localhost:3000/api/cycle/Cycle%2000/",
            "cycle_id": "Cycle 00",
            "resource_type": "http://localhost:3000/api/resource_type/observing_time/",
            "resource_type_id": "observing_time",
            "value": 10575360.0
        },{
            "cycle": "http://localhost:3000/api/cycle/Cycle%2000/",
            "cycle_id": "Cycle 00",
            "id": 5,
            "resource_type": "http://localhost:3000/api/resource_type/observing_time_commissioning/",
            "resource_type_id": "observing_time_commissioning",
            "url": "http://localhost:3000/api/cycle_quota/5/",
            "value": 660960
        }]
    },
    getAllCycle: {
        "results": [{
            "name": "Cycle 00",
            "url": "http://localhost:3000/api/cycle/Cycle%2000/",
            "created_at": "2020-08-06T12:06:09.074400",
            "description": "Lofar Cycle 0",
            "duration": 13219200.0,
            "projects": [],
            "projects_ids": [],
            "quota": ["http://localhost:3000/api/cycle_quota/1/", "http://localhost:3000/api/cycle_quota/2/", "http://localhost:3000/api/cycle_quota/3/", "http://localhost:3000/api/cycle_quota/4/", "http://localhost:3000/api/cycle_quota/5/", "http://localhost:3000/api/cycle_quota/6/", "http://localhost:3000/api/cycle_quota/7/"],
            "quota_ids": [1, 2, 3, 4, 5, 6, 7],
            "start": "2013-06-01T00:00:00",
            "stop": "2013-11-01T00:00:00",
            "tags": [],
            "updated_at": "2020-08-06T12:06:09.074437"
        }, {
            "name": "Cycle 01",
            "url": "http://localhost:3000/api/cycle/Cycle%2001/",
            "created_at": "2020-08-06T12:06:09.093253",
            "description": "Lofar Cycle 1",
            "duration": 18316800.0,
            "projects": [],
            "projects_ids": [],
            "quota": ["http://localhost:3000/api/cycle_quota/8/", "http://localhost:3000/api/cycle_quota/9/", "http://localhost:3000/api/cycle_quota/10/", "http://localhost:3000/api/cycle_quota/11/", "http://localhost:3000/api/cycle_quota/12/", "http://localhost:3000/api/cycle_quota/13/", "http://localhost:3000/api/cycle_quota/14/"],
            "quota_ids": [8, 9, 10, 11, 12, 13, 14],
            "start": "2013-11-01T00:00:00",
            "stop": "2014-06-01T00:00:00",
            "tags": [],
            "updated_at": "2020-08-06T12:06:09.093283"
        }, {
            "name": "Cycle 02",
            "url": "http://localhost:3000/api/cycle/Cycle%2002/",
            "created_at": "2020-08-06T12:06:09.107204",
            "description": "Lofar Cycle 2",
            "duration": 13219200.0,
            "projects": [],
            "projects_ids": [],
            "quota": ["http://localhost:3000/api/cycle_quota/15/", "http://localhost:3000/api/cycle_quota/16/", "http://localhost:3000/api/cycle_quota/17/", "http://localhost:3000/api/cycle_quota/18/", "http://localhost:3000/api/cycle_quota/19/", "http://localhost:3000/api/cycle_quota/20/", "http://localhost:3000/api/cycle_quota/21/"],
            "quota_ids": [15, 16, 17, 18, 19, 20, 21],
            "start": "2014-06-01T00:00:00",
            "stop": "2014-11-01T00:00:00",
            "tags": [],
            "updated_at": "2020-08-06T12:06:09.107234"
        }]
    }

}