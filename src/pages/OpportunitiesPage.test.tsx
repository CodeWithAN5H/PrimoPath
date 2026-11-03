import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpportunitiesPage } from './OpportunitiesPage';
import { OpportunityProvider } from '../state/OpportunityProvider';
import { PlannerProvider } from '../state/PlannerProvider';
import { clearOpportunityState } from '../lib/opportunityStorage';
import { clearState } from '../lib/storage';

function renderPage() {
  const onNavigate = vi.fn();
  const result = render(
    <PlannerProvider>
      <OpportunityProvider>
        <OpportunitiesPage onNavigate={onNavigate} />
      </OpportunityProvider>
    </PlannerProvider>,
  );
  return { ...result, onNavigate };
}

const allSection = () => screen.getByRole('region', { name: 'All opportunities' });
const recommendedSection = () => screen.getByRole('region', { name: 'Recommended next' });

beforeEach(async () => {
  localStorage.clear();
  await clearState();
  await clearOpportunityState();
});

describe('Opportunities page', () => {
  it('shows the overview, a ranked list and the sourced catalogue', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Remaining opportunities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Impact on your target' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recommended next' })).toBeInTheDocument();

    const rows = within(recommendedSection()).getAllByRole('article');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.textContent).toContain('Spiral Abyss');
    expect(rows[0]?.textContent).toContain('Verified');
    expect(within(recommendedSection()).getAllByText(/Mark this reset done/).length).toBeGreaterThan(0);

    // Daily commissions are already covered by the planner's default 60/day.
    expect(within(allSection()).getByText('Already counted')).toBeInTheDocument();
  });

  it('filters by category and status', async () => {
    const user = userEvent.setup();
    renderPage();

    const all = allSection();
    await user.selectOptions(within(all).getByLabelText('Category'), 'spiral-abyss');

    expect(within(all).getByText('Spiral Abyss — Floors 9–12')).toBeInTheDocument();
    expect(
      within(all).queryByText('Imaginarium Theater — Performance Tour'),
    ).not.toBeInTheDocument();

    await user.selectOptions(within(all).getByLabelText('Status'), 'completed');
    expect(within(all).getByText('No opportunities match these filters.')).toBeInTheDocument();
  });

  it('marks a repeatable reset done and undoes it', async () => {
    const user = userEvent.setup();
    renderPage();

    const all = allSection();
    const markButtons = within(all).getAllByRole('button', { name: 'Mark this reset done' });
    expect(markButtons.length).toBeGreaterThan(0);

    await user.click(markButtons[0]!);
    expect(within(all).getAllByRole('button', { name: 'Undo this reset' }).length).toBeGreaterThan(0);

    await user.click(within(all).getAllByRole('button', { name: 'Undo this reset' })[0]!);
    expect(within(all).getAllByRole('button', { name: 'Mark this reset done' }).length).toBeGreaterThan(0);
  });

  it('creates a custom opportunity and shows it in the list', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add opportunity' }));
    const form = screen.getByRole('region', { name: 'Add a custom opportunity' });

    await user.type(within(form).getByLabelText('Name'), 'Test web event');
    await user.clear(within(form).getByLabelText('Primogems'));
    await user.type(within(form).getByLabelText('Primogems'), '320');
    await user.click(within(form).getByRole('button', { name: 'Add opportunity' }));

    await waitFor(() => {
      expect(within(allSection()).getByText('Test web event')).toBeInTheDocument();
    });
    expect(within(allSection()).getByText('Your entry')).toBeInTheDocument();
  });

  it('rejects a custom opportunity whose name duplicates a catalogue reward', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add opportunity' }));
    const form = screen.getByRole('region', { name: 'Add a custom opportunity' });

    await user.type(within(form).getByLabelText('Name'), 'Daily Commissions');
    await user.clear(within(form).getByLabelText('Primogems'));
    await user.type(within(form).getByLabelText('Primogems'), '60');
    await user.click(within(form).getByRole('button', { name: 'Add opportunity' }));

    expect(
      within(form).getByText(/An opportunity with this name already exists/),
    ).toBeInTheDocument();
    expect(within(allSection()).queryByText('Your entry')).not.toBeInTheDocument();
  });

  it('restores completion progress after a remount', async () => {
    const user = userEvent.setup();
    const first = renderPage();

    await user.click(
      within(allSection()).getAllByRole('button', { name: 'Mark this reset done' })[0]!,
    );
    // Let the debounced save reach IndexedDB before remounting.
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    first.unmount();

    renderPage();
    await waitFor(() => {
      expect(
        within(allSection()).getAllByRole('button', { name: 'Undo this reset' }).length,
      ).toBeGreaterThan(0);
    });
  });

  it('navigates to the planner from the ranking explanation', async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderPage();

    await user.click(screen.getByRole('button', { name: /How ranking works/ }));
    await user.click(screen.getByRole('button', { name: /Adjust the target in the Wish Planner/ }));
    expect(onNavigate).toHaveBeenCalledWith('planner');
  });
});
