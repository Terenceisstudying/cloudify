export const DEFAULT_TOP_QUESTION_SORT = {
    column: 'yesRate',
    direction: 'desc'
};

export function nextTopQuestionSort(currentSort, column) {
    if (!currentSort || currentSort.column !== column) {
        return { column, direction: 'desc' };
    }
    return {
        column,
        direction: currentSort.direction === 'desc' ? 'asc' : 'desc'
    };
}

export function sortTopQuestionRows(rows, sort) {
    const safeRows = Array.isArray(rows) ? [...rows] : [];
    const column = sort?.column || DEFAULT_TOP_QUESTION_SORT.column;
    const direction = sort?.direction === 'asc' ? 1 : -1;

    safeRows.sort((a, b) => {
        if (column === 'questionText' || column === 'category') {
            const aText = String(a?.[column] || '').toLowerCase();
            const bText = String(b?.[column] || '').toLowerCase();
            const cmp = aText.localeCompare(bText);
            return cmp * direction;
        }

        const aNum = Number(a?.[column]) || 0;
        const bNum = Number(b?.[column]) || 0;
        return (aNum - bNum) * direction;
    });

    return safeRows;
}
