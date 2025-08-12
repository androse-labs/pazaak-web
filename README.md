# Pazaak-Web Monorepo

A simple application recreating a niche card game with web technologies.

---

## Structure

```text
apps/
   web/             # React Single Page App
   server/          # Bun + Hono
infrastructure/     # Terraform Infrastructure-As-Code
libs/
   shared/          # Shared types & helpers between server + web projects
```

---

## Getting Started

### Install dependencies (from the repo root)

```bash
bun install
```

---

### Running the Apps

#### Start the Server

```bash
cd apps/server
bun run dev
```

#### Start the Web App

```bash
cd apps/web
bun run dev
```

#### Start Both

Run the below from the repository root

```bash
bun run dev
```

---

### Building for Production

#### Build the Server

```bash
cd apps/server
bun run build
```

#### Build the Web App

```bash
cd apps/web
bun run build
```
