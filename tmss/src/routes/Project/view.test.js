import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from "react-dom/test-utils";
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import _ from 'lodash';

import {ProjectView} from './view';
import ProjectService from '../../services/project.service';

import ProjectServiceMock from '../../__mocks__/project.service.data';


let projectDetailsSpy, resourcesSpy, projectQuotaSpy;

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
    projectDetailsSpy = jest.spyOn(ProjectService, 'getProjectDetails');
    projectDetailsSpy.mockImplementation((id) => { 
        return Promise.resolve(_.find(ProjectServiceMock.project, {name: id}))});
    resourcesSpy = jest.spyOn(ProjectService, 'getResources');
    resourcesSpy.mockImplementation(() => {
        return Promise.resolve(ProjectServiceMock.resources);
    });
    projectQuotaSpy = jest.spyOn(ProjectService, 'getProjectQuota');
    projectQuotaSpy.mockImplementation((id) => {
        return Promise.resolve(_.find(ProjectServiceMock.projectQuota, {id: id}));
    });
});

const clearMockSpy = (() => {
    projectDetailsSpy.mockRestore();
    resourcesSpy.mockRestore();
    projectQuotaSpy.mockRestore();
});

it("renders Project details if found", async () => {
    console.log("renders Project details if found..........");
    let content;
    await act(async () => {
        content = render(<Router><ProjectView match={{params:{id: "OSR-11"}}} location={{}} /></Router>);
    });

    expect(content.queryByText("Project - Details")).not.toBe(null);
    expect(content.queryAllByText("OSR-11").length).toBe(2);
    expect(content.queryByText("990")).not.toBe(null);
    expect(content.queryByText("Regular")).not.toBe(null);
    expect(content.queryByText("Single Cycle")).not.toBe(null);
    expect(content.queryByText("Resource Allocations")).not.toBe(null);
    expect(content.queryByText("10 Hours")).not.toBe(null);
    expect(content.queryByText("20 Hours")).not.toBe(null);
    expect(content.queryByText("30 Hours")).not.toBe(null);
    expect(content.queryByText("40 Hours")).not.toBe(null);
    expect(content.queryByText("50 Hours")).not.toBe(null);
    expect(content.queryByText("6 TB")).not.toBe(null);
    expect(content.queryByText("7 Numbers")).not.toBe(null);
    expect(content.queryByText("9 Hours")).not.toBe(null);

});

it("renders nothing if no project details found", async () => {
    console.log("renders nothing if no project details found..........");
    let content;
    await act(async () => {
        content = render(<Router><ProjectView match={{params:{id: "OSR-12"}}} location={{}} /></Router>);
    });

    expect(content.queryByText("Project - Details")).toBe(null);
});