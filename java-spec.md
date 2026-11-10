# Banking Eligibility Platform — Groovy DSL, Eager Fact Enrichment & Business Visualisation

**Specification:** v0.2 (supersedes v0.1)  
**Status:** Proposed implementation-ready MVP specification  
**Date:** 11 November 2026  
**Audience:** ChatGPT Work, software engineers, architects, business policy reviewers  
**Working name:** Eligibility Policy as Code

> **Product definition:** Engineers author banking-product eligibility policies using a Groovy internal DSL. Trusted compilation produces a versioned, immutable **domain AST**. The service discovers all facts required by the policy, obtains them through **single-phase eager enrichment implemented in ordinary Kotlin services**, constructs an immutable fact snapshot, and runs a **pure deterministic evaluator**. A custom, **read-only** business UI presents the policy, decision tables, results, provenance, and version differences from the same AST.

## 1. Decisions agreed and locked for the MVP

1. **Groovy, not C#, for the authoring DSL.** The evaluator, enrichment service and API are JVM components, preferably Kotlin.
2. **Engineers author policies in code; business stakeholders read/review generated visualisations.** No GUI policy editor.
3. **Mermaid philosophy, not Mermaid technology:** text/code is authoritative and business views are generated. Do not use Mermaid as the product renderer.
4. **One semantic contract:** authoring DSL compiles to an immutable, serializable, validated *domain AST*, used by the evaluator, visualiser, semantic diff and future tooling. Do not interpret arbitrary Groovy at runtime.
5. **Decision tables are first-class AST nodes.** Start with ordinary Groovy named-argument/row DSL syntax. A Spock-like pipe table is a later experiment, not an MVP dependency.
6. **Single-phase eager enrichment:** discover the complete set of facts required by the selected policy; fetch required source data **before evaluation**, with independent calls concurrent where safe; compute derived facts; build a snapshot; then evaluate. There is **no lazy fact lookup, short-circuit-driven fetching or staged enrichment** in the MVP.
7. **No enrichment DSL.** Fact registration, HTTP integration, derivations, freshness and access policies are implemented through normal Kotlin interfaces, types and services.
8. **A pure evaluation boundary:** no HTTP/database calls, clock access, mutable caches or customer lookup from inside the evaluator.
9. **Synthetic data only for MVP.** Use mock/in-memory customer, KYC, income and financial-source adapters. Do not connect to a real credit bureau or bank system.
10. **LSP/MCP are future extensions.** Reuse Groovy editor tooling and implement the shared domain service first.

## 2. Background and motivation

Most commercial rules products emphasise creating decision diagrams and tables in a GUI. This product takes the opposite approach: **code-first authoring** for engineers, **visual-first comprehension** for business reviewers. The DSL should be readable, refactorable, testable and version controlled. The AST must express real business meaning: typed facts, predicates, reason codes, uncertainty, decision-table hit policies and immutable policy identities.

Enrichment is deliberately separate. A policy asks for `applicant.age` or `applicant.monthlyIncome`; it does not know the Customer API endpoint, database table, OAuth token or retry policy used to supply those facts.

**Why eager?** It keeps the evaluator synchronous and pure, makes provenance and complete rule traces easier to explain, and avoids request-scoped lazy resolution state. Eager does **not** mean fetch all available customer attributes: fetch only the facts needed by the AST and their source dependencies.

## 3. Users and end-to-end flows

**Engineer / policy author**
- Writes Groovy source in Git; runs a compile/validate/test command.
- Reviews typed diagnostics and generated canonical policy AST.
- Adds synthetic scenario tests, opens PR and obtains reviews before publication.

**Business reviewer**
- Opens a read-only policy explorer; sees plain-language rules and decision tables derived from the AST.
- Compares two versions and simulates synthetic applicant scenarios.
- Inspects which fact sources and derived values explain a decision.

**Eligibility API caller**
- Requests assessment for a synthetic customer and an approved policy version.
- Service authorises the request, fetches all required facts, evaluates an immutable snapshot and returns a decision with reasons/trace.

**Operator / auditor**
- Can identify policy/version/hash, fact snapshot provenance, resolver outcomes, timing and per-rule results. Normal application logs are redacted.

