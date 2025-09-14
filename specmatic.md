Specmatic — Tools & CLI Cheatsheet
Platform components (what you can use)

Specmatic Studio (GUI) — No-code UI to record specs via a proxy, run contract tests, spin up mocks, and do backward-compat checks. Great for demos and non-terminal users. 
GitHub
+1

VS Code Extension — Run contract tests and generate examples from inside VS Code (Command Palette actions like “Run Contract Test”, “Generate Examples”). 
Visual Studio Marketplace

CLI / Executable — Run from npm, JAR, or Docker; works in any stack/CI. 
npm
+1

Language helpers —

Python package to drive tests/stubs (wraps the executable and emits JUnit). 
PyPI

Node wrapper if you prefer npm workflows. 
GitHub

MCP Server (for AI agents) — Exposes contract testing, resiliency, and mocking to tools like Claude Code/Copilot via MCP. 
GitHub
+1

Docker Desktop Extension (GUI) — No-code mocking/testing/resiliency/backward-compat in Docker Desktop. 
Docker Hub

Open-source vs commercial bits (licensing at a glance)

specmatic (core, OSS): MIT-licensed; main repo and CLI are open source. 
GitHub
+1

specmatic-openapi (commercial image): Adds advanced OpenAPI workflows (e.g., example generate/validate/fix/dictionary, repo-wide backward-compat checks) with a restricted default license for trialing. 
Docker Hub
+2
Docker Hub
+2

Key CLI commands (what you’ll actually run)

test — Executes provider contract tests against your running service and produces reports (HTML/JSON) under ./build/reports/specmatic. 
npm
+1

stub — Starts a spec-accurate HTTP mock so consumers can develop independently; can be driven purely by the OpenAPI plus expectations/examples. 
npm
+1

backward-compatibility-check — Compares changed specs to the base branch or two given files to flag breaking changes (great in PRs). 
Docker Hub
+2
GitHub
+2

examples ... (commercial image) — Generate/validate/fix external example sets and build a reusable dictionary to keep specs tidy. 
GitHub

Install/run options (pick your flavour)

npm: npm i -D specmatic then run via npx/scripts. 
npm

JAR: Use io.specmatic:specmatic-executable or the standalone jar in CI. 
Maven Repository

Docker: Useful when you don’t want Java/Node on runners; both OSS and commercial images exist. 
markus.oberlehner.net
+1
