import test from 'node:test';
import assert from 'node:assert';
import { sortTopQuestionRows, nextTopQuestionSort } from '../public/js/admin/views/statisticsSort.js';

const rows = [
    { questionText: 'B question', category: 'Lifestyle', yesRate: 60, avgContribution: 7.85 },
    { questionText: 'A question', category: 'Medical History', yesRate: 80, avgContribution: 2.56 },
    { questionText: 'C question', category: 'Diet & Nutrition', yesRate: 80, avgContribution: 8.33 }
];

test('nextTopQuestionSort: switches to new column descending by default', () => {
    const next = nextTopQuestionSort({ column: 'yesRate', direction: 'desc' }, 'avgContribution');
    assert.deepStrictEqual(next, { column: 'avgContribution', direction: 'desc' });
});

test('nextTopQuestionSort: toggles direction on same column', () => {
    const next = nextTopQuestionSort({ column: 'yesRate', direction: 'desc' }, 'yesRate');
    assert.deepStrictEqual(next, { column: 'yesRate', direction: 'asc' });
});

test('sortTopQuestionRows: sorts numeric columns descending then ascending', () => {
    const desc = sortTopQuestionRows(rows, { column: 'avgContribution', direction: 'desc' });
    assert.deepStrictEqual(desc.map(r => r.avgContribution), [8.33, 7.85, 2.56]);

    const asc = sortTopQuestionRows(rows, { column: 'avgContribution', direction: 'asc' });
    assert.deepStrictEqual(asc.map(r => r.avgContribution), [2.56, 7.85, 8.33]);
});

test('sortTopQuestionRows: sorts text columns alphabetically', () => {
    const sorted = sortTopQuestionRows(rows, { column: 'questionText', direction: 'asc' });
    assert.deepStrictEqual(sorted.map(r => r.questionText), ['A question', 'B question', 'C question']);
});
