/**
 * @causality/collector-core — Trace Builder
 *
 * Reconstructs causal trace trees from unordered action events.
 */
/**
 * Build a causal trace from buffered events.
 */
export function buildTrace(buffer) {
    const warnings = [];
    const nodes = new Map();
    // Phase 1: Process all events into nodes
    for (const event of buffer.events) {
        const { action } = event;
        if (event.type === 'action.start') {
            // Create new node on start
            if (!nodes.has(action.id)) {
                nodes.set(action.id, {
                    id: action.id,
                    name: action.name,
                    parentId: action.parentId,
                    startTime: action.startTime,
                    status: 'running',
                    attributes: action.attributes ? { ...action.attributes } : {},
                    children: [],
                });
            }
        }
        else if (event.type === 'action.end') {
            // Update existing node or create if start was missed
            let node = nodes.get(action.id);
            if (!node) {
                warnings.push(`action.end without matching start: ${action.id}`);
                node = {
                    id: action.id,
                    name: action.name,
                    parentId: action.parentId,
                    startTime: action.startTime,
                    status: 'running',
                    attributes: {},
                    children: [],
                };
                nodes.set(action.id, node);
            }
            node.endTime = action.endTime;
            node.status = action.status === 'running' ? 'ok' : action.status;
            // Merge attributes
            if (action.attributes) {
                Object.assign(node.attributes, action.attributes);
            }
            if (action.error) {
                node.error = { ...action.error };
            }
        }
    }
    // Phase 2: Build parent-child relationships
    const rootNodes = [];
    const seenIds = new Set();
    for (const node of nodes.values()) {
        if (node.parentId) {
            const parent = nodes.get(node.parentId);
            if (parent) {
                // Cycle detection
                if (detectCycle(node.id, parent, nodes, seenIds)) {
                    warnings.push(`Cycle detected: ${node.id} -> ${node.parentId}`);
                    rootNodes.push(node);
                }
                else {
                    parent.children.push(node);
                }
            }
            else {
                warnings.push(`Missing parent: ${node.parentId} for action ${node.id}`);
                rootNodes.push(node);
            }
        }
        else {
            rootNodes.push(node);
        }
    }
    // Phase 3: Convert to immutable output format
    const convertedRoots = rootNodes.map((node) => convertNode(node, 0));
    // Calculate trace-level metrics
    const allNodes = Array.from(nodes.values());
    const startTimes = allNodes.map((n) => n.startTime);
    const endTimes = allNodes.filter((n) => n.endTime).map((n) => n.endTime);
    const traceStartTime = Math.min(...startTimes);
    const traceEndTime = endTimes.length > 0 ? Math.max(...endTimes) : undefined;
    // Determine trace status
    let traceStatus = 'ok';
    const hasIncomplete = allNodes.some((n) => n.status === 'running');
    const hasError = allNodes.some((n) => n.status === 'error');
    if (hasIncomplete) {
        traceStatus = 'partial';
    }
    else if (hasError) {
        traceStatus = 'error';
    }
    if (warnings.length > 0) {
        traceStatus = 'partial';
    }
    const maxDepth = calculateMaxDepth(convertedRoots);
    const trace = {
        traceId: buffer.traceId,
        startTime: traceStartTime,
        endTime: traceEndTime,
        durationMs: traceEndTime ? traceEndTime - traceStartTime : undefined,
        rootActions: convertedRoots,
        status: traceStatus,
        actionCount: nodes.size,
        maxDepth,
    };
    return { trace, warnings };
}
/**
 * Convert internal node to output format with depth calculation.
 */
function convertNode(node, depth) {
    const durationMs = node.endTime !== undefined ? node.endTime - node.startTime : undefined;
    const status = node.status === 'running' ? 'incomplete' : node.status;
    return {
        id: node.id,
        name: node.name,
        startTime: node.startTime,
        status,
        depth,
        children: node.children.map((child) => convertNode(child, depth + 1)),
        // Conditionally include optional fields
        ...(node.parentId !== undefined && { parentId: node.parentId }),
        ...(node.endTime !== undefined && { endTime: node.endTime }),
        ...(durationMs !== undefined && { durationMs }),
        ...(Object.keys(node.attributes).length > 0 && { attributes: node.attributes }),
        ...(node.error !== undefined && { error: node.error }),
    };
}
/**
 * Detect cycles in parent chain.
 */
function detectCycle(startId, parent, nodes, visited) {
    visited.clear();
    visited.add(startId);
    let current = parent;
    while (current) {
        if (visited.has(current.id)) {
            return true;
        }
        visited.add(current.id);
        current = current.parentId ? nodes.get(current.parentId) : undefined;
    }
    return false;
}
/**
 * Calculate maximum depth of the action tree.
 */
function calculateMaxDepth(roots) {
    if (roots.length === 0)
        return 0;
    let max = 0;
    for (const root of roots) {
        max = Math.max(max, getNodeMaxDepth(root));
    }
    return max;
}
function getNodeMaxDepth(node) {
    if (node.children.length === 0) {
        return node.depth;
    }
    return Math.max(...node.children.map(getNodeMaxDepth));
}
//# sourceMappingURL=trace-builder.js.map