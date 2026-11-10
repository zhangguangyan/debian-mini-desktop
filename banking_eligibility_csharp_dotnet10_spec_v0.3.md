# Banking Eligibility Platform — C# / .NET 10 Specification

**Version:** 0.3 — .NET implementation (supersedes Groovy/Kotlin v0.2 for this implementation)  
**Date:** 11 November 2026  
**Status:** Implementation-ready MVP proposal  
**Audience:** ChatGPT Work, .NET engineers, platform architects, banking policy reviewers  
**Working name:** Eligibility Policy as Code

> **Product definition.** Engineers author banking product pre-screening policies in a constrained **C# internal DSL**. A trusted build constructs and validates a **versioned, immutable, serializable domain AST**. At assessment time, the system statically discovers every fact referenced by the selected policy, expands derived-fact dependencies and performs **one upfront eager enrichment phase** using ordinary **C# services**. It creates an immutable fact snapshot, runs a **pure deterministic evaluator**, and returns an explainable decision. A **read-only Blazor business explorer** renders rules, first-class decision tables, fact lineage, results and policy diffs from the very same domain AST.

**The core principle:** One C# policy language; one domain AST; one eager enrichment phase; one immutable snapshot; one deterministic evaluator; multiple generated business views.

---

## 1. Non-negotiable decisions

1. **C# 14 on .NET 10** for the entire MVP backend and policy DSL. Use ASP.NET Core 10, built-in DI and standard .NET libraries. Do **not** use Groovy, Kotlin, Spring or a JVM.
2. **Engineers author rules as code.** Business stakeholders read, simulate and review generated visualisations; no GUI-based policy authoring.
3. **Mermaid's philosophy, not Mermaid itself.** Source code is authoritative; visualisations are generated. Build a custom presentation using Blazor components, HTML/CSS and SVG; do not render Mermaid diagrams.
4. **The C# internal DSL constructs our own immutable domain AST.** Do not rely on arbitrary executable `Func<>` predicates as policy definitions. `System.Linq.Expressions` can be evaluated later as an optional restricted authoring adapter, but is not the canonical policy model.
5. **Decision tables are first-class AST nodes** with named columns/rows, stable IDs, explicit hit policies and outcome semantics. Use regular C# collection expressions and/or builder methods, not custom C# parser/compiler syntax.
6. **Single-phase eager enrichment.** Inspect the AST for its complete potential fact dependency set, expand derived inputs, fetch necessary source facts up front, compute derivations and freeze a snapshot **before any business rule evaluation**.
7. **No enrichment DSL, lazy loading, or staged enrichment.** Enrichment uses ordinary C# interfaces, dependency injection, typed clients and async methods. No rule-triggered data retrieval.
8. **Pure evaluator.** No network, database, dynamic assemblies, clock reads, mutable cross-assessment state or callbacks into enrichment.
9. **One deployment unit for MVP.** Prefer a single ASP.NET Core host containing Minimal APIs and a Blazor Web App; keep clean module boundaries in the solution without introducing microservices.
10. **Synthetic data only.** Fake Customer Profile, KYC, Income and Lending adapters. No live bank/customer systems, credit bureau access or customer PII.
11. **Policy code executes only in trusted build/publishing tooling.** Runtime loads only approved, validated, versioned serialized AST artifacts. Never compile arbitrary user-supplied C# in the API process.
12. **LSP, MCP, Roslyn domain analyzers, arbitrary C# expression translation and GUI editing are not MVP features.** Design extension points but implement the working vertical slice first.

## 2. Goal and personas

### Goal

Provide a maintainable, testable and auditable way to define initial banking-product eligibility policies, assess a customer against a specific approved version, and present the logic in a form non-engineers can understand.

### Engineer / policy author

- Creates a typed C# policy file in Git.
- Gets standard C# completion/refactoring/compiler checking.
- Runs the policy compiler, validator and scenario tests.
- Reviews canonical AST and semantic diff in a pull request.

### Business reviewer

- Opens a **read-only** policy explorer.
- Reads plain-language rules and decision tables derived from the AST.
- Runs synthetic what-if simulations, examines outcomes and compares policy versions.
- Sees each decision's rule results and fact provenance without needing to read source code.

### API consumer

- Requests assessment of a synthetic customer against a published policy version.
- Receives outcome, reason codes, per-rule trace, policy identity and safe enrichment summary.

### Operator / auditor

- Can trace policy version/hash, source-fact statuses, decision inputs and evaluation result.
- Can reproduce a historical synthetic decision from stored immutable AST and snapshot without calling source APIs.

## 3. Architecture and ownership

