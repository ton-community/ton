export function findCommonPrefix(src: string[]) {

    // Corner cases
    if (src.length === 0) {
        return '';
    }
    if (src.length === 1) {
        return src[0];
    }

    // Searching for prefix
    const sorted = [...src].sort();
    let size = 0;
    for (let i = 0; i < sorted[0].length; i++) {
        if (sorted[0][i] !== sorted[sorted.length - 1][i]) {
            break;
        }
        size++;
    }
    return src[0].slice(0, size);
}