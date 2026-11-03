import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './HomePage';
import { OpportunityProvider } from '../state/OpportunityProvider';
import { PlannerProvider } from '../state/PlannerProvider';
import { clearOpportunityState } from '../lib/opportunityStorage';
import { clearState } from '../lib/storage';

beforeEach(async () => {
  localStorage.clear();
  await clearState();
  await clearOpportunityState();
});

function renderHome() {
  const onNavigate = vi.fn();
  render(
    <PlannerProvider>
      <OpportunityProvider>
        <HomePage onNavigate={onNavigate} />
      </OpportunityProvider>
    </PlannerProvider>,
  );
  return { onNavigate };
}

describe('Home opportunities summary', () => {
  it('shows the top recommendation and remaining obtainable wishes', () => {
    renderHome();

    const card = screen.getByRole('region', { name: 'Next opportunity' });
    expect(card.textContent).toContain('Spiral Abyss — Floors 9–12');
    expect(card.textContent).toContain('wishes from');
    expect(card.textContent).toContain('Primogems');
    expect(card.textContent).not.toContain('No reward data is loaded yet');
  });

  it('opens the Opportunities section from the card', async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderHome();

    const card = screen.getByRole('region', { name: 'Next opportunity' });
    await user.click(withinCard(card, 'Open'));
    expect(onNavigate).toHaveBeenCalledWith('opportunities');
  });
});

function withinCard(card: HTMLElement, name: string): HTMLElement {
  const button = Array.from(card.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(name),
  );
  if (!button) throw new Error(`Button ${name} not found`);
  return button;
}
