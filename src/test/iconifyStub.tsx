import type {SVGProps} from 'react';

/**
 * Vitest-only stub for `virtual:iconify/*` icon components.
 *
 * @iconify/unplugin generates virtual modules lazily; Vitest's module mocker
 * turns their ids into `file:///~iconify/...` URLs and calls `createRequire`
 * on them, which throws on Windows. Unit tests only exercise the icon registry
 * logic (id -> component, brand/generic, brand color), not the generated SVG —
 * the real inline SVG is produced and verified by the production build. This
 * alias keeps tests deterministic and platform-independent.
 */
export default function IconifyStub(props: SVGProps<SVGSVGElement>) {
    return <svg {...props}/>;
}