## 4. In-scope deliverables and non-goals

### Must deliver in MVP

- Working Groovy policy DSL: named rules, logical groups, typed fact references, comparisons, decisions/reason codes and first-class decision tables.
- Domain AST with stable node IDs, source references, artifact serialization and schema version.
- Compile-time/domain validation: unknown facts, wrong types, duplicate IDs, invalid table hit policies/ambiguous matches.
- **Fact Catalogue** and eager enrichment orchestrator implemented in Kotlin (or Java when justified).
- Fake Customer Profile, KYC, Income and Lending adapters with synthetic fixtures and controllable failures.
- Derived facts, including age from DOB and `asOf` date; preserve provenance and missing/error states.
- One immutable `FactSnapshot` per assessment, containing a result for each fact requested by the policy.
- Deterministic evaluator and decision trace, including complete rule evaluation after enrichment.
- REST endpoints for policy inspection, assessment, synthetic simulation and semantic diff.
- Read-only React/TypeScript web explorer with rule/table views, synthetic simulation, result trace, fact-source detail and version diff.
- Automated tests of DSL, AST, enrichment, evaluation, API and UI; reproducible local build and documented commands.

### Explicitly out of scope

- Lazy enrichment, stage-gated enrichment, on-demand fact loading from rule evaluation.
- Any DSL for enrichment mappings, APIs or orchestration.
- Production customer data, real banking connectors or credit-bureau calls.
- Business-authored GUI rule editing, bidirectional diagram-to-code transformations, Mermaid rendering.
- Runtime execution of uploaded Groovy source, arbitrary scripts submitted over APIs.
- Custom Groovy compiler transformation for Spock pipe syntax, a bespoke LSP, MCP server, LLM rule-writing workflow.
- Production lending decisioning or claiming regulatory compliance.
- Distributed workflow engine, message bus, microservice decomposition, persistent customer PII storage, sophisticated multi-tenancy or real approvals portal.

## 5. System context and boundaries

```text
             Engineer-written Groovy DSL (Git)
                           |
                  Trusted build/compile
                           v
                  Validated Domain AST
                 (versioned JSON artifact)
                           |
              +------------+-------------+
              |                          |
              v                          v
       Policy Explorer              Assessment API
        (read-only)                       |
                                  Authorise request
                                         |
                                  Discover all facts
                                         |
                            Eager Enrichment Orchestrator
                              /        |         \
                     Customer API   KYC API   Income/Lending APIs
                       (mock)       (mock)       (mock)
                              \        |         /
                               Normalise and derive
                                         |
                                Immutable FactSnapshot
                                         |
                              Pure Eligibility Evaluator
                                         |
                          Decision + rule trace + provenance
                                         |
                           API response and protected audit
```

**Boundaries:**
- Policy compiler/builders: trusted authoring-time Groovy, emitting domain objects.
- Fact Catalogue: metadata and typed keys identifying available fact semantics and source/derivation.
- Enrichment: I/O, authentication/authorisation checks, remote API adaptation, provenance, freshness and facts.
- Evaluator: no I/O and no dependency on enrichment implementations. It receives a complete snapshot whose entries may be available or unavailable.
- Presenter: read-only projections of AST and evaluation output; never a second policy interpreter.

## 6. Technology baseline

- **Groovy** for internal authoring DSL; **Spock** for policy scenario tests where useful.
- **Kotlin/JVM** for domain AST, validator, fact catalogue, enrichment interfaces, orchestration and evaluator. Java is an acceptable alternative where simpler.
- **Gradle** for trusted policy compilation, artifact generation and tests.
- **Spring Boot / Spring Web** for a straightforward REST API; Kotlin coroutines or structured Java concurrency for parallel enrichment.
- **React + TypeScript** for the custom read-only policy explorer. May use a generic graph library, but **not Mermaid**.
- **JSON** for canonical compiled AST and API payloads; local checked-in fixtures/artifacts for MVP (database optional, not required).
- **JUnit / Spock / MockWebServer or WireMock** for testing, as appropriate.
- Pin compatible stable dependency versions at implementation time; report versions used rather than inventing them here.

## 7. Groovy DSL language design

