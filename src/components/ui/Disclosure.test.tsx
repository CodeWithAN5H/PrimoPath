import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('starts collapsed and toggles from the header button', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure id="test-section" title="Section A" subtitle="Hidden details">
        <label htmlFor="inside">
          Inside
          <input id="inside" />
        </label>
      </Disclosure>,
    );

    const trigger = screen.getByRole('button', { name: /Section A/ });
    const panel = document.getElementById('test-section-panel');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel).toHaveAttribute('inert');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('aria-hidden', 'true');
    expect(panel).not.toHaveAttribute('inert');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens by default when asked', () => {
    render(
      <Disclosure id="open-section" title="Section B" defaultOpen>
        <p>Visible content</p>
      </Disclosure>,
    );
    expect(screen.getByRole('button', { name: /Section B/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
