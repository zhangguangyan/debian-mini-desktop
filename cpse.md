goal of the sesion is understanding current design and see if we can simpilify current design

2. why simple is important
compliexity is morden software development
what's simple
simple <> easy

context 
different people simple to one difficult to others chopstick

3. design is about trade off
microserver example
4. what's the essential problem we are solving

  Mapping
  Orachestraction


| Tool      | Where logic lives     | Formats                   | Strong in…                    | Run from C#?                     |
| --------- | --------------------- | ------------------------- | ----------------------------- | -------------------------------- |
| Flyway    | SQL or Java callbacks | SQL, Java                 | Simplicity, versioned SQL     | Yes (CLI via Process)            |
| Liquibase | External changelogs   | XML, YAML, JSON, SQL      | Rich DSL, rollbacks, contexts | Yes (CLI/JAR/Docker)             |
| EF Core   | In C# code            | C# migrations (generated) | Closest to your model classes | Native (`db.Database.Migrate()`) |


  
  