### 7.1 Intended authoring example

```groovy
eligibility('personal-loan') {
    version '2026.11'
    title 'Personal Loan — Initial Eligibility'

    rule('minimum-age') {
        description 'Applicant must be at least 18'
        compare 'applicant.age', GTE, 18
        onFail 'UNDER_MINIMUM_AGE'
        onUnknown 'AGE_NOT_AVAILABLE'
    }

    decisionTable('residency-status', hitPolicy: UNIQUE) {
        input 'applicant.residencyStatus'
        row when: eq('VERIFIED'),   result: PASS
        row when: eq('PENDING'),    result: UNKNOWN
        row when: eq('INELIGIBLE'), result: FAIL
        otherwise UNKNOWN
        onFail 'RESIDENCY_NOT_ELIGIBLE'
        onUnknown 'RESIDENCY_NOT_VERIFIED'
    }

    rule('income-threshold') {
        description 'Verified monthly income must be at least AUD 3,000'
        compare 'applicant.monthlyIncomeAud', GTE, decimal('3000.00')
        onFail 'INCOME_BELOW_THRESHOLD'
        onUnknown 'INCOME_UNAVAILABLE'
    }

    decisionStrategy ALL_MANDATORY
}
```

This is **design-target Groovy DSL syntax**, not a claim of an existing library. Implement the example so that it compiles under the chosen DSL library. Thresholds are hypothetical sample rules, not banking advice or legal requirements.

Avoid relying on Groovy's native `>=` or `&&` to automatically construct AST nodes. They normally perform evaluation. Begin with explicit `compare`, `all`, `any`, `eq`, `gte` and similar builder methods.

### 7.2 Decision tables

Preserve a first-class `DecisionTableNode`, with:
- stable table ID and title; typed input columns; rows with stable IDs and cell predicates;
- explicit result and hit policy; `otherwise`/no-match semantics; source file/line;
- matched row ID(s), input values and explanation generated during evaluation.

MVP supports **UNIQUE**: at most one matching row for complete, usable input; multiple matches cause a **policy evaluation error**, never silently pick a row. No match yields the declared `otherwise` result. When an input required to determine the match is unavailable, the result is UNKNOWN unless a definitive outcome can be established under the documented three-valued semantics; default MVP implementation may choose UNKNOWN conservatively.

Use ordinary Groovy named arguments or `row(...)` syntax. Spock's `|`-style tables are compiler-supported Spock test syntax and **do not work as general Groovy literals automatically**.

### 7.3 Model vocabulary

`Policy`, `PolicyVersion`, `Rule`, `All`, `Any`, `Not`, `Comparison`, `FactReference<T>`, `DecisionTable`, `TableRow`, `HitPolicy`, `RuleOutcome`, `ReasonCode`, `SourceLocation`, `DependencyReference`.

Initial fact types: String, Boolean (when unambiguous), Integer, Decimal (exact), Date, Enum and Money (amount/currency or fixed AUD amount with documented units). Use `BigDecimal` for amounts and ratios. Do not represent financial values as binary floating-point.

Policy AST IDs and table-row IDs are stable independent of display titles. The AST schema version is independent of a business policy's version.

## 8. Fact Catalogue — domain meaning, not data access DSL

The Fact Catalogue is a **typed registry in Kotlin**, e.g.:

| Canonical fact | Type | Meaning | Source / derivation |
|---|---|---|---|
| `applicant.dateOfBirth` | Date | Verified or supplied date of birth | Customer Profile adapter |
| `applicant.age` | Integer | Age in complete years on assessment `asOf` date | Derived from date of birth |
| `applicant.residencyStatus` | Enum | `VERIFIED`, `PENDING`, `INELIGIBLE` | KYC adapter |
| `applicant.monthlyIncomeAud` | Decimal | Verified monthly income in AUD | Income adapter |
| `applicant.existingMonthlyDebtAud` | Decimal | Monthly debt payment amount in AUD | Lending adapter |
| `applicant.debtToIncomeRatio` | Decimal | Existing monthly debt divided by monthly income, per defined formula | Derived from debt and income |

The catalogue defines: key, business description, type, units, enum values, source/derived status, required dependencies, freshness/verification policy and privacy classification.