```text
                     Engineer-authored C# Policy Source (Git)
                                      |
                                Trusted .NET build
                                      v
                      C# DSL Builders -> Domain AST
                                      |
                          Semantic Validator / Canonicaliser
                                      |
                       Immutable, versioned JSON artifact
                                      |
                    +-----------------+------------------+
                    |                                    |
                    v                                    v
         Read-only Blazor Explorer                  Assessment API
                    |                                    |
          AST-derived views                     Validate + Authorise
                                                         |
                                                Discover required facts
                                                         |
                                               Expand derived dependencies
                                                         |
                                         Single-phase Eager Enrichment
                                            /          |           \
                                  Customer mock     KYC mock    Income/Lending
                                            \          |           /
                                              Normalize + derive
                                                         |
                                                Immutable FactSnapshot
                                                         |
                                              Pure Eligibility Evaluator
                                                         |
                                        Decision + Rule Trace + Provenance
                                                         |
                                            API / Business UI / Audit
```

**Boundaries:**

- **Authoring/build:** Trusted C# code builds domain nodes; never runs during customer assessment.
- **Domain:** Fact types, policy nodes, outcomes, schemas and validation rules. No infrastructure dependencies.
- **Enrichment:** One-time I/O and deterministic derivation orchestrator. Owns source authorization, deadlines, provenance and normalization.
- **Evaluation:** Pure transformation of `(PolicyAst, FactSnapshot, EvaluationContext)` to `Decision`.
- **Presentation:** Read-only projections of AST/traces. Must not implement a second interpretation of business rules.

## 4. Technology choices

- **Runtime / language:** .NET 10 LTS, C# 14, nullable reference types on, analyzers on, warnings-as-errors for core projects.
- **HTTP:** ASP.NET Core 10 Minimal APIs, OpenAPI document, consistent RFC-style problem responses where applicable.
- **UI:** Blazor Web App with Interactive Server for scenario entry, table highlighting and interactive AST/lineage navigation; server-rendered HTML plus SVG; very limited JavaScript interop only if strictly necessary.
- **Concurrency:** `Task`, `Task.WhenAll`, `CancellationToken`, bounded fan-out. No external workflow engine.
- **HTTP integration:** typed `HttpClient` clients registered with `IHttpClientFactory`; fake/in-memory and mock-HTTP adapters for tests.
- **Serialization:** `System.Text.Json`; schema-versioned canonical JSON for policy AST and synthetic snapshots. Explicit discriminators and validation for polymorphic nodes.
- **Collections:** `ImmutableArray<T>`, `ImmutableDictionary<TKey,TValue>`, or immutable records with defensive freezing; no writable collection exposed after compilation.
- **Testing:** xUnit, standard .NET assertions, ASP.NET Core integration testing (`WebApplicationFactory`), Blazor component test framework if useful. Browser E2E automation is optional after core tests pass.
- **Artifacts / persistence:** Filesystem JSON policy artifacts and synthetic fixture snapshots for the MVP. No database is required.
- **Tooling:** .NET solution and `dotnet` CLI; Roslyn/IDE language services inherited from C#.

Pin compatible stable NuGet and SDK versions during implementation and record exact versions in the README. Avoid speculative package dependencies.

## 5. C# policy DSL

### 5.1 Authoring philosophy

The DSL **constructs a model**; it does not execute policy expressions against a live applicant. It should be naturally readable to engineers and reasonably understandable to a business reviewer reading source, while the dedicated UI remains the business review surface.

**Proposed C# API (design-target syntax; implement as ordinary methods):**

```csharp
using static Eligibility.Authoring.Eligibility;

var policy = Define("personal-loan", "2026.11", p =>
{
    p.Title("Personal Loan — Initial Eligibility");
    p.EffectiveFrom(new DateOnly(2026, 11, 1));

    p.Require("minimum-age", r => r
        .Description("Applicant must be at least 18")
        .When(Facts.Age.AtLeast(18))
        .OnFail("UNDER_MINIMUM_AGE")
        .OnUnknown("AGE_NOT_AVAILABLE"));

    p.DecisionTable("residency-status", t => t
        .Title("Residency verification")
        .HitPolicy(HitPolicy.Unique)
        .Row("verified", Facts.ResidencyStatus.Is(Residency.Verified), RuleOutcome.Pass)
        .Row("pending", Facts.ResidencyStatus.Is(Residency.Pending), RuleOutcome.Unknown)
        .Row("ineligible", Facts.ResidencyStatus.Is(Residency.Ineligible), RuleOutcome.Fail)
        .Otherwise(RuleOutcome.Unknown)
        .OnFail("RESIDENCY_NOT_ELIGIBLE")
        .OnUnknown("RESIDENCY_NOT_VERIFIED"));

    p.Require("minimum-income", r => r
        .Description("Monthly verified income must be at least AUD 3,000")
        .When(Facts.MonthlyIncomeAud.AtLeast(3000.00m))
        .OnFail("INCOME_BELOW_THRESHOLD")
        .OnUnknown("INCOME_NOT_AVAILABLE"));

    p.DecisionStrategy(DecisionStrategy.AllMandatory);
});
```

- All sample eligibility thresholds are **fictional** and do not represent bank requirements, credit advice or regulatory standards.
- `Facts.Age` and other keys are strongly typed declarations (`FactKey<int>`, `FactKey<decimal>`, `FactKey<Residency>`).
- `AtLeast`, `Is` and table builders return **domain predicate nodes**, not `bool` or delegates.
- A `Require` is a mandatory rule; a `DecisionTable` is a mandatory rule-like node. Rule and row IDs are stable machine identities independent of titles.
- Do not permit arbitrary `Func<Customer,bool>` or code callbacks as policy nodes. They cannot be reliably inspected, serialized, rendered or replayed.

### 5.2 Logical constructs

Provide explicit builder operations for `All`, `Any`, `Not` and typed comparisons, including equals, greater/less than, set membership and an explicit `IsKnown`/availability predicate only if needed.

```csharp
p.Require("basic-criteria", r => r
    .When(All(
        Facts.Age.AtLeast(18),
        Facts.MonthlyIncomeAud.AtLeast(3000m)
    ))
    .OnFail("BASIC_CRITERIA_NOT_MET")
    .OnUnknown("BASIC_CRITERIA_UNDETERMINED"));
```

For `All(...)`, `Not(...)` etc., implement static node-construction helpers or namespace-scoped functions so this example is valid. Prefer simple APIs to clever operator overloads.

### 5.3 First-class decision tables

A table has `Id`, `Title`, `HitPolicy`, typed input predicates, named `Rows`, per-row `Outcome`, `Otherwise`, optional reason mappings and source reference. Multi-input row API can be an overload accepting multiple predicates; exact fluent signature can be refined so long as it is ordinary, compilable C#.

MVP supports `UNIQUE`: **at most one row may match for complete, available inputs**. Multiple matches cause an explicit `PolicyEvaluationError` and the assessment must be blocked; never silently choose one. A no-match case yields `Otherwise`. Missing/stale/invalid inputs must not be mistaken for matching wildcard cells. Conservatively return `UNKNOWN` when data does not permit a definitive match.

For business review the same node renders as a table:

| Residency status | Rule outcome |
|---|---|
| VERIFIED | PASS |
| PENDING | UNKNOWN |
| INELIGIBLE | FAIL |
| Otherwise / absent | UNKNOWN |

Not an authoring requirement: Spock-style `|` syntax, specialized C# compiler syntax, hand-authored HTML tables or an embedded DMN engine.

## 6. Domain AST / semantic model

### 6.1 Why an explicit domain AST?

C# has `System.Linq.Expressions`, but general expression trees neither model banking decision semantics nor represent all modern C# constructs. The canonical model must be deliberately smaller than arbitrary C#, with explicit concepts for decisions, tables, missing data, explanations and source references. Do not serialize, execute, or dynamically compile arbitrary C# expressions in production.

### 6.2 Required node vocabulary

- `PolicyAst`: policy ID, immutable version, title, effective date, AST schema version, decision strategy, ordered nodes and metadata.
- `RuleNode`: stable ID, description, predicate, `OnFail`, `OnUnknown`, source reference.
- `AllNode`, `AnyNode`, `NotNode`.
- `ComparisonNode`: typed canonical fact reference, supported operator, typed constant; optional set membership node.
- `DecisionTableNode`: ID, title, typed input references, `HitPolicy.Unique`, stable row IDs, row predicates, results, no-match outcome and reason mappings.
- `FactReference` / `FactKey<T>`: canonical key, registered type and units.
- `SourceReference`: optional relative repository path and line number; never embed developer machine absolute paths in canonical hashes.
- `ReasonCode`: stable business explanation identifier.

Use C# `record` / `sealed record` / interfaces or discriminated record subclasses with a stable JSON schema. AST nodes are immutable. Keep the schema version separate from the policy business version.

### 6.3 Example AST fragment (illustrative JSON)

```json
{
  "kind": "comparison",
  "fact": "applicant.age",
  "operator": "GTE",
  "constant": { "type": "INTEGER", "value": 18 }
}
```

### 6.4 Compiler / validator responsibilities

- Compile trusted C# policy authoring projects with the .NET SDK, run a policy-artifact generator, then validate the resulting domain AST.
- Reject unknown fact keys, wrong constant/operator types, duplicate IDs, invalid enum values, missing `Otherwise`, unsupported AST schema, invalid references and derived-fact dependency cycles.
- Detect obvious overlapping `UNIQUE` rows statically when possible; always detect multiple matches at evaluation time. Do not promise complete overlap detection for arbitrary predicate combinations in the MVP.
- Discover required fact IDs by traversing **all** rule and table predicates, including all conditional branches. Do not execute rules to discover dependencies.
- Canonicalize artifacts with stable property ordering, sorted unordered maps, preserved rule/row ordering, invariant exact decimal representation, normalized dates and no random build-time values.
- Emit immutable policy JSON, content SHA-256, and an optional separate source-map document.
- Verify identical source/version produces an identical canonical hash across repeated builds.

