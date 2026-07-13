## Design Principles

### Simplicity and clarity

- KISS: choose the simplest design that solves the current product problem clearly. Fight complexity directly so the system remains understandable as it grows.
- Prefer deep modules with simple interfaces that hide meaningful complexity. Avoid pass-through layers and shallow wrappers that add indirection without improving the caller's abstraction.
- Hide information deliberately. Do not leak provider internals, prompt shapes, storage details, or UI implementation details across boundaries unless the caller truly needs them.
- Keep names simple and precise. If a function, file, or concept is hard to name, re-check the design.
- Separate general-purpose code from special-purpose product behavior.
- Follow the Rule of Least Surprise. Prefer established project and ecosystem conventions over clever or novel interfaces.

### Domain and module boundaries

- Follow Domain-Driven Design where it clarifies the product. Establish and use a ubiquitous language consistently in code, interfaces, and documentation.
- Preserve bounded contexts as the product grows. Each context should own its models and rules rather than leaking concerns into other contexts.
- Do not add DDD ceremony. Introduce entities, value objects, repositories, or services only when they simplify real behavior or protect domain rules.
- Prefer a modular monolith before services. Keep one deployable app organized into explicit product and domain modules; folder boundaries are sufficient until stronger enforcement removes real complexity.
- Keep domain behavior at the center and dependencies pointing inward. Domain code must not import HTTP handlers, browser UI, databases, AI SDKs, provider clients, or framework-specific code. Add application or adapter layers only when they protect domain rules or isolate an external concern.
- Keep external systems such as AI providers, storage, email, auth, and booking behind ports owned by the relevant module. Adapters should translate external data into domain objects; providers should not define the domain model.

### Composition and transparency

- Design components to compose. Use small, stable application interfaces, explicit events, or simple documented data contracts instead of reaching into another module's internals.
- Design for transparency. Logs, errors, state, tests, and diagnostic tools should make the system's behavior and correctness easy to inspect.
- Prefer declarative data and configuration over complicated control flow when they make behavior easier to understand and verify.

### Evolution and delivery

- Consider at least two designs for non-trivial architecture choices, then choose based on interface simplicity, testability, product fit, and change cost.
- Prefer strategic cleanup when touching fragile code, but do not expand scope into unrelated refactors.
- Use tests or focused verification as the safety net for design changes.
- Get the design working before optimizing it. Measure real bottlenecks, then make the smallest targeted improvement that solves them.
- Conserve developer time. Reuse proven tools and automate repetitive, error-prone work when doing so reduces total complexity.
- Avoid a "one true way." Choose tools and techniques according to the problem while preserving clear module boundaries.