**Derived-fact semantics:**
- `age` uses DOB and the explicit `asOf` date, not wall-clock `LocalDate.now()` in the evaluator.
- Debt-to-income derivation is only valid with comparable time periods, a nonzero income denominator and agreed treatment of currency, joint debts, and debt obligations. For MVP use a documented simplified formula and synthetic values.
- Derived facts receive provenance linking to inputs; failure to obtain valid dependencies results in a non-AVAILABLE result with diagnostic detail.

The catalogue should be defined with ordinary interfaces/registrations and reusable functions; **do not invent DSL syntax for fact sources or derivations**.

## 9. Eager Enrichment Service — required MVP design

### 9.1 Contract and sequence

```text
Assessment request
  -> validate/authorise request and policy version
  -> inspect compiled AST: required fact keys
  -> expand dependencies for derived facts (transitive closure)
  -> map source facts to registered Kotlin resolvers
  -> make all required source calls in ONE enrichment phase
       - independent source calls can run concurrently
       - one source response may satisfy several fact keys
  -> normalise/validate source data and apply freshness rules
  -> compute derived facts topologically
  -> build immutable FactSnapshot with every requested fact accounted for
  -> call pure evaluator ONCE using that snapshot
  -> persist/return decision trace and safe evidence references
```

**No eligibility-rule evaluation occurs before enrichment completes.** There is no phase 2 triggered by intermediate outcomes and no fact fetch from inside a predicate. Conditional branches in the policy do not control whether enrichment happens; static fact discovery takes the union of facts potentially referenced in the AST.

**Eager scope restriction:** only the selected policy's fact keys and their transitive source dependencies are fetched. Do not query unrelated accounts or credit-bureau sources.

### 9.2 Kotlin interfaces (illustrative)

```kotlin
@JvmInline value class FactKey(val value: String)

data class AssessmentContext(
    val customerId: String,
    val asOf: LocalDate,
    val correlationId: String,
    val purpose: String
)

interface SourceFactResolver {
    val provides: Set<FactKey>
    suspend fun fetch(
        context: AssessmentContext,
        required: Set<FactKey>
    ): Map<FactKey, FactResult>
}

interface DerivedFactCalculator {
    val output: FactKey
    val dependencies: Set<FactKey>
    fun derive(
        context: AssessmentContext,
        availableFacts: FactSnapshot
    ): FactResult
}

interface EnrichmentService {
    suspend fun enrich(
        context: AssessmentContext,
        requiredFacts: Set<FactKey>
    ): FactSnapshot
}
```

`FactResult` should be a Kotlin sealed hierarchy carrying typed values and provenance; `FactSnapshot` is immutable and read-only. This code is an illustrative interface sketch, not a fully compilable implementation.

Orchestrator sketch:

```kotlin
suspend fun assess(
    policy: CompiledPolicy,
    context: AssessmentContext
): AssessmentResult {
    val requiredFacts = policy.requiredFacts() // computed from the AST
    val snapshot = enrichmentService.enrich(context, requiredFacts)
    val decision = evaluator.evaluate(policy, snapshot, context.asOf)
    return AssessmentResult(decision, snapshot.safeSummary())
}
```

### 9.3 Source resolution, batching and concurrency

- Register resolvers explicitly through dependency injection; do not locate them dynamically by interpolating method names or executing DSL code.
- Resolve all direct source dependencies in **one phase**, grouping facts by upstream service. Example: one Customer Profile response may supply DOB and contact attributes.
- Run independent adapters concurrently with a bounded concurrency limit and an overall assessment deadline. No unlimited fan-out.
- Validate that each requested fact has exactly one authorised source/derivation or an explicit resolution rule. Reject ambiguous ownership during startup/compilation.
- Deduplicate repeated fact references and repeated source calls *within one assessment*. No distributed cache required for MVP.
- The orchestrator owns timeout, cancellation and safe retry policy; retry only operations safe to retry and only within deadline. Mock adapters should support simulated timeouts and errors.
- A mock HTTP adapter should demonstrate a single remote request returning two facts, plus two independent adapters being called concurrently.

### 9.4 FactResult status semantics

