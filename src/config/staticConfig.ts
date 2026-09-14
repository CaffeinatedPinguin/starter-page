import type {
    CategoryPresentation,
    ConfigIdentifier,
    LinkEntry,
    PageId,
    StarterPageConfig,
    StarterPageIconName,
    StarterPagePreferences,
} from '@/models/starter-page';
import {isStarterPageIcon, isPageId, PAGE_IDS} from '@/models/starter-page';

const PAGE_LIST = PAGE_IDS.join(', ');

const ICON_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class StarterPageConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StarterPageConfigError';
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new StarterPageConfigError(`Pole "${field}" musi być niepustym tekstem.`);
    }
    return value.trim();
}

function requireArray(value: unknown, field: string): unknown[] {
    if (!Array.isArray(value)) {
        throw new StarterPageConfigError(`Pole "${field}" musi być tablicą.`);
    }
    return value;
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
    if (!isRecord(value)) {
        throw new StarterPageConfigError(`Pole "${field}" musi być obiektem.`);
    }
    return value;
}

function optionalString(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null) return undefined;
    return requireString(value, field);
}

function parseUrl(value: unknown, field: string): string {
    const url = requireString(value, field);
    let parsed: URL;

    try {
        parsed = new URL(url, 'https://starter-page.invalid');
    } catch {
        throw new StarterPageConfigError(`URL w polu "${field}" jest niepoprawny.`);
    }

    if (url.startsWith('/') && parsed.origin !== 'https://starter-page.invalid') {
        throw new StarterPageConfigError(`URL w polu "${field}" jest niedozwolony.`);
    }

    if (!url.startsWith('/') && parsed.origin === 'https://starter-page.invalid') {
        throw new StarterPageConfigError(`URL w polu "${field}" jest niepoprawny.`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new StarterPageConfigError(`URL w polu "${field}" musi używać http lub https.`);
    }

    return url;
}

function parseIdentifier(value: unknown, field: string): ConfigIdentifier {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    throw new StarterPageConfigError(`Pole "${field}" musi zawierać poprawne id.`);
}

function parseIcon(value: unknown, field: string): StarterPageIconName | undefined {
    if (value === undefined || value === null) return undefined;
    const icon = requireString(value, field);
    if (!ICON_PATTERN.test(icon) || !isStarterPageIcon(icon)) {
        throw new StarterPageConfigError(
            `Ikona "${icon}" w polu "${field}" nie jest obsługiwana. Użyj ikony z dostępnego zestawu, np. "notes".`,
        );
    }
    return icon;
}

function parseLink(value: unknown, index: number): LinkEntry {
    const link = requireRecord(value, `links[${index}]`);

    const linkEntry: LinkEntry = {
        id: parseIdentifier(link.id, `links[${index}].id`),
        name: requireString(link.name, `links[${index}].name`),
        url: parseUrl(link.url, `links[${index}].url`),
    };

    const icon = parseIcon(link.icon, `links[${index}].icon`);
    if (icon !== undefined) linkEntry.icon = icon;

    const tooltip = optionalString(link.tooltip, `links[${index}].tooltip`);
    if (tooltip !== undefined) linkEntry.tooltip = tooltip;

    const category = optionalString(link.category, `links[${index}].category`);
    if (category !== undefined) linkEntry.category = category;

    if (link.order !== undefined) {
        if (typeof link.order !== 'number' || !Number.isFinite(link.order)) {
            throw new StarterPageConfigError(`Pole "links[${index}].order" musi być liczbą.`);
        }
        linkEntry.order = link.order;
    }

    return linkEntry;
}

function assertUniqueLinks(links: LinkEntry[]): void {
    const seen = new Set<string>();
    for (const link of links) {
        const key = String(link.id);
        if (seen.has(key)) {
            throw new StarterPageConfigError(
                `Wartość "${link.id}" w polu "links[].id" musi być unikalna.`,
            );
        }
        seen.add(key);
    }
}

export function parseLinks(value: unknown): LinkEntry[] {
    const links = requireArray(value, 'links').map(parseLink);
    assertUniqueLinks(links);
    return links;
}

export function parsePageId(value: unknown, field: string): PageId {
    if (!isPageId(value)) {
        throw new StarterPageConfigError(
            `Pole "${field}" musi być jedną z wartości: ${PAGE_LIST}.`,
        );
    }
    return value;
}

function parseCategories(value: unknown): Record<string, CategoryPresentation> | undefined {
    if (value === undefined || value === null) return undefined;

    const record = requireRecord(value, 'categories');
    const result: Record<string, CategoryPresentation> = {};

    for (const [name, raw] of Object.entries(record)) {
        const field = `categories["${name}"]`;
        const entry = requireRecord(raw, field);

        const presentation: CategoryPresentation = {};
        const icon = parseIcon(entry.icon, `${field}.icon`);
        if (icon !== undefined) presentation.icon = icon;
        const color = optionalString(entry.color, `${field}.color`);
        if (color !== undefined) presentation.color = color;

        if (Object.keys(presentation).length > 0) {
            result[name] = presentation;
        }
    }

    return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Validates the common configuration schema used by every Starter Page.
 */
export function parseConfig(value: unknown): StarterPageConfig {
    const config = requireRecord(value, 'config');

    const result: StarterPageConfig = {
        title: requireString(config.title, 'title'),
        heading: requireString(config.heading, 'heading'),
        subtitle: requireString(config.subtitle, 'subtitle'),
        links: parseLinks(config.links),
    };

    // Optional: absence is valid and activates the safe built-in fallback.
    if (config.defaultPage !== undefined) {
        result.defaultPage = parsePageId(config.defaultPage, 'defaultPage');
    }

    const categories = parseCategories(config.categories);
    if (categories !== undefined) {
        result.categories = categories;
    }

    return result;
}

/**
 * Validates user preferences. Unknown/extra keys are ignored; every present
 * key must match its type. An empty object is valid (no preferences set).
 *
 * Malformed preference objects (wrong top-level shape) are treated as absent
 * so that corrupt storage cannot stop the application — it falls back to the
 * config defaultPage / safe fallback instead.
 */
export function parsePreferences(value: unknown): StarterPagePreferences {
    if (value === undefined || value === null) {
        return {};
    }

    if (!isRecord(value)) {
        return {};
    }

    const result: StarterPagePreferences = {};

    // Individually guarded: one bad field drops that field, not all prefs.
    try {
        if (value['entryPage'] !== undefined) {
            result.entryPage = parsePageId(value['entryPage'], 'entryPage');
        }
    } catch {
        result.entryPage = undefined;
    }

    return result;
}