import { assertEquals } from 'jsr:@std/assert@1';
import { interpretRunStart } from '../organize/runStart.ts';

Deno.test('a returned run id means the run started', () => {
  assertEquals(interpretRunStart({ data: 'run-1', error: null }), { kind: 'started', runId: 'run-1' });
});

Deno.test('no run id without an error means another run holds the lock', () => {
  assertEquals(interpretRunStart({ data: null, error: null }), { kind: 'already_running' });
});

Deno.test('an rpc error is a failure, not a running batch', () => {
  assertEquals(interpretRunStart({ data: null, error: { message: 'connection reset' } }), { kind: 'failed', message: 'connection reset' });
});