| Status | Meaning | Evaluator treatment |
|---|---|---|
| `AVAILABLE` | Value passes required type/verification/freshness checks | Compare against policy condition |
| `MISSING` | Expected data not supplied or absent | UNKNOWN with missing-information reason |
| `STALE` | Value exists but not fresh enough | UNKNOWN / needs refreshed evidence |
| `INVALID` | Value cannot be trusted, parsed or verified | UNKNOWN / needs correction |
| `UNAVAILABLE` | Upstream service failed or timed out | **technical assessment block**, not a business FAIL |
| `NOT_AUTHORIZED` | Permitted purpose/consent/access condition not met | **assessment block**, not silently treated as ineligibility |

A pending KYC state may be a legitimate **AVAILABLE enum value** (`PENDING`) that the policy interprets as UNKNOWN; it is different from missing the KYC fact altogether.

Never map a timeout, permission denial or unknown fact to `INELIGIBLE` merely because it was not `true`.

### 9.5 Snapshot and provenance

Each fact in the immutable snapshot has its canonical key, status, typed value if available, source identifier, observed timestamp, verification timestamp where applicable, `asOf` or coverage period, evidence reference, derivation/input references, and safe diagnostics. A snapshot has a unique ID, assessment time and set of required fact IDs.

Example (fictional, redacted):

```json
{
  "snapshotId": "snap-demo-001",
  "asOf": "2026-11-11",
  "facts": {
    "applicant.age": {
      "status": "AVAILABLE",
      "type": "INTEGER",
      "value": 25,
      "source": "derived:age-at-assessment",
      "dependsOn": ["applicant.dateOfBirth"]
    },
    "applicant.residencyStatus": {
      "status": "AVAILABLE",
      "type": "RESIDENCY_STATUS",
      "value": "VERIFIED",
      "source": "kyc-mock",
      "evidenceRef": "ev-synthetic-123"
    },
    "applicant.monthlyIncomeAud": {
      "status": "STALE",
      "type": "DECIMAL",
      "source": "income-mock",
      "observedAt": "2026-05-01T00:00:00Z"
    }
  }
}
```

The example omits actual PII; in production, fact snapshots and evidence references require access control, retention controls and encryption. Avoid full raw customer responses in standard application logs or the business viewer.

### 9.6 Access controls and consent

Authorise assessments and check source-specific permitted purpose/consent **before fetching** sensitive information. Do not perform live credit enquiries in the MVP. Missing consent must result in an explicit block or action-required result, not an implicit attempt or a fictitious negative credit score. Apply data minimisation, source-level authorization and privacy-safe error handling.

## 10. Evaluation semantics and error precedence

The evaluator consumes `CompiledPolicy`, `FactSnapshot`, and a fixed `asOf` value, and returns a value object. It never calls enrichment services.

Rule results: `PASS`, `FAIL`, `UNKNOWN`, plus `ERROR` for malformed policy/evaluator failures. The UI must not display `SKIPPED` as `PASS` (eager enrichment does not imply that rules may be skipped; MVP evaluates all mandatory rules to provide full reasons).

MVP overall states:
- `ELIGIBLE_FOR_NEXT_STAGE`: all mandatory rules PASS.
- `INELIGIBLE`: one or more mandatory rules FAIL, and no blocking technical/authorisation error prevents a trustworthy assessment.
- `NEEDS_INFORMATION`: no blocking technical error, no FAIL, but some rules UNKNOWN due to missing/stale/invalid information or business-pending status.
- `ASSESSMENT_BLOCKED`: a required fact has `UNAVAILABLE`/`NOT_AUTHORIZED`, or the engine hits a technical evaluation failure. Do not present as an eligibility rejection. This conservative priority wins over other provisional results; the trace can still include known failures.

**Explicit decision precedence for MVP:** `ASSESSMENT_BLOCKED` > `INELIGIBLE` > `NEEDS_INFORMATION` > `ELIGIBLE_FOR_NEXT_STAGE`. This is a *prototype design choice* to document and test, not a universal banking decision policy. A blocking upstream status should appear as an assessment outcome, not as a manufactured customer fact.

