import type {CSSProperties} from 'react';
import type {StarterPageIconName} from '@/models/starter-page';
import {AppIcon} from './AppIcon';
import {getCategoryAccent} from './categoryVisuals';

/**
 * Category heading: a small accent marker + uppercase label over a hairline
 * divider. The default marker is a plain accent dot; a config-provided `icon`
 * is rendered in its place. The accent comes from config when provided,
 * otherwise it is derived from the category name.
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
  const style = {'--accent': accent ?? getCategoryAccent(label)} as CSSProperties;

  return (
    <h2 className="category__title">
      {icon ? (
        <AppIcon className="category__icon" name={icon} size={16} style={style}/>
      ) : (
        <span className="category__dot" style={style} aria-hidden="true"/>
      )}
      <span className="category__label">{label}</span>
    </h2>
  );
}
