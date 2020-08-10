import React from 'react';
import ReactDOM,  {unmountComponentAtNode} from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import { render} from '@testing-library/react';
import { ProjectList} from './index';

let container = null;
beforeEach(() =>{
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() =>{
    unmountComponentAtNode(container);
    container.remove();
    container = null;
})

it("renders without crashing", () =>{
    act(() =>{
        ReactDOM.render(<Router><ProjectList /> </Router>, container);
    })
})

// Do check the label appear or not
it('renders Project - List Page in View Table', () => {
    const content = render(<ProjectList />);
    const element = content.queryByText("Project - List");
    expect(element).toBeInTheDocument() ;
  });

// do check does the data loaded into DB or not
it('renders Project - List Data Load in View Table', () => {
    const content = render(<Router><ProjectList testdata= {true} /> </Router>, container);
    const element = content.queryByTestId('viewtable');
    expect(element).toBeInTheDocument();
});
 