import { test, expect } from "vitest";
import { handler } from "./lambda";

test('runs function', async () => {
    const result = await handler({detail:{}}, {} as any, () => {});
    //expect(result.statusCode).toBe(200);
    //expect(result.body).toBe('{"message":"Did not trigger event"}');
});