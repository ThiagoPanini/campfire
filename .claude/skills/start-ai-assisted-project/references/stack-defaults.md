# Stack-specific defaults

When the user mentions a specific backend or frontend stack during the bootstrap interview, append the relevant patterns to `.gitignore`. The base `gitignore` template covers Python and Node — add only what is missing.

## Python (already in base)

The base template covers `__pycache__/`, virtualenvs, pytest/mypy/ruff caches, coverage, tox, eggs, and dist artifacts. No additions needed for plain Python or FastAPI.

For Django:

```
# Django
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
staticfiles/
```

## Node / TypeScript / JavaScript (already partially in base)

The base template covers `node_modules/`, `.next/`, `.turbo/`, `out/`, and pnpm debug logs.

For Vite:

```
# Vite
.vite/
dist-ssr/
*.local
```

For Astro:

```
# Astro
.astro/
```

For Remix:

```
# Remix
build/
public/build/
```

For Nuxt:

```
# Nuxt
.nuxt/
.output/
.nitro/
```

## Go

```
# Go
*.exe
*.exe~
*.dll
*.dylib
*.test
*.out
go.work
go.work.sum
vendor/
```

## Rust

```
# Rust
target/
**/*.rs.bk
*.pdb
```

## Ruby / Rails

```
# Ruby
*.gem
*.rbc
.bundle
.config
.byebug_history
.rbenv-vars
.ruby-version
.ruby-gemset
.rspec
log/*
tmp/*
!log/.keep
!tmp/.keep
storage/*
!storage/.keep
public/system
public/uploads
```

## Java / Kotlin / Gradle

```
# Java / Gradle
*.class
*.ctxt
.mtj.tmp/
*.jar
*.war
*.nar
*.ear
hs_err_pid*
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
out/
```

## Application-level (always relevant when DB is involved)

These do not depend on stack — append them whenever the project will have a local database or background services:

```
# Local data
*.sqlite
*.sqlite3
*.db
*.db-journal
```

## When the stack is unknown

If the user has not mentioned a backend or frontend stack, the base `.gitignore` is sufficient. Patterns specific to the chosen stack are added later when the first code lands. Adding them preemptively to a directory that may never see those file types creates noise without value — consistent with the broader "reactive tooling" principle.
