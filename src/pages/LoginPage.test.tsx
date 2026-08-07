import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

it('submits demo credentials and reports an invalid password', async () => {
  const login = vi.fn().mockRejectedValue(new Error('手机号或密码错误'));
  render(<LoginPage login={login} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '登录' }));
  expect(login).toHaveBeenCalledWith('13800000000', 'qiahao123');
  expect(await screen.findByText('手机号或密码错误')).toBeInTheDocument();
});
