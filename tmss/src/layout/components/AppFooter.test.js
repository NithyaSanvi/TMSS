import React from 'react';
import { render } from '@testing-library/react';
import AppFooter from './AppFooter';

test('renders ASTRON in footer', () => {
  const { getByText } = render(<AppFooter />);
  const linkElement = getByText("ASTRON");
  expect(linkElement).toBeInTheDocument();
});
