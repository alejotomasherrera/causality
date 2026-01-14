/**
 * @causality/collector-core — Trace Builder
 *
 * Reconstructs causal trace trees from unordered action events.
 */

import type {
  ActionEvent,
  TraceBuffer,
  CausalityTrace,
  CausalityActionNode,
  TraceBuildResult,
} from './types.js';

/**
 * Internal representation during tree building.
 */
interface ActionBuildNode {
  id: string;
  name: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'ok' | 'error';
  attributes: Record<string, unknown>;
  error?: { message: string; stack?: string };
  children: ActionBuildNode[];
}

/**
 * Build a causal trace from buffered events.
 */
export function buildTrace(buffer: TraceBuffer): TraceBuildResult {
  const warnings: string[] = [];
  const nodes = new Map<string, ActionBuildNode>();

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
    } else if (event.type === 'action.end') {
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
  const rootNodes: ActionBuildNode[] = [];
  const seenIds = new Set<string>();

  for (const node of nodes.values()) {
    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        // Cycle detection
        if (detectCycle(node.id, parent, nodes, seenIds)) {
          warnings.push(`Cycle detected: ${node.id} -> ${node.parentId}`);
          rootNodes.push(node);
        } else {
          parent.children.push(node);
        }
      } else {
        warnings.push(`Missing parent: ${node.parentId} for action ${node.id}`);
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  // Phase 3: Convert to immutable output format
  const convertedRoots = rootNodes.map((node) => convertNode(node, 0));

  // Calculate trace-level metrics
  const allNodes = Array.from(nodes.values());
  const startTimes = allNodes.map((n) => n.startTime);
  const endTimes = allNodes.filter((n) => n.endTime).map((n) => n.endTime!);

  const traceStartTime = Math.min(...startTimes);
  const traceEndTime = endTimes.length > 0 ? Math.max(...endTimes) : undefined;

  // Determine trace status
  let traceStatus: 'ok' | 'error' | 'partial' = 'ok';
  const hasIncomplete = allNodes.some((n) => n.status === 'running');
  const hasError = allNodes.some((n) => n.status === 'error');

  if (hasIncomplete) {
    traceStatus = 'partial';
  } else if (hasError) {
    traceStatus = 'error';
  }

  if (warnings.length > 0) {
    traceStatus = 'partial';
  }

  const maxDepth = calculateMaxDepth(convertedRoots);

  const trace: CausalityTrace = {
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
function convertNode(node: ActionBuildNode, depth: number): CausalityActionNode {
  const durationMs =
    node.endTime !== undefined ? node.endTime - node.startTime : undefined;

  const status: 'ok' | 'error' | 'incomplete' =
    node.status === 'running' ? 'incomplete' : node.status;

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
function detectCycle(
  startId: string,
  parent: ActionBuildNode,
  nodes: Map<string, ActionBuildNode>,
  visited: Set<string>
): boolean {
  visited.clear();
  visited.add(startId);

  let current: ActionBuildNode | undefined = parent;
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
function calculateMaxDepth(roots: CausalityActionNode[]): number {
  if (roots.length === 0) return 0;

  let max = 0;
  for (const root of roots) {
    max = Math.max(max, getNodeMaxDepth(root));
  }
  return max;
}

function getNodeMaxDepth(node: CausalityActionNode): number {
  if (node.children.length === 0) {
    return node.depth;
  }
  return Math.max(...node.children.map(getNodeMaxDepth));
}
