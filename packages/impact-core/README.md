# @causality/impact-core

Impact scoring and notification policy for causal issues.

> **Phase 5** — Impact Core: _Alert less, but better_

## Philosophy

Traditional alerting asks: _"What just happened?"_ → **Always notify**

Causality asks: _"Does a human need to care about this?"_ → **Selective surfacing**

Most issues don't need human attention. This package determines which do.

## Installation

```bash
npm install @causality/impact-core
```

## Quick Start

```typescript
import { assessImpact, ImpactAssessor } from "@causality/impact-core";
import { buildExplanation } from "@causality/reproducibility-core";

const explanation = buildExplanation({ trace, metrics, findings });

const assessment = assessImpact(explanation, {
  occurrences: 50,
  windowMs: 60000,
  affectedPercentage: 30,
});

if (assessment.shouldNotify) {
  console.log(assessment.summary);
  // "silent degradation in 'Dashboard' (impact: 65, medium) → batch to product"
}
```

## Core Concepts

### Impact Assessment

The main output combining score, audience, and policy:

```typescript
interface ImpactAssessment {
  id: string;
  traceId: string;
  category: IssueCategory; // error | silent_degradation | resource_pressure | latency
  scope: ImpactScope; // user_facing | internal | infrastructure
  score: ImpactScore; // 0-100 with breakdown
  audience: AudienceClassification;
  policy: NotificationPolicy;
  summary: string;
  shouldNotify: boolean; // The key decision
  explanation: ReproducibilityExplanation;
}
```

### Impact Score

Deterministic scoring based on concrete factors:

| Factor            | Weight | Description                              |
| ----------------- | ------ | ---------------------------------------- |
| Issue Type        | 30%    | error > silent_degradation > degradation |
| Frequency         | 20%    | How often it occurs                      |
| Affected Actions  | 20%    | Error count, degradation ratio, depth    |
| Resource Pressure | 15%    | CPU, memory, event loop                  |
| Scope             | 15%    | User-facing > infrastructure > internal  |

```typescript
interface ImpactScore {
  total: number; // 0-100
  breakdown: {
    issueType: number;
    frequency: number;
    affectedActions: number;
    resourcePressure: number;
    scope: number;
  };
  priority: Priority; // critical | high | medium | low | none
}
```

### Audience Classification

Who needs to know about this issue:

| Audience    | When                                     |
| ----------- | ---------------------------------------- |
| `developer` | Code-level errors, internal issues       |
| `product`   | User-facing degradation, UX impact       |
| `ops`       | Infrastructure issues, resource pressure |
| `none`      | Issue doesn't warrant human attention    |

```typescript
const classification = classifyAudience(explanation);
// { primary: 'product', secondary: ['developer'], reason: '...' }
```

### Notification Policy

What action to take:

| Action   | Score Threshold | Description                       |
| -------- | --------------- | --------------------------------- |
| `alert`  | ≥ 70            | Immediate notification            |
| `batch`  | ≥ 40            | Aggregate and notify periodically |
| `store`  | ≥ 20            | Store for historical analysis     |
| `ignore` | < 20            | Not worth tracking                |

```typescript
const policy = determinePolicy(score, audience);
// { action: 'batch', channels: [...], delayMs: 300000, reason: '...' }
```

## API Reference

### assessImpact

Main entry point:

```typescript
import { assessImpact } from "@causality/impact-core";

const assessment = assessImpact(
  explanation,
  {
    occurrences: 100,
    windowMs: 60000,
    affectedPercentage: 30,
  },
  {
    scoring: { priorityThresholds: { critical: 90 } },
    policy: { alertThreshold: 80 },
  }
);
```

### ImpactAssessor

Stateful assessor with filtering helpers:

```typescript
import { ImpactAssessor } from "@causality/impact-core";

const assessor = new ImpactAssessor();

// Assess multiple explanations
const assessments = explanations.map((e) => assessor.assessSingle(e));

// Filter
const notifiable = assessor.filterNotifiable(assessments);
const forProduct = assessor.filterByAudience(assessments, "product");
const highPriority = assessor.filterByPriority(assessments, "high");

// Group
const byAction = assessor.groupByAction(assessments);

// Stats
const stats = assessor.getStats(assessments);
// { total: 10, shouldNotify: 3, byAction: {...}, byPriority: {...} }
```

### Scoring Utilities

```typescript
import {
  calculateImpactScore,
  extractIssueCategory,
  detectImpactScope,
} from "@causality/impact-core";

const score = calculateImpactScore(explanation, frequency);
const category = extractIssueCategory(explanation);
const scope = detectImpactScope(explanation);
```

