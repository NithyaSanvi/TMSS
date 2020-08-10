import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders ASTRON in footer', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText("ASTRON");
  expect(linkElement).toBeInTheDocument();
});
