import { vi } from 'vitest';

vi.mock('./src/render/events/event.ts', () => ({
    event: vi.fn(),
}));
