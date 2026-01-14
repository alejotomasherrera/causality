/**
 * @causality/storage-core — Serializers
 *
 * JSON serialization and normalization for traces.
 */
/**
 * Serialize a trace to JSON string.
 * Produces a single-line JSON suitable for JSONL format.
 */
export function serializeTrace(trace) {
    return JSON.stringify(trace);
}
/**
 * Deserialize a JSON string to a trace.
 * Validates required fields.
 */
export function deserializeTrace(json) {
    const parsed = JSON.parse(json);
    // Validate required fields
    if (typeof parsed.traceId !== 'string') {
        throw new Error('Invalid trace: missing traceId');
    }
    if (typeof parsed.startTime !== 'number') {
        throw new Error('Invalid trace: missing startTime');
    }
    if (!Array.isArray(parsed.rootActions)) {
        throw new Error('Invalid trace: missing rootActions');
    }
    if (!['ok', 'error', 'partial'].includes(parsed.status)) {
        throw new Error(`Invalid trace: invalid status "${parsed.status}"`);
    }
    return parsed;
}
/**
 * Extract all action names from a trace (recursive).
 */
export function extractActionNames(trace) {
    const names = new Set();
    function traverse(node) {
        names.add(node.name);
        for (const child of node.children) {
            traverse(child);
        }
    }
    for (const root of trace.rootActions) {
        traverse(root);
    }
    return names;
}
/**
 * Find action by name within a trace (first match).
 */
export function findAction(trace, actionName) {
    function search(node) {
        if (node.name === actionName) {
            return node;
        }
        for (const child of node.children) {
            const found = search(child);
            if (found)
                return found;
        }
        return null;
    }
    for (const root of trace.rootActions) {
        const found = search(root);
        if (found)
            return found;
    }
    return null;
}
/**
 * Find all actions matching a name within a trace.
 */
export function findAllActions(trace, actionName) {
    const results = [];
    function search(node) {
        if (node.name === actionName) {
            results.push(node);
        }
        for (const child of node.children) {
            search(child);
        }
    }
    for (const root of trace.rootActions) {
        search(root);
    }
    return results;
}
/**
 * Check if trace contains any action matching predicate.
 */
export function hasMatchingAction(trace, predicate) {
    function check(node) {
        if (predicate(node)) {
            return true;
        }
        for (const child of node.children) {
            if (check(child))
                return true;
        }
        return false;
    }
    for (const root of trace.rootActions) {
        if (check(root))
            return true;
    }
    return false;
}
//# sourceMappingURL=serializers.js.map