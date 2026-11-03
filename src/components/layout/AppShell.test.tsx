import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlannerProvider } from '../../state/PlannerProvider';
import { AppShell } from './AppShell';

describe('AppShell navigation', () => {
  it('exposes the five main sections and marks the active one', () => {
    render(
      <PlannerProvider>
        <AppShell route="home" onNavigate={() => {}}>
          <p>Content</p>
        </AppShell>
      </PlannerProvider>,
    );

    const navs = screen.getAllByRole('navigation', { name: 'Main' });
    expect(navs.length).toBeGreaterThanOrEqual(2);
    const labels = within(navs[0]!).getAllByRole('button').map((button) => button.textContent);
    expect(labels.some((label) => label?.includes('Home'))).toBe(true);
    expect(labels.some((label) => label?.includes('Wish Planner'))).toBe(true);
    expect(labels.some((label) => label?.includes('Opportunities'))).toBe(true);
    expect(labels.some((label) => label?.includes('Wish Simulator'))).toBe(true);
    expect(labels.some((label) => label?.includes('Account'))).toBe(true);
    expect(within(navs[0]!).getByRole('button', { name: /Opportunities/ }).textContent).not.toContain(
      'Soon',
    );

    expect(within(navs[0]!).getByRole('button', { name: /Home/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('navigates from the sidebar', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(
      <PlannerProvider>
        <AppShell route="home" onNavigate={onNavigate}>
          <p>Content</p>
        </AppShell>
      </PlannerProvider>,
    );

    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!;
    await user.click(within(nav).getByRole('button', { name: /Wish Planner/ }));
    expect(onNavigate).toHaveBeenCalledWith('planner');
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });
});
