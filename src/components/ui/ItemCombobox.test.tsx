import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHARACTERS, WEAPONS, findItemByName } from '../../domain/items';
import type { TargetItem } from '../../domain/items';
import { ItemCombobox } from './ItemCombobox';

const furina = findItemByName('Furina') as TargetItem;
const huTao = findItemByName('Hu Tao') as TargetItem;
const homa = findItemByName('Staff of Homa') as TargetItem;
const xiphos = findItemByName("Xiphos' Moonlight") as TargetItem;

function Harness({
  initial = '',
  kind = 'character' as const,
  items,
}: {
  initial?: string;
  kind?: 'character' | 'weapon';
  items?: readonly TargetItem[];
}) {
  const [value, setValue] = useState(initial);
  return (
    <div>
      <ItemCombobox
        id="target-name"
        label={kind === 'character' ? 'Character target' : 'Weapon target'}
        kind={kind}
        value={value}
        onChange={setValue}
        {...(items ? { items } : {})}
      />
      <output data-testid="committed">{value}</output>
    </div>
  );
}

const committed = () => screen.getByTestId('committed').textContent;
const searchBox = () => screen.getByRole('combobox', { name: /target/i });

describe('ItemCombobox search', () => {
  it('suggests after a couple of characters, case-insensitively', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(searchBox(), 'FU');
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Furina')).toBeInTheDocument();
    expect(committed()).toBe('');
  });

  it('matches partial names and accepts a suggestion', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(searchBox(), 'rina');
    await user.click(screen.getByRole('option', { name: /Furina/ }));
    expect(committed()).toBe('Furina');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('Hydro · Sword')).toBeInTheDocument();
  });

  it('fuzzy-matches a minor typo', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(searchBox(), 'furinna');
    expect(
      within(screen.getByRole('listbox')).getByRole('option', { name: /Furina/ }),
    ).toBeInTheDocument();
  });

  it('explains when nothing matches and can keep the typed name', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(searchBox(), 'Navia Deluxe');
    expect(screen.getByText(/No characters match/)).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /custom target/ }));
    expect(committed()).toBe('Navia Deluxe');
    expect(screen.getByText(/Custom target/)).toBeInTheDocument();
  });

  it('supports keyboard navigation and selection', async () => {
    const user = userEvent.setup();
    render(<Harness items={[furina, huTao]} />);

    await user.type(searchBox(), 'a');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(committed()).not.toBe('');

    await user.clear(searchBox());
    await user.type(searchBox(), 'hu');
    await user.keyboard('{Enter}');
    expect(committed()).toBe('Hu Tao');
  });

  it('closes with Escape and reverts the query', async () => {
    const user = userEvent.setup();
    render(<Harness initial="Furina" />);

    await user.click(searchBox());
    await user.type(searchBox(), 'zzz');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect((searchBox() as HTMLInputElement).value).toBe('Furina');
    expect(committed()).toBe('Furina');
  });

  it('clears the selected target', async () => {
    const user = userEvent.setup();
    render(<Harness initial="Furina" />);

    await user.click(screen.getByRole('button', { name: /Clear character target/i }));
    expect(committed()).toBe('');
    expect((searchBox() as HTMLInputElement).value).toBe('');
  });
});

describe('ItemCombobox kinds', () => {
  it('only suggests weapons in weapon mode and labels the kind', async () => {
    const user = userEvent.setup();
    render(<Harness kind="weapon" />);

    await user.click(searchBox());
    await user.type(searchBox(), 'homa');
    const options = screen.getAllByRole('option');
    expect(options.some((option) => option.textContent?.includes('Staff of Homa'))).toBe(true);

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).queryByText('Furina')).not.toBeInTheDocument();
    expect(within(screen.getByRole('option', { name: /Staff of Homa/ })).getByText('Weapon')).toBeInTheDocument();
  });

  it('offers the complete weapon catalogue, not a sample', async () => {
    const user = userEvent.setup();
    render(<Harness kind="weapon" items={WEAPONS} />);

    await user.type(searchBox(), 'xip');
    await user.click(screen.getByRole('option', { name: /Xiphos/ }));
    expect(committed()).toBe(xiphos.name);
    expect(WEAPONS.length).toBeGreaterThan(200);
    expect(CHARACTERS.length).toBeGreaterThan(100);
    expect(homa.name).toBe('Staff of Homa');
  });
});
