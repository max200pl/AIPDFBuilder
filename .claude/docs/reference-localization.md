# Localization

> SEED/TODO — not wired. This project has no i18n today: no translation files, no `lang`
> attribute usage, no translated strings anywhere in `res/`. Do not treat anything below as
> implemented — it documents what the Sciter js-sdk offers, for whoever wires localization in
> later, sourced from `samples.sciter/i18n-reactor/`.

## Current state

`res/main.htm`'s `<html>` element sets no `lang` attribute; no strings are marked for translation
anywhere in the codebase. This is a placeholder frontend (per `CLAUDE.md`) — there is nothing to
localize yet.

## What Sciter offers (not yet adopted)

The js-sdk demonstrates a lightweight, build-free i18n mechanism for Reactor apps
(`samples.sciter/i18n-reactor/app.js`, `i18n.js`):

- **Literal-marking syntax**: `@"some string"` marks a string literal for translation;
  `<tag @>text</tag>` and `<tag @title="Title text" @>` mark JSX text content/attributes. A global
  `JSX_translateTags` map (e.g. `{ caption: true, p: true, label: true }`) declares which tag
  names get auto-translated.
- **Translation hooks**: `JSX_translateText(text)` looks up a plain string in a translation table;
  `JSX_translateNode(node, translationId)` handles richer nodes (e.g. text with embedded
  variables/kids).
- **Loading a language**: `loadTranslation(lang)` sets `document.attributes["lang"] = lang` and
  synchronously `fetch`es a per-language table module (`langs/<lang>.js`) that's `eval`'d into the
  in-memory translation map.

This is a real engine feature, not a fabrication — but **nothing about *this* project's actual
translation-table shape, supported languages, or file layout is decided**. Do not scaffold
`langs/en.js` or similar speculatively; that would fabricate a message catalog the project hasn't
asked for.

## Before adopting this

Note the security posture in [Security](../rules/security.md): the current `ALLOW_EVAL`
script-runtime flag exists for
whatever originally justified it — the js-sdk's `loadTranslation` pattern also relies on `eval`
internally to parse the fetched table, so if this pattern is adopted, cross-check it doesn't become
the *reason* `ALLOW_EVAL` stays granted beyond what's otherwise needed.

## Handoff

When real localized strings/components exist, `/analyze-frontend`'s `data-flow-mapper` subagent
detects the actual i18n approach in use and `/update-frontend-docs` replaces this file with the
detected facts (supported languages, table format, loading mechanism).
