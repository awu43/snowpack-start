import * as React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';

describe('<App>', () => {
  it('renders learn react link', () => {
    const { getByText } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    const linkElement = getByText(/learn/i);
    expect(document.body.contains(linkElement));
  });
});
