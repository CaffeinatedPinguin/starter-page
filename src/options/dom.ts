/**
 * Thin DOM helpers for the options page. The structure lives in options.html;
 * these only look elements up and update the status line.
 */

function requireElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Brak elementu #${id} w options.html.`);
    }
    return element as T;
}

export function getInput(id: string): HTMLInputElement {
    return requireElement<HTMLInputElement>(id);
}

export function getSelect(id: string): HTMLSelectElement {
    return requireElement<HTMLSelectElement>(id);
}

export function getButton(id: string): HTMLButtonElement {
    return requireElement<HTMLButtonElement>(id);
}

export function getSection(id: string): HTMLElement {
    return requireElement<HTMLElement>(id);
}

export function show(section: HTMLElement): void {
    section.hidden = false;
}

export function applySelectValue(select: HTMLSelectElement, value: string | undefined): void {
    select.value = value ?? '';
}

/** Updates the dedicated status line; never touches the form itself. */
export function renderMessage(message: string): void {
    const status = document.getElementById('options-status');
    if (status) {
        status.textContent = message;
    }
}