## 7. Fact catalogue

The fact catalogue is a **C# typed registry**. It is **not another DSL**.

| Fact key | .NET type | Domain meaning | Owner |
|---|---|---|---|
| `applicant.dateOfBirth` | `DateOnly` | Source date of birth | Customer Profile adapter |
| `applicant.age` | `int` | Complete years at fixed assessment `AsOfDate` | Derived calculator |
| `applicant.residencyStatus` | `Residency` enum | VERIFIED / PENDING / INELIGIBLE | KYC adapter |
| `applicant.monthlyIncomeAud` | `decimal` | Verified monthly amount in AUD | Income adapter |
| `applicant.existingDebtAud` | `decimal` | Existing monthly debt payment in AUD | Lending adapter |
| `applicant.debtToIncomeRatio` | `decimal` | Simplified debt/income ratio | Derived calculator |

Each definition records canonical name, data type, domain description, units, enum domain, provenance/freshness rules, source/derivation ownership, input dependencies, and privacy classification. `decimal` must be used for money and ratios, never `double`.

Derived-fact rules for MVP:

- `age = full years between DOB and AsOfDate`, calculated in pure C# using `DateOnly`, with birthday boundary tests.
- `debtToIncomeRatio = existingMonthlyDebtAud / monthlyIncomeAud`, only when income is positive and source periods/currency align. This is a deliberately simplified synthetic demonstration formula.
- A derived result carries provenance references to its input facts and a status when dependencies are missing, stale or invalid.
- Source/derived ownership must be unique or explicitly resolved at startup. Unknown source keys should fail configuration validation.

## 8. Single-phase eager enrichment (required)

### 8.1 Sequence

```text
Request (policy ID/version, synthetic customer ID, AsOfDate, purpose)
    -> authorize assessment and access to required source systems
    -> load approved PolicyAst
    -> traverse AST to collect ALL required fact keys
    -> recursively expand dependencies of derived facts
    -> map source fact keys to registered C# resolver services
    -> execute ONE upfront fetch phase:
         group facts by source, batch shared endpoint reads
         run independent calls concurrently with bounded fan-out
         apply source-level deadlines and safe retry policy
    -> normalize/validate values, verification and freshness
    -> compute derived facts in topological dependency order
    -> create immutable FactSnapshot accounting for required keys
    -> call evaluator ONCE, AFTER enrichment has completed
    -> build decision trace / safe audit record / API response
```

**Scope:** Retrieve only keys required by the selected policy and the transitive source dependencies. All required keys are fetched **even if the first business rule would fail**. A sensitive source must not be called without the required authorization/consent; return an explicit blocked status instead. Do not fetch unrelated profile attributes simply because a source response contains them.

### 8.2 .NET service contracts

The following are API sketches; choose consistent namespaces and make them compile in the implementation.

```csharp
public readonly record struct FactId(string Value);

public sealed record AssessmentContext(
    string CustomerId,
    DateOnly AsOfDate,
    string Purpose,
    string CorrelationId);

public interface ISourceFactResolver
{
    IReadOnlySet<FactId> Provides { get; }

    Task<IReadOnlyDictionary<FactId, FactResolution>> ResolveAsync(
        AssessmentContext context,
        IReadOnlySet<FactId> requested,
        CancellationToken cancellationToken);
}

public interface IDerivedFactCalculator
{
    FactId Output { get; }
    IReadOnlySet<FactId> Dependencies { get; }

    FactResolution Calculate(
        AssessmentContext context,
        FactSnapshot snapshot);
}

public interface IEagerFactEnricher
{
    Task<FactSnapshot> EnrichAsync(
        AssessmentContext context,
        IReadOnlySet<FactId> requiredFacts,
        CancellationToken cancellationToken);
}

public interface IEligibilityEvaluator
{
    EligibilityDecision Evaluate(
        PolicyAst policy,
        FactSnapshot snapshot,
        DateOnly asOfDate);
}
```

`FactResolution` is a closed set of statuses carrying a correctly typed value where `AVAILABLE`, plus safe source/time/provenance/evidence metadata. Use immutable `FactSnapshot` collections. Model generic typed values at fact-authoring boundaries and validate serialized `FactValue` against the catalogue when deserializing snapshots; avoid unchecked `object` casts in the evaluator.

### 8.3 Orchestration sketch

```csharp
public async Task<AssessmentResult> AssessAsync(
    PolicyAst policy,
    AssessmentContext context,
    CancellationToken ct)
{
    var requiredFacts = _factDiscovery.GetRequiredFacts(policy);
    var snapshot = await _factEnricher.EnrichAsync(
        context, requiredFacts, ct);

    var decision = _evaluator.Evaluate(
        policy, snapshot, context.AsOfDate);

    return AssessmentResult.From(policy, snapshot, decision);
}
```

The orchestrator does **not** partially evaluate rules before enrichment, fetch a second round of data, or fetch facts from inside the evaluator.

