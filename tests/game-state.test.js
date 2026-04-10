/**
 * GameState unit tests (frontend module, importable in Node since it uses pure ESM)
 * Run: node --test tests/game-state.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameState } from '../public/js/gameState.js';

describe('GameState.setUserData parseInt guard', () => {
    it('parses a numeric string to an integer age', () => {
        const gs = new GameState();
        gs.setUserData('42', 'male', false, '');
        assert.strictEqual(gs.userAge, 42);
    });

    it('parses a leading-digit string (parseInt semantics)', () => {
        const gs = new GameState();
        gs.setUserData('42years', 'male', false, '');
        assert.strictEqual(gs.userAge, 42);
    });

    it('defaults non-numeric input to 0 instead of NaN', () => {
        const gs = new GameState();
        gs.setUserData('abc', 'male', false, '');
        assert.strictEqual(gs.userAge, 0);
        assert.ok(Number.isFinite(gs.userAge), 'userAge must be a finite number');
    });

    it('defaults empty string to 0', () => {
        const gs = new GameState();
        gs.setUserData('', 'male', false, '');
        assert.strictEqual(gs.userAge, 0);
    });

    it('defaults negative numbers to 0', () => {
        const gs = new GameState();
        gs.setUserData('-5', 'male', false, '');
        assert.strictEqual(gs.userAge, 0);
    });

    it('accepts 0 as a valid age', () => {
        const gs = new GameState();
        gs.setUserData('0', 'male', false, '');
        assert.strictEqual(gs.userAge, 0);
    });
});