### Audience Utilities

```typescript
import {
  classifyAudience,
  shouldSurfaceToHumans,
  getAllAudiences,
} from "@causality/impact-core";

const classification = classifyAudience(explanation);
if (shouldSurfaceToHumans(classification)) {
  const audiences = getAllAudiences(classification);
}
```

### Policy Utilities

```typescript
import {
  determinePolicy,
  requiresImmediateAction,
  shouldBatch,
  shouldStore,
} from "@causality/impact-core";

const policy = determinePolicy(score, audience);
if (requiresImmediateAction(policy)) {
  // Send alert now
}
if (shouldBatch(policy)) {
  // Queue for batch notification
}
```

## Example: Full Pipeline

```typescript
import { buildExplanation } from "@causality/reproducibility-core";
import { assessImpact, ImpactAssessor } from "@causality/impact-core";

// Build explanation
const explanation = buildExplanation({ trace, metrics, findings });

// Assess impact
const assessment = assessImpact(explanation, {
  occurrences: 50,
  windowMs: 60000,
  affectedPercentage: 30,
});

// Decision
if (assessment.shouldNotify) {
  console.log(`[${assessment.policy.action.toUpperCase()}]`);
  console.log(assessment.summary);

  for (const channel of assessment.policy.channels) {
    console.log(`  → ${channel.type} (${channel.audience})`);
  }
} else {
  console.log("Issue stored but not surfaced");
}
```

**Output:**

```
[BATCH]
silent degradation in 'Dashboard' (impact: 55, medium) → batch to product
  → console (product)
```

## Real-World Examples

### "Silent UX bug affecting 30% of dashboard loads → notify product"

```typescript
const assessment = assessImpact(
  dashboardExplanation, // silent_degradation, user_facing actions
  { occurrences: 1000, affectedPercentage: 30, windowMs: 3600000 }
);

assessment.shouldNotify; // true
assessment.audience.primary; // 'product'
assessment.policy.action; // 'batch'
```

### "Rare edge case → store only"

```typescript
const assessment = assessImpact(
  edgeCaseExplanation, // latency issue, internal action
  { occurrences: 1, affectedPercentage: 0.01, windowMs: 3600000 }
);

assessment.shouldNotify; // true (stored)
assessment.policy.action; // 'store'
```

### "Infrastructure error → page ops"

```typescript
const assessment = assessImpact(
  dbErrorExplanation, // error, infrastructure scope
  { occurrences: 100, affectedPercentage: 50, windowMs: 60000 }
);

assessment.audience.primary; // 'ops'
assessment.policy.action; // 'alert'
assessment.policy.channels; // [{ type: 'pagerduty', audience: 'ops' }]
```

## Configuration

### Scoring Weights

```typescript
const assessor = new ImpactAssessor({
  scoring: {
    weights: {
      issueType: 40, // Emphasize issue type
      frequency: 15,
      affectedActions: 15,
      resourcePressure: 15,
      scope: 15,
    },
    priorityThresholds: {
      critical: 90,
      high: 75,
      medium: 50,
      low: 25,
    },
  },
});
```

### Policy Thresholds

```typescript
const assessor = new ImpactAssessor({
  policy: {
    alertThreshold: 80, // Higher bar for alerts
    batchThreshold: 50,
    storeThreshold: 25,
    batchDelayMs: 600000, // 10 minutes
  },
});
```

### Action Classification Patterns

```typescript
const assessor = new ImpactAssessor({
  actionPatterns: {
    userFacingPatterns: ["Render", "Display", "Checkout", "Payment"],
    internalPatterns: ["Validate", "Transform", "Calculate"],
    infrastructurePatterns: ["Database", "Cache", "Connect"],
  },
});
```

## Guarantees

| Guarantee         | How                               |
| ----------------- | --------------------------------- |
| **Deterministic** | Same input → same output          |
| **No AI**         | Threshold-based only              |
| **No heuristics** | Clear rules, no guessing          |
| **Auditable**     | Score breakdown explains decision |

## Why "Alert Less, But Better"

Traditional alerting:

- Error? → Alert
- Slow? → Alert
- Spike? → Alert

Result: Alert fatigue, ignored notifications

Causality's approach:

- Is this user-facing?
- How often does it happen?
- Who needs to know?
- Is immediate action required?

Result: Only issues worth human attention escape the system.

## Requirements

- Node.js >= 18.0.0
- @causality/reproducibility-core >= 0.1.0

## License

MIT
