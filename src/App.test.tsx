import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import App from './App';

it('renders the qiahao brand and discovery navigation', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '恰好' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '发现' })).toBeInTheDocument();
});