### 8.4 Resolver behaviour

- Register adapters via DI; no reflection-based discovery of arbitrary methods from policy text.
- A single Customer Profile mock response can supply multiple requested facts (e.g. DOB and a shared attribute) in one call.
- Independent sources may run concurrently with `Task.WhenAll`; use bounded concurrency and an overall deadline, avoiding unlimited fan-out.
- Use `IHttpClientFactory` and typed clients for HTTP integration; no live banking endpoints in MVP.
- Deduplicate repeated AST fact references and per-source calls during one assessment.
- Retry only idempotent-safe retrieval calls within the request deadline. Distinguish cancellation by caller from an upstream timeout.
- Always collect or synthesize an explicit `FactResolution` for every required fact, even when a provider fails.
- Do not introduce distributed caches, staging, queues, sagas, event buses, or another service just for enrichment.

### 8.5 Fact status semantics

| Fact status | Meaning | Decision effect |
|---|---|---|
| `AVAILABLE` | Usable, typed, sufficiently fresh, verified where required | Evaluate comparison |
| `MISSING` | Expected information absent | Business `UNKNOWN` / needs information |
| `STALE` | Evidence outside allowed freshness window | `UNKNOWN` / updated information needed |
| `INVALID` | Input fails validation or cannot be trusted | `UNKNOWN` / corrective action needed |
| `UNAVAILABLE` | Upstream service failure or timeout | `ASSESSMENT_BLOCKED`, not ineligible |
| `NOT_AUTHORIZED` | Purpose, consent or access requirement not met | `ASSESSMENT_BLOCKED`; do not call protected source |

**Important:** A KYC fact may be `AVAILABLE` with enum value `Pending`, which the residency decision table maps to `UNKNOWN`. That is different from the fact itself being `MISSING` or an upstream KYC service being `UNAVAILABLE`.

### 8.6 Immutable snapshot and provenance

Each `FactResolution` includes: `FactId`, status, typed value when available, source/derivation ID, observation/verification timestamps when available, reference time or coverage period, evidence reference, derived-from fact references, and safe diagnostics. A snapshot includes a unique snapshot ID, `AsOfDate`, assessment context identifier, and all required fact IDs.

Illustrative synthetic snapshot:

```json
{
  "snapshotId": "snap-demo-001",
  "asOfDate": "2026-11-11",
  "facts": {
    "applicant.age": {
      "status": "AVAILABLE",
      "type": "INTEGER",
      "value": 25,
      "source": "derived:age",
      "dependsOn": ["applicant.dateOfBirth"]
    },
    "applicant.residencyStatus": {
      "status": "AVAILABLE",
      "type": "RESIDENCY",
      "value": "VERIFIED",
      "source": "mock-kyc",
      "evidenceRef": "synthetic-kyc-123"
    },
    "applicant.monthlyIncomeAud": {
      "status": "STALE",
      "type": "DECIMAL",
      "source": "mock-income",
      "observedAt": "2026-05-01T00:00:00Z"
    }
  }
}
```

Never leak full raw customer API payloads in business review screens or routine logs. For real deployment, a dedicated privacy/retention review is necessary; this MVP stores only synthetic snapshots.

## 9. Deterministic evaluation semantics

### 9.1 Rule results

`PASS`, `FAIL`, `UNKNOWN`, `ERROR`.

The evaluator must account for every mandatory node and return a full trace. It must never call enrichers or read the wall clock. Treat untrusted malformed AST as a controlled technical error, not as a customer failing a rule.

Three-valued logical semantics for business predicates:

- `ALL`: if any child is `FAIL`, return `FAIL`; otherwise if any `UNKNOWN`, return `UNKNOWN`; otherwise `PASS`.
- `ANY`: if any child is `PASS`, return `PASS`; otherwise if any `UNKNOWN`, return `UNKNOWN`; otherwise `FAIL`.
- `NOT`: invert `PASS`/`FAIL`; preserve `UNKNOWN`.

Evaluate all mandatory top-level rules for complete explanations. Pure subexpression optimization is permitted only if it does not change required trace semantics. Use exact `decimal` comparisons and deterministic enum/date normalization.

### 9.2 Overall assessment outcomes

| Outcome | Meaning |
|---|---|
| `ELIGIBLE_FOR_NEXT_STAGE` | All mandatory rules pass (not final credit approval) |
| `INELIGIBLE` | One or more mandatory business rules fail, with no blocking source/technical errors |
| `NEEDS_INFORMATION` | No failure/blocker, but one or more business rules are unknown |
| `ASSESSMENT_BLOCKED` | Required source unavailable, access not permitted, or evaluator/policy technical failure |

**MVP precedence (conservative design choice):** `ASSESSMENT_BLOCKED` > `INELIGIBLE` > `NEEDS_INFORMATION` > `ELIGIBLE_FOR_NEXT_STAGE`. Preserve known business failures in the trace even if the overall result is blocked. This is a configurable future business policy choice, not a universal lending requirement.

