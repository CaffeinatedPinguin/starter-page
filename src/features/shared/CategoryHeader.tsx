import type {CSSProperties} from 'react';
import type {StarterPageIconName} from '@/models/starter-page';
import {AppIcon} from './AppIcon';
import {CATEGORY_FALLBACK_ICON} from './iconRegistry';
import {getCategoryAccent} from './categoryVisuals';

/**
 * Category heading: accent icon + semibold title over a hairline divider.
 * The icon and accent come from config when provided; otherwise the icon is a
 * neutral marker and the accent is derived from the category name.
 */
export function CategoryHeader({
  label,
  icon,
  accent,
}: {
  label: string;
  icon?: StarterPageIconName;
  accent?: string;
}) {
  return (
    <h2 className="category__title">
      <AppIcon
        className="category__icon"
        name={icon}
        size={24}
        fallback={CATEGORY_FALLBACK_ICON}
        style={{'--accent': accent ?? getCategoryAccent(label)} as CSSProperties}
      />
      <span className="category__label">{label}</span>
    </h2>
  );
}
