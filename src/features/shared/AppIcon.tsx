import type {CSSProperties} from 'react';
import type {StarterPageIconName} from '@/models/starter-page';
import {FALLBACK_ICON, ICON_REGISTRY, type IconComponent} from './iconRegistry';

const DEFAULT_SIZE = 20;

/**
 * Single resolver for every icon slot in the app. It owns the normalized slot
 * size, the brand/generic distinction (including the optional brand tint) and
 * the neutral fallback, so callers only pass a semantic id.
 *
 * Link icons are decorative: the adjacent link name already labels the
 * destination, so nothing here is announced to screen readers.
 */
export function AppIcon({
  name,
  size = DEFAULT_SIZE,
  fallback = FALLBACK_ICON,
  className,
  style,
}: {
  name?: StarterPageIconName;
  size?: number;
  fallback?: IconComponent;
  className?: string;
  style?: CSSProperties;
}) {
  const definition = name ? ICON_REGISTRY[name] : undefined;
  const brand = definition?.kind === 'brand' ? definition : undefined;
  const Icon = definition?.component ?? fallback;
  const classes = ['app-icon', brand ? 'app-icon--brand' : 'app-icon--generic', className]
    .filter(Boolean)
    .join(' ');
  const brandColor = brand?.color ? ({color: brand.color} as CSSProperties) : undefined;

  return (
    <span
      className={classes}
      style={{...brandColor, ...style, '--app-icon-size': `${size}px`} as CSSProperties}
      aria-hidden="true"
    >
      <Icon className="app-icon__svg"/>
    </span>
  );
}
