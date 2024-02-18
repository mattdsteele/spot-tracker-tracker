import { test, expect, afterEach, vi } from "vitest";
import { handler } from "./lambda";
import * as playwright from './caseys-playwright';
import * as push from './push';
import { SendResult } from "web-push";

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

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

test('Does trigger event for Arlington', async () => {
    vi.stubGlobal('process', {env: {SPOT_PUSH_MATT_SUB: '{"endpoint":"hello"}'}});
    let playwrightSpy = vi.spyOn(playwright, 'main');
    playwrightSpy.mockImplementationOnce((_,__) => {
        return Promise.resolve({
            video: '',
            simulation: true
        })
    })
    
    let pushSpy = vi.spyOn(push, 'sendPushEvent');
    pushSpy.mockImplementation((_,__) =>{
        return Promise.resolve({} as SendResult);
    })

    const input = {detail:{
        EventType: 'EXIT',
        GeofenceId: 'Arlington',
        SampleTime: '2024-02-17T22:23:24Z'
    }};
    const result = await handler(input, {} as any, () => {});
    expect(playwrightSpy).toHaveBeenCalledOnce();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(input);
});