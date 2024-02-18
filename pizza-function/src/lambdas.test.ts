import { test, expect } from "vitest";
import { handler } from "./lambda";

test('Does not trigger event when no data', async () => {
    const result = await handler({detail:{}}, {} as any, () => {});
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('{"message":"Did not trigger event"}');
});

test('Does not trigger event when not at Arlington', async () => {
    const input = {
        detail:{
            EventType: 'EXIT',
            GeofenceId: 'Somewhere Random',
            SampleTime: '2024-02-17T22:23:24Z'
        }
    };
    const result = await handler(input, {} as any, () => {});
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('{"message":"Did not trigger event"}');
});