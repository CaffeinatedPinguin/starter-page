import {afterEach, describe, expect, it, vi} from 'vitest';
import {isAddonEnvironment, isIncognitoContext} from './environment';
import {stubLocationProtocol} from '@/test/testUtils';

afterEach(() => {
    vi.unstubAllGlobals();
    stubLocationProtocol('http:');
});

describe('isAddonEnvironment', () => {
    it('is true for extension protocols and false for http(s)', () => {
        stubLocationProtocol('moz-extension:');
        expect(isAddonEnvironment()).toBe(true);

        stubLocationProtocol('http:');
        expect(isAddonEnvironment()).toBe(false);
    });
});

describe('isIncognitoContext', () => {
    it('is false when no extension API is present', () => {
        expect(isIncognitoContext()).toBe(false);
    });

    it('is false when the API reports a normal context', () => {
        vi.stubGlobal('browser', {extension: {inIncognitoContext: false}});
        expect(isIncognitoContext()).toBe(false);
    });

    it('reads browser.extension.inIncognitoContext (Firefox)', () => {
        vi.stubGlobal('browser', {extension: {inIncognitoContext: true}});
        expect(isIncognitoContext()).toBe(true);
    });

    it('reads chrome.extension.inIncognitoContext (Chromium)', () => {
        vi.stubGlobal('chrome', {extension: {inIncognitoContext: true}});
        expect(isIncognitoContext()).toBe(true);
    });

    it('prefers browser over chrome when both are present', () => {
        vi.stubGlobal('browser', {extension: {inIncognitoContext: true}});
        vi.stubGlobal('chrome', {extension: {inIncognitoContext: false}});
        expect(isIncognitoContext()).toBe(true);
    });
});