### 9.3 Decision table semantics

- `UNIQUE`: zero or one matching row; more than one -> technical policy error / `ASSESSMENT_BLOCKED`.
- Zero matches on fully available inputs -> explicit `Otherwise` outcome.
- Missing/stale/invalid inputs -> `UNKNOWN` conservatively unless the language semantics can prove a definitive outcome without them; MVP may always choose `UNKNOWN` for incomplete table inputs.
- Do not interpret wildcard cells as proof of a match when an input is unavailable.
- Trace records table ID, matched row ID(s), considered inputs, outcome and reason codes.

## 10. Policy artifacts, security and governance

- Trusted policy-authoring C# assemblies are built and executed **only by the policy build tool / CI**. Their output is an approved canonical JSON AST artifact.
- Runtime never accepts C# source text or assemblies uploaded via an API; never load plugins/scripts dynamically from customers.
- Content hash each approved artifact, keep immutable version labels, provenance to Git commit and test results, and source mapping where available.
- Expose only approved versions through the assessment API. Policies are immutable after publication; publish a new version for changes.
- Record trace identifier, policy/version/hash, as-of time, snapshot ID, rule outcomes/reasons and privacy-safe evidence/source identifiers.
- Offline replay uses the **recorded snapshot**, not live upstream calls.
- Gate any real future source integrations on purpose limitation, consent/access control, data-minimisation, authentication, encryption, retention and audit design.
- Clearly label all sample policies and customer data as fictional; this is eligibility *pre-screening*, not responsible-lending compliance or final credit approval.

## 11. REST API contracts (ASP.NET Core 10)

Prefer Minimal APIs with explicit request/response DTOs, cancellation tokens and OpenAPI documentation.

| Endpoint | Purpose |
|---|---|
| `GET /api/policies` | List published policy IDs and versions |
| `GET /api/policies/{id}/versions/{version}` | Read metadata and AST-derived business view |
| `GET /api/policies/{id}/versions/{version}/facts` | Required facts and lineage |
| `POST /api/assessments` | Assess a synthetic customer through full eager enrichment |
| `POST /api/simulations` | Evaluate supplied synthetic snapshot directly, **no enrichment calls** |
| `GET /api/policies/{id}/diff?from=...&to=...` | Domain/semantic diff of approved versions |
| `GET /health` | Demo host health |

Assessment request:

```json
{
  "policyId": "personal-loan",
  "policyVersion": "2026.11",
  "customerId": "synthetic-customer-001",
  "asOfDate": "2026-11-11",
  "purpose": "eligibility-pre-screen"
}
```

Assessment response:

```json
{
  "assessmentId": "assess-demo-001",
  "policy": {
    "id": "personal-loan",
    "version": "2026.11",
    "checksum": "sha256:illustrative"
  },
  "outcome": "NEEDS_INFORMATION",
  "reasonCodes": ["INCOME_NOT_AVAILABLE"],
  "factSnapshotId": "snap-demo-001",
  "rules": [
    {"id": "minimum-age", "result": "PASS"},
    {"id": "residency-status", "result": "PASS", "matchedRowId": "verified"},
    {"id": "minimum-income", "result": "UNKNOWN", "factStatus": "STALE"}
  ],
  "enrichmentSummary": {"requested": 3, "available": 2, "stale": 1},
  "traceId": "trace-demo-001"
}
```

These are sample response shapes. Define JSON enum naming, exact status shapes and problem response codes consistently in code and tests. Do not put raw personal information into generic API responses.

## 12. Blazor business explorer (read-only)

Use **Blazor Web App / Interactive Server**. The UI must show business meaning rather than raw AST serialization by default. Use components to render ordinary tables and custom hierarchical relationships; no Mermaid and no diagram editor. The browser may change view/selection, not mutate policy source.

Required screens:

1. **Policy catalogue / overview:** ID, title, version, effective date, all mandatory rules, overall decision strategy and required facts.
2. **Rule explorer:** nested conditions rendered in business language, reason codes, threshold values, source references.
3. **Decision-table view:** columns/rows, `UNIQUE` policy, otherwise, matched-row highlight for an assessment.
4. **Fact lineage view:** static `rule → fact → source/derived dependencies`, with a separate overlay for facts observed in a selected assessment.
5. **Synthetic scenario runner:** choose a fixture or enter permitted synthetic facts; display outcome, all rule statuses and provenance; distinguish missing information from a source failure.
6. **Semantic diff:** identify changed thresholds, added/deleted rules, changed row conditions/outcomes and reason codes by stable IDs, not by raw JSON line changes.

A policy graph should not imply rules execute sequentially when they are independent and combined declaratively. The visualiser must use the compiled AST, **never independently reimplement eligibility logic**.

## 13. Project layout

Organise as a small multi-project .NET solution. These are logical modules; merge if easier, but keep the dependency directions clear.

