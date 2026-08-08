import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { PublishTypeSheet } from './PublishTypeSheet';

it('shows all publish types to admins and hides activities from users', async () => {
  const onSelect = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(<PublishTypeSheet canPublishActivity onSelect={onSelect} onClose={vi.fn()} />);
  expect(screen.getByRole('button', { name: /活动/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /需求/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /生活/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /活动/ }));
  expect(onSelect).toHaveBeenCalledWith('activity');

  rerender(<PublishTypeSheet canPublishActivity={false} onSelect={onSelect} onClose={vi.fn()} />);
  expect(screen.queryByRole('button', { name: /活动/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /需求/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /生活/ })).toBeInTheDocument();
});
