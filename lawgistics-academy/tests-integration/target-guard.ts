/**
 * Imported first by every integration test file: before anything runs, make
 * sure the target is the local stack or a database marked as staging.
 */
import { before } from 'node:test';
import { ensureTarget } from './helpers';

before(ensureTarget);