Logical predicates use three-valued semantics for business outcomes:
- `ALL`: any FAIL => FAIL; else any UNKNOWN => UNKNOWN; else PASS.
- `ANY`: any PASS => PASS; else any UNKNOWN => UNKNOWN; else FAIL.
- `NOT`: UNKNOWN stays UNKNOWN.

All required facts are enriched upfront; evaluate all mandatory rules for a complete business explanation rather than doing network-driven short-circuiting. The engine may optimise pure expressions only if no result/explanation information is lost.

Table matching is deterministic. `UNIQUE` multiple matches produce an explicit policy error; an absent usable input should not accidentally match an `any()` cell as if the value were known. Record row matches, unmatched cases and reason codes.

## 11. API design

Required endpoints (names can be refined but retain separation):

| Endpoint | Purpose |
|---|---|
| `GET /api/policies` | List policy IDs and published versions |
| `GET /api/policies/{id}/versions/{version}` | Get metadata and AST-derived read model |
| `POST /api/assessments` | Request assessment for a **synthetic** customer; invokes eager enrichment |
| `POST /api/simulations` | Evaluate an explicitly supplied synthetic fact snapshot **without** calling enrichment |
| `GET /api/policies/{id}/diff?from=x&to=y` | Semantic diff of policy versions |
| `GET /health` | Basic readiness/liveness for demo |

Assessment request example:

```json
{
  "policyId": "personal-loan",
  "policyVersion": "2026.11",
  "customerId": "synthetic-customer-001",
  "asOf": "2026-11-11",
  "purpose": "eligibility-pre-screen"
}
```

Assessment response example:

```json
{
  "assessmentId": "assess-demo-001",
  "policy": {"id": "personal-loan", "version": "2026.11", "checksum": "sha256:example"},
  "outcome": "NEEDS_INFORMATION",
  "reasonCodes": ["INCOME_UNAVAILABLE"],
  "factSnapshotId": "snap-demo-001",
  "rules": [
    {"id": "minimum-age", "result": "PASS"},
    {"id": "residency-status", "result": "PASS", "matchedRowId": "verified"},
    {"id": "income-threshold", "result": "UNKNOWN", "factStatus": "STALE"}
  ],
  "enrichmentSummary": {"requested": 3, "resolved": 2, "stale": 1},
  "traceId": "trace-demo-001"
}
```

These payloads are illustrative contracts, not an existing deployed API. Keep real customer attributes out of broad response bodies by default. Authentication/authorization can be simulated for local demo but must be documented as non-production.

## 12. Business visualisation (generated, read-only)

The application must render its own UI/view models from the immutable AST and evaluation traces; **no Mermaid, no visual policy editor**.

Minimum views:

1. **Policy overview:** id/version/title, effective date, description, required fact list and decision strategy.
2. **Rule explorer:** readable predicates, nested groups, thresholds, reason codes and source code references.
3. **Decision-table viewer:** first-class rows/columns, UNIQUE hit policy, default behaviour, match highlights.
4. **Dependency/lineage viewer:** `rule -> fact -> source/derivation`; distinguish *static potential dependencies* from *data actually obtained for a specific assessment*.
5. **Scenario simulation:** synthetic applicant selection, outcome, full per-rule trace and fact status/provenance.
6. **Semantic diff:** rule/table/threshold/reason-code differences between approved versions by stable IDs.

A visual flowchart must not falsely imply sequential evaluation when rules are conceptually parallel. The UI should explain `UNKNOWN` vs `ASSESSMENT_BLOCKED`, and redact sensitive fact values by default.

## 13. Policy artifacts, determinism and governance

- Compile trusted engineer-written Groovy in CI/build tooling to a canonical JSON AST.
- Validate facts, types, rule identities, row overlaps, references and decision semantics before publication.
- Store immutable policy versions, AST/schema version and SHA-256 checksum with source map and test evidence.
- Runtime loads only approved compiled artifacts; **never accept or execute untrusted Groovy source** from API requests.
- Assessment trace records policy version/hash, snapshot ID, `asOf`, resolver statuses, result, reason codes and source/evidence IDs. Avoid unnecessary PII duplication.
- Replay uses the **recorded snapshot** rather than recontacting upstream services; this is a key reason to freeze enriched facts before evaluating.
- Groovy AST customisation alone is not a secure sandbox; use trusted build and executable/runtime separation.
- This prototype is for product **pre-screening**, not final credit approval or a substitute for lending compliance obligations.