```text
BankingEligibility/
  BankingEligibility.sln
  global.json
  Directory.Build.props
  README.md
  src/
    BankingEligibility.Domain/           # typed facts, immutable AST and result contracts
    BankingEligibility.Authoring/        # C# DSL builders, policies built in trusted context
    BankingEligibility.Compiler/         # validator, canonical JSON, hash, CLI/publisher
    BankingEligibility.Enrichment/       # eager orchestrator, resolver interfaces/calculators
    BankingEligibility.Evaluation/       # pure rule evaluator, trace, table semantics
    BankingEligibility.Application/      # assessment use case and orchestration
    BankingEligibility.Web/              # ASP.NET Core 10 APIs + Blazor Web App
    BankingEligibility.SamplePolicies/   # fictional C# policies, versions and scenarios
    BankingEligibility.MockBanking/      # synthetic mock sources and deterministic failures
  tests/
    BankingEligibility.Domain.Tests/
    BankingEligibility.Compiler.Tests/
    BankingEligibility.Enrichment.Tests/
    BankingEligibility.Evaluation.Tests/
    BankingEligibility.Api.Tests/
    BankingEligibility.Web.Tests/
  artifacts/                            # approved canonical sample ASTs (not assemblies)
  fixtures/                             # synthetic customers and replay snapshots
  docs/                                 # architecture, language guide, ADRs, threat model
```

Recommended dependency directions: `Authoring → Domain`, `Compiler → Domain/Authoring`, `Evaluation → Domain`, `Enrichment → Domain`, `Application → Domain/Enrichment/Evaluation`, `Web → Application + read models`, `MockBanking → Enrichment contracts`. No dependency from Domain/Evaluation back into ASP.NET Core or mock sources.

**Do not** require a database, message broker, Kubernetes, Terraform or AWS to run the MVP locally.

## 14. Testing and acceptance criteria

### 14.1 Authoring / AST

- [ ] Two sample C# policy versions compile via `dotnet build` / compiler CLI to schema-versioned canonical JSON artifacts.
- [ ] Repeated builds emit byte-identical canonical policy payloads and matching SHA-256 hashes.
- [ ] Unknown fact, incompatible comparison, duplicate ID, unsupported operator, missing table `Otherwise`, and derived dependency cycle yield actionable diagnostics.
- [ ] Tables remain first-class nodes with stable row IDs; AST serializes/deserializes without loss.
- [ ] Runtime assessment operates on artifact JSON **without executing the authoring C# assemblies**.

### 14.2 Single-phase eager enrichment

- [ ] Static AST traversal discovers all referenced facts, including every table row/branch and transitive derived dependencies.
- [ ] Only required sources are called, **before** any eligibility rules evaluate.
- [ ] An under-age applicant still causes all policy-required source calls, subject to authorization, because MVP has no stages/lazy behavior.
- [ ] Repeated references do not produce duplicate source calls; one source can return multiple facts.
- [ ] Independent sources can run concurrently with bounded fan-out and cancellation.
- [ ] AVAILABLE, MISSING, STALE, INVALID, UNAVAILABLE and NOT_AUTHORIZED are distinct and tested.
- [ ] `DateOnly` age derivation is correct just before, on and after birthdays at fixed as-of dates.
- [ ] One mock source timeout yields `ASSESSMENT_BLOCKED`, not `INELIGIBLE`.
- [ ] A protected source with failed authorization is never called; its fact is `NOT_AUTHORIZED`.
- [ ] Snapshot is immutable and contains an accounted-for result for every required fact.

### 14.3 Evaluation and decisions

- [ ] `ALL`, `ANY`, `NOT` and comparisons implement documented three-valued semantics.
- [ ] All mandatory rules are evaluated for full rule-level explanations; no external data reads occur inside evaluation.
- [ ] UNIQUE table with two matches produces a policy error; no-match uses `Otherwise`; missing input yields conservative UNKNOWN.
- [ ] Money and ratios use exact decimal operations and invariant culture formatting.
- [ ] Replaying the same AST and snapshot with the same `AsOfDate` produces identical business outcome and trace semantics without source calls.
- [ ] Business failures, missing information and upstream technical errors have distinct outcomes and explanations.

### 14.4 API / UI / handoff

- [ ] All required APIs work locally via ASP.NET Core 10.
- [ ] `POST /api/assessments` invokes eager enrichment once; `POST /api/simulations` invokes zero source adapters.
- [ ] Blazor viewer shows policy, first-class decision table, fact lineage, synthetic scenarios, trace, and semantic diff.
- [ ] At least five scenarios can be selected through the UI; outcomes match tests.
- [ ] A fresh clone runs `dotnet restore`, `dotnet build`, `dotnet test`, policy compilation, and `dotnet run` with documented commands and no real credentials.
- [ ] README documents exact dependencies, test output, limitations, screenshots/preview and delivered-versus-deferred features.

### 14.5 Mandatory synthetic scenarios

