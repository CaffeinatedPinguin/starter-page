import {describe, expect, it} from 'vitest';
import {parseConfig, parseLinks, parsePreferences} from './staticConfig';

const validConfig = {
    title: 'Example',
    heading: 'Welcome',
    subtitle: 'Pick a destination',
    defaultPage: 'categorized',
    links: [
        {id: 'home', name: 'Home', url: '/', icon: 'home', category: 'General', order: 1},
        {id: 'status', name: 'Status', url: 'https://status.example.com/', tooltip: 'Service status'},
        {id: 'dashboard', name: 'Dashboard', url: 'https://dashboard.example.com/'},
    ],
};

describe('common configuration schema', () => {
    it('parses the full config with all optional link fields', () => {
        expect(parseConfig(validConfig)).toEqual(validConfig);
    });

    it('parses links without optional fields', () => {
        expect(parseLinks([{id: 1, name: 'X', url: '/x'}])).toEqual([
            {id: 1, name: 'X', url: '/x'},
        ]);
    });

    it('rejects duplicate link ids', () => {
        expect(() =>
            parseConfig({
                ...validConfig, links: [
                    {id: 'dup', name: 'A', url: '/a'},
                    {id: 'dup', name: 'B', url: '/b'},
                ]
            }),
        ).toThrow(/unikalna/);
    });

    it('rejects unsafe URLs', () => {
        expect(() =>
            parseConfig({...validConfig, links: [{id: 1, name: 'X', url: '/\\evil.com'}]}),
        ).toThrow(/url/i);
        expect(() =>
            parseConfig({...validConfig, links: [{id: 1, name: 'X', url: 'javascript:alert(1)'}]}),
        ).toThrow(/http lub https/);
    });

    it('rejects unsupported icons', () => {
        expect(() =>
            parseConfig({...validConfig, links: [{id: 1, name: 'X', url: '/x', icon: 'nope'}]}),
        ).toThrow(/ikona/i);
    });

    it('rejects an unknown defaultPage', () => {
        expect(() => parseConfig({...validConfig, defaultPage: 'nope'})).toThrow(/defaultPage/);
    });
    it('treats defaultPage as optional', () => {
        const withoutDefault = {...validConfig, defaultPage: undefined};
        expect(parseConfig(withoutDefault)).toEqual({
            title: validConfig.title,
            heading: validConfig.heading,
            subtitle: validConfig.subtitle,
            links: validConfig.links,
        });
    });

    it('rejects non-array links and missing fields', () => {
        expect(() => parseConfig({...validConfig, links: 'x'})).toThrow(/tablicą/);
        expect(() => parseConfig({...validConfig, links: [{id: 1, name: '', url: '/x'}]})).toThrow(/name/);
        expect(() => parseConfig({...validConfig, links: [{id: 1, url: '/x'}]})).toThrow(/name/);
    });

    it('rejects a non-numeric order', () => {
        expect(() =>
            parseConfig({...validConfig, links: [{id: 1, name: 'X', url: '/x', order: 'first'}]}),
        ).toThrow(/order/);
    });
});

describe('preferences', () => {
    it('accepts an empty object and undefined/null', () => {
        expect(parsePreferences({})).toEqual({});
        expect(parsePreferences(undefined)).toEqual({});
        expect(parsePreferences(null)).toEqual({});
    });

    it('accepts a valid entryPage', () => {
        expect(parsePreferences({entryPage: 'categorized'})).toEqual({entryPage: 'categorized'});
    });

    it('drops an invalid entryPage instead of rejecting the whole object', () => {
        expect(parsePreferences({entryPage: 'nope'})).toEqual({});
        expect(parsePreferences({entryPage: 'categorized', theme: 'blue'})).toEqual({entryPage: 'categorized'});
    });

    it('treats non-object preferences as absent', () => {
        expect(parsePreferences('corrupt')).toEqual({});
        expect(parsePreferences(42)).toEqual({});
        expect(parsePreferences(['categorized'])).toEqual({});
    });

    it('ignores unknown keys', () => {
        expect(parsePreferences({unknownKey: 1, theme: 'light'})).toEqual({});
    });
});