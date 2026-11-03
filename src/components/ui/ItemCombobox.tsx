import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import {
  describeItem,
  findItemByName,
  itemsForKind,
  type ItemKind,
  type TargetItem,
} from '../../domain/items';
import { searchItems } from '../../domain/itemSearch';
import { ItemArt, RarityStars } from './ItemArt';

const MAX_RESULTS = 8;

function defaultSuggestions(items: readonly TargetItem[]): TargetItem[] {
  return [...items]
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name, 'en'))
    .slice(0, MAX_RESULTS);
}

type Option<T> = { type: 'item'; item: T } | { type: 'custom'; name: string };

export interface ItemComboboxProps {
  id: string;
  label: string;
  kind: ItemKind;
  /** Name stored in the planner state. May be free text or an unknown item. */
  value: string;
  onChange: (name: string) => void;
  hint?: string;
  placeholder?: string;
  /** Overrides the catalogue, e.g. for tests or a future custom item set. */
  items?: readonly TargetItem[];
}

/**
 * Searchable character/weapon selector (ARIA combobox pattern).
 *
 * The planner still stores the target as a plain string, so saved plans keep
 * working. Selecting a catalogue entry also gives the dashboard artwork and a
 * verified spelling; anything else stays available as a custom target so an
 * unreleased character never blocks planning.
 */
export function ItemCombobox({
  id,
  label,
  kind,
  value,
  onChange,
  hint,
  placeholder,
  items,
}: ItemComboboxProps) {
  const catalogue = items ?? itemsForKind(kind);
  const listboxId = `${id}-listbox`;
  const helpId = `${id}-help`;
  const generatedId = useId();
  const optionIdPrefix = `item-option-${generatedId.replace(/[^a-zA-Z0-9-]/g, '')}`;

  const selected = useMemo(() => {
    const match = findItemByName(value);
    return match && match.kind === kind ? match : null;
  }, [value, kind]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Adopt external changes (banner switch, hydration, clear) without an effect.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value);
  }

  const matches = useMemo(() => {
    const trimmed = query.trim();
    return trimmed === '' ? defaultSuggestions(catalogue) : searchItems(catalogue, trimmed, { limit: MAX_RESULTS });
  }, [catalogue, query]);

  const options = useMemo<Option<TargetItem>[]>(() => {
    const trimmed = query.trim();
    if (trimmed === '') return matches.map((item) => ({ type: 'item', item }));
    const exact = matches.some((item) => item.name.toLowerCase() === trimmed.toLowerCase());
    const list: Option<TargetItem>[] = matches.map((item) => ({ type: 'item', item }));
    if (!exact) list.push({ type: 'custom', name: trimmed });
    return list;
  }, [matches, query]);

  const clampedActive = Math.min(activeIndex, Math.max(0, options.length - 1));

  const choose = useCallback(
    (option: Option<TargetItem> | undefined) => {
      if (!option) return;
      const name = option.type === 'custom' ? option.name : option.item.name;
      onChange(name);
      setQuery(name);
      setLastValue(name);
      setOpen(false);
      setActiveIndex(0);
    },
    [onChange],
  );

  const clear = useCallback(() => {
    onChange('');
    setQuery('');
    setLastValue('');
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [onChange]);

  const openList = useCallback(() => {
    setOpen(true);
    setActiveIndex(0);
  }, []);

  const move = (delta: number) => {
    if (!open) {
      openList();
      return;
    }
    if (options.length === 0) return;
    setActiveIndex((current) => (current + delta + options.length) % options.length);
  };

  const showNoResults = query.trim() !== '' && matches.length === 0;
  const describedBy = hint ? helpId : undefined;
  const activeOption = open ? options[clampedActive] : undefined;
  const activeOptionId = activeOption ? `${optionIdPrefix}-${clampedActive}` : undefined;

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col gap-1.5"
      onBlurCapture={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <label htmlFor={id} className="label">
        {label}
      </label>

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint"
        >
          <Search size={15} />
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-describedby={describedBy}
          className="field pl-9 pr-10"
          placeholder={placeholder ?? (kind === 'character' ? 'Search characters…' : 'Search weapons…')}
          value={query}
          onFocus={openList}
          onClick={() => {
            if (!open) openList();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                move(1);
                break;
              case 'ArrowUp':
                event.preventDefault();
                move(-1);
                break;
              case 'Home':
                if (open) {
                  event.preventDefault();
                  setActiveIndex(0);
                }
                break;
              case 'End':
                if (open) {
                  event.preventDefault();
                  setActiveIndex(Math.max(0, options.length - 1));
                }
                break;
              case 'Enter':
                event.preventDefault();
                if (!open) {
                  openList();
                  break;
                }
                choose(activeOption ?? options[0]);
                break;
              case 'Escape':
                if (open) {
                  event.preventDefault();
                  setOpen(false);
                  setQuery(value);
                }
                break;
              case 'Tab':
                setOpen(false);
                break;
              default:
                break;
            }
          }}
        />
        {value || query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-faint transition hover:bg-raised hover:text-ink"
            aria-label={`Clear ${kind} target`}
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-faint">
            <ChevronDown size={15} />
          </span>
        )}
      </div>

      {selected ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent/[0.07] px-2.5 py-2">
          <ItemArt item={selected} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{selected.name}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-faint">
              <RarityStars rarity={selected.rarity} />
              <span>{describeItem(selected)}</span>
            </p>
          </div>
        </div>
      ) : value.trim() !== '' ? (
        <p className="rounded-xl border border-line-soft bg-void/40 px-2.5 py-2 text-[11px] leading-relaxed text-faint">
          Custom target “{value.trim()}” — not in the local catalogue, so no artwork is shown.
        </p>
      ) : null}

      {open ? (
        <div className="relative">
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute inset-x-0 top-1 z-30 max-h-72 overflow-y-auto rounded-xl border border-line bg-panel p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] scrollbar-slim animate-pop"
          >
            {showNoResults ? (
              <li className="px-2.5 py-2 text-xs text-faint" role="presentation">
                No {kind === 'character' ? 'characters' : 'weapons'} match “{query.trim()}”. Keep it
                as a custom target instead?
              </li>
            ) : null}

            {options.map((option, index) => {
              const isActive = index === clampedActive;
              const optionId = `${optionIdPrefix}-${index}`;
              if (option.type === 'custom') {
                return (
                  <li
                    key="custom-option"
                    id={optionId}
                    role="option"
                    aria-selected={isActive}
                    className={`cursor-pointer rounded-lg px-2.5 py-2.5 text-sm transition-colors ${
                      isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-raised'
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    Use “{option.name}” as a custom target
                  </li>
                );
              }

              const item = option.item;
              return (
                <li
                  key={item.id}
                  id={optionId}
                  role="option"
                  aria-selected={isActive}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                    isActive ? 'bg-accent/12' : 'hover:bg-raised'
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <ItemArt item={item} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-faint">
                      <RarityStars rarity={item.rarity} />
                      <span>{describeItem(item)}</span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      item.kind === 'character'
                        ? 'border-accent/30 bg-accent/10 text-accent'
                        : 'border-azure/30 bg-azure/10 text-azure'
                    }`}
                  >
                    {item.kind === 'character' ? 'Character' : 'Weapon'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {hint ? (
        <p id={helpId} className="text-xs leading-relaxed text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
