Implement a working MVP of the **Banking Eligibility Engine** described in the attached `banking_eligibility_dsl_spec.md`.

Follow the proposed architecture, especially these principles:

- Engineers author policies using an internal Groovy DSL.
- The DSL produces a typed, serializable domain AST.
- The AST is the shared contract for evaluation, validation, visualisation and analysis.
- Business users review generated visualisations, not a GUI rule editor.
- Decision tables are first-class constructs.
- Runtime eligibility evaluation must be deterministic, explainable and independent of arbitrary Groovy execution.

**Implementation priorities**

1. Build the domain model, validator and evaluator.
2. Implement the Groovy DSL, including decision tables.
3. Create two example policies with automated tests.
4. Build a REST API and a read-only business visualisation interface.
5. Implement scenario simulation and policy-version comparison.
6. Document the design and provide instructions for running the complete application locally.

Use Kotlin for the core model and engine, Groovy for the DSL, and React/TypeScript for the interface, unless a clearly justified alternative is simpler.

Treat LSP, MCP and custom Spock-style table syntax as future extensions. Design for them, but don't let them delay the working MVP.

Use synthetic data only. Do not integrate live banking systems.

**Expected deliverables:** A runnable repository, automated tests, example policies, a working browser-based demonstration, architecture documentation, and a README.

Prioritise a complete, working vertical slice over scaffolding or speculative functionality. Document any deviations from the specification and report which features were actually tested.