## 14. Repository structure

```text
eligibility-platform/
  README.md
  settings.gradle.kts
  domain-model/                # immutable Kotlin AST, typed facts, snapshot/result schema
  policy-dsl/                  # Groovy source DSL/builder, compiler
  policy-validator/            # semantic validation, diagnostics
  policy-engine/               # pure deterministic evaluator
  fact-catalogue/              # typed fact keys, metadata, derivation dependencies
  fact-enrichment/             # eager orchestrator, resolver contracts, derived fact calculators
  policy-service/              # Spring REST API, orchestration and artifact loading
  policy-cli/                  # compile, validate, evaluate, diff utilities
  policy-samples/              # fictional Groovy policy versions
  policy-tests/                # Spock/JUnit rules and scenario tests
  mock-banking/                # synthetic fixtures, mock clients or mock HTTP server
  web/                         # React TypeScript read-only business UI
  artifacts/                   # example canonical compiled policy JSON
  docs/                        # architecture, ADRs, diagrams, security notes, screenshots
```

Merge modules where excessive build granularity would slow the MVP. Keep interfaces and unit-test boundaries, not necessarily separate deployed services. An embedded library for enrichment is acceptable and **preferred over making another microservice solely for the MVP**.

## 15. Acceptance criteria and required tests

### DSL, compiler, semantic AST

- [ ] Two versioned sample Groovy policies compile to canonical AST artifacts.
- [ ] Multiple identical builds produce identical canonical artifact hashes.
- [ ] Unknown fact, wrong type, duplicate ID, missing decision-table `otherwise`, and ambiguous `UNIQUE` rows yield actionable diagnostics or deterministic evaluation errors.
- [ ] Table remains a first-class AST node with stable row IDs and source mapping.

### Eager enrichment

- [ ] Given a policy, `requiredFacts()` returns all directly referenced facts; dependency expansion includes transitive inputs of derived facts.
- [ ] The orchestrator fetches only those source facts in one upfront phase, **even if an early business rule would fail**.
- [ ] Source calls to independent mock APIs can run concurrently; one source request may provide more than one fact.
- [ ] Each source fact is fetched no more than necessary during one assessment; repeated references don't duplicate requests.
- [ ] `AVAILABLE`, `MISSING`, `STALE`, `INVALID`, `UNAVAILABLE` and `NOT_AUTHORIZED` are distinguishable and covered by tests.
- [ ] Derived age is correct around birthdays for a fixed `asOf`; dependency cycles are rejected.
- [ ] If a mock Customer API times out, the resulting assessment is `ASSESSMENT_BLOCKED`, not `INELIGIBLE`.
- [ ] With a missing income fact, assessment is `NEEDS_INFORMATION` when all other mandatory rules pass.
- [ ] A user lacking permission/consent for a protected source never triggers that source's fetch.
- [ ] The evaluator is invoked **only after** enrichment completes and never invokes a source resolver.
- [ ] Eager enrichment doesn't include unrelated/unused customer attributes in the snapshot.

### Decision correctness and replay

- [ ] Test all-pass, one-fail, multiple-fail, UNKNOWN, technical failure, pending KYC, no-match table and overlapping table rows.
- [ ] Exact decimal comparisons behave as documented.
- [ ] The engine evaluates all mandatory rules and returns full explanations with reason codes.
- [ ] Re-evaluating the same AST, snapshot and as-of context gives the same semantic result without external calls.
- [ ] Recorded snapshots support offline replay with the same result.

### REST API, UI and developer experience

- [ ] `POST /api/assessments` resolves from synthetic customer adapters and returns a trace, snapshot summary and clear outcome.
- [ ] `POST /api/simulations` uses only supplied synthetic facts, without any enrichment API calls.
- [ ] UI renders a policy, a decision table, fact lineage and the outcome of at least five fixture scenarios.
- [ ] Business reviewer can distinguish business rule failure from incomplete data and source outage.
- [ ] UI compares two versions showing a threshold or table-row change.
- [ ] A new engineer can clone, build, test and run the API/UI locally without AWS, Kubernetes or live banking access.