1. **All pass:** age 25, verified residency, fresh AUD 4,500 monthly income -> `ELIGIBLE_FOR_NEXT_STAGE`.
2. **Age fail:** age 17, other inputs available -> `INELIGIBLE`; other required facts still eagerly fetched.
3. **Missing income:** age 25, verified residency, no income evidence -> `NEEDS_INFORMATION`.
4. **Stale income:** age 25, verified residency, expired income evidence -> `NEEDS_INFORMATION`.
5. **Pending residency:** age 25, status PENDING, valid income -> `NEEDS_INFORMATION`.
6. **Source timeout:** Customer Profile source unavailable -> `ASSESSMENT_BLOCKED`.
7. **No consent / permission:** protected source not called, result `ASSESSMENT_BLOCKED`.
8. **Multiple failures:** under-age plus low income -> `INELIGIBLE` with both reasons when no blocker.
9. **Derived age:** DOB and fixed assessment date correctly handle birthday boundary and leap year case.
10. **Offline replay:** approved JSON AST + saved synthetic snapshot return the same result with zero source calls.
11. **Decision-table ambiguity:** overlapping UNIQUE rows for one complete input -> `ASSESSMENT_BLOCKED`, with diagnostics.
12. **Semantic diff:** policy version increases age threshold from 18 to 21; read model accurately identifies the changed condition.

## 15. Build milestones for ChatGPT Work

**Milestone 1 — Contract and executable tests.** Create solution, Domain AST and typed Fact Catalogue, outcome/status semantics, deterministic serialization and tests.

**Milestone 2 — C# DSL and publishing tool.** Implement ordinary C# policy builder APIs, first-class tables, validation, canonical policy JSON, two versions of sample policy and reproducible hash checks.

**Milestone 3 — Eager enrichment.** Implement DI-registered C# resolvers, synthetic customer/KYC/income/lending adapters, source grouping and bounded concurrent fetching, derived facts, freshness/provenance and immutable snapshot. Test source call counts and consent failures.

**Milestone 4 — Evaluator and API.** Implement pure evaluator, explicit decision aggregation/error precedence, trace and replay; expose Minimal APIs with contract tests.

**Milestone 5 — Blazor business viewer.** Implement all read-only projections and scenario simulation; decision-table row highlighting, fact lineage and semantic policy diff.

**Milestone 6 — End-to-end handoff.** Run all tests, fix failures, document exact local commands, capture screenshots, list implemented and deferred work. Prioritise a complete vertical slice over extra abstraction layers.

**Only after MVP:** optional Roslyn analyzers / code fixes, domain-aware LSP services, MCP tools, more elaborate graph visualisations, advanced policy impact analysis, additional hit policies, authentication, managed artifact registry, production source adapters and governance integrations.

## 16. Direct implementation instruction for ChatGPT Work

> Implement a **runnable, fully .NET 10/C# 14 MVP** of this specification. Use C# policy authoring via typed internal DSL builder methods, immutable domain AST, canonical JSON artifacts produced by trusted builds, a typed C# fact catalogue, **single-phase eager enrichment** from synthetic mock banking sources, an immutable fact snapshot, a pure deterministic C# eligibility evaluator, ASP.NET Core 10 Minimal APIs, and a **read-only Blazor Web App** for business visualisation. Deliver first-class decision tables, scenario simulation, a complete evaluation trace, fact lineage and semantic version diffs. **Do not** use Groovy, Kotlin, a JVM, React, Mermaid, DMN, GUI policy editing, an enrichment DSL, lazy loading or staged enrichment. Do not require actual customer data or AWS credentials. Implement and run the 12 required synthetic scenarios, and report exact build/test commands and outcomes. The initial implementation must work end to end rather than stopping at scaffolding. Any deviations should be documented with rationale.

## 17. Technical references

- .NET 10 lifecycle: https://learn.microsoft.com/en-us/dotnet/core/releases-and-support
- C# 14: https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14
- C# expression tree capabilities and limitations: https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/expression-trees/
- Blazor render modes (.NET 10): https://learn.microsoft.com/en-us/aspnet/core/blazor/components/render-modes?view=aspnetcore-10.0
- Typed `HttpClient` and `IHttpClientFactory`: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-requests?view=aspnetcore-10.0
- Minimal APIs: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview?view=aspnetcore-10.0
- ASP.NET Core integration testing: https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0
- Language Server Protocol (future): https://microsoft.github.io/language-server-protocol/
- Model Context Protocol (future): https://modelcontextprotocol.io/specification/

---

**MVP success statement:** An engineer changes a C# policy, runs tests and publishes canonical AST JSON. The .NET 10 API discovers the AST's fact dependencies, eagerly enriches a synthetic customer in one phase, evaluates an immutable snapshot and serves a complete explainable result. A business reviewer sees the same rules and decision tables in a read-only Blazor interface, runs synthetic scenarios and compares approved versions—without editing the source or involving a second rules engine.