### Required synthetic scenarios

1. **All pass:** age 25, verified KYC, fresh income 4,500 AUD -> `ELIGIBLE_FOR_NEXT_STAGE`.
2. **Definitive business fail:** age 17, other data available -> `INELIGIBLE`; all facts are nevertheless enriched upfront.
3. **Missing income:** age 25, verified KYC, income absent -> `NEEDS_INFORMATION`.
4. **Stale income:** age 25, verified KYC, income beyond validity window -> `NEEDS_INFORMATION`.
5. **KYC pending:** age 25, status PENDING, fresh income -> `NEEDS_INFORMATION`.
6. **Source unavailable:** Customer mock times out -> `ASSESSMENT_BLOCKED`.
7. **Unauthorised data source:** consent/purpose check fails -> `ASSESSMENT_BLOCKED`, mock external call count is zero for protected source.
8. **Multiple business failures:** age 17 and low income -> `INELIGIBLE` with both reasons if no blocking failures.
9. **Derived fact:** DOB and `asOf` correctly produce age at birthday boundary.
10. **Replay:** same stored AST + snapshot -> identical result with zero source calls.

## 16. Build plan for ChatGPT Work

**Milestone 1 — Contract first.** Define domain AST, fact keys/types, snapshot status model, decision semantics, serialization and test cases. Document trade-offs.

**Milestone 2 — Groovy DSL/compiler.** Implement builder methods producing AST, first-class decision tables, validation and two policy versions. Keep Groovy execution limited to the trusted build.

**Milestone 3 — Enrichment.** Implement fact catalogue, single-phase eager orchestrator, mock customer/KYC/income/lending adapters, derived calculators, concurrency, deadline handling and synthetic fixtures. Test call counts and error semantics.

**Milestone 4 — Pure evaluator and API.** Implement evaluator over immutable snapshot; assessment/simulation REST routes, traces and offline replay.

**Milestone 5 — Business explorer.** Implement read-only visual views, table rendering, dependency and provenance projections, simulation and semantic policy diff.

**Milestone 6 — Verification and handoff.** Execute builds/tests, fix failures, capture representative screenshots, document local commands, list completed vs deferred items. Do not stop after scaffolding.

Stretch goals only after a working vertical slice: Spock-like pipe-table authoring feasibility, domain diagnostics/LSP, read-only MCP tools, persistent policy registry, advanced overlap analysis.

## 17. Work execution instruction (copy with this spec)

> Build a runnable MVP repository implementing this specification. Use **Groovy for policy authoring**, **Kotlin/JVM for the domain, eager enrichment and pure evaluator**, **Spring Boot for the API**, and **React/TypeScript for the read-only business UI**. The key vertical slice must work end to end: Groovy source -> validated canonical policy AST -> policy-required fact discovery -> **single-phase eager enrichment from synthetic mock banking sources** -> immutable fact snapshot -> deterministic evaluation -> API -> read-only business visualisation. **Do not** build lazy or staged enrichment, an enrichment DSL, GUI policy authoring, or Mermaid rendering. Implement and run tests for the ten specified synthetic scenarios and report exact commands and outcomes. If a nonessential technology choice must change, document why. Prioritise a working, tested demonstration over speculative framework design. Do not use production customer data, live banking systems or credit bureaus.

## 18. Background technical references

- Groovy DSL mechanisms: https://groovy-lang.org/dsls.html
- Spock table syntax (test framework, not general-purpose Groovy literals): https://spockframework.org/spock/docs/current/data_driven_testing.html
- Groovy threat model: https://github.com/apache/groovy/blob/master/THREAT_MODEL.md
- Kotlin coroutine concepts: https://kotlinlang.org/docs/coroutines-overview.html
- Language Server Protocol (future): https://microsoft.github.io/language-server-protocol/
- Model Context Protocol (future): https://modelcontextprotocol.io/specification/

---

**MVP principle:** One policy language, one domain model, one upfront enrichment phase, one immutable snapshot, one deterministic evaluator, many read-only business views.
