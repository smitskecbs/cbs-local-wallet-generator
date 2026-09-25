# CBS Solana Address Generator

Local Solana vanity address generator for the CBS Tools suite.

Create a custom Solana address locally on your device. Keys never leave your browser.

**Live:** https://wallet.cbs-coin.com

---

## Security model

- Address generation is **local-only** (Web Workers + Web Crypto / Solana Kit).
- Private keys are **never stored** in `localStorage`, cookies, or URLs.
- Recent history keeps **public addresses and search metadata only**.
- Private keys stay in memory for the active result session so you can reveal, copy, or download them.
- Starting another search or leaving the page clears session secret material (best-effort; JavaScript cannot guarantee secure RAM zeroization).
- No analytics around private-key material.
- No RPC is required for generation.

Always store backups offline. Never share a private key.

---

## Architecture (Solana Kit only)

- `@solana/keys` — Ed25519 `generateKeyPair`
- `@solana/addresses` — address derivation
- `@solana/webcrypto-ed25519-polyfill` — loaded **only** when native Ed25519 is missing
- `bs58` — encode the conventional 64-byte Solana secret for wallet import

Legacy `@solana/web3.js` is **not** used.

---

## Browser requirements

Native Ed25519 Web Crypto is preferred (modern Chrome/Edge, Firefox, Safari).

If native support is unavailable, the official Solana polyfill is installed at runtime. If generation still cannot run, the UI shows a clear browser-support error instead of hanging.

---

## Development

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm test
npm run build
npm run bench
```

---

## Benchmark methodology

Primary metric: **attempts / second**.

Do not compare vanity tools by “time to find Mango” — that is probabilistic.

`npm run bench` measures the owned Kit grind loop across worker counts and per-worker batch concurrency, and prints an AUTO-plan sample for the current machine.

Audit baseline (Node, prior to this modernization):

| Configuration | Attempts/sec (approx.) |
|---|---|
| web3.js generate + Base58 | ~3,500 |
| Kit sequential generate + address | ~8,500 |
| Kit `grindKeyPair` concurrency 32 | ~25,700 |

Re-run `npm run bench` on your machine for comparable numbers after changes.

---

## Performance presets

Chromium Web Worker benchmarks on a 20-thread machine showed that **worker count** matters far more than per-worker batch concurrency. Raising concurrency above 1 often plateaued or slowed high-worker runs.

- **AUTO / Balanced** — `min(8, floor(hardwareConcurrency / 2))` workers × concurrency `1` (mobile: ≤2 workers)
- **Low** — 1 worker × concurrency 1
- **Maximum** — `hardwareConcurrency - 2` workers × concurrency 2 (mobile: ≤4 × 1)

Internal batch concurrency is not exposed in the beginner UI.

Re-run browser QA with:

```bash
npm run build
npm run preview
npm run qa:browser
```

---

## Export formats

- **Download keypair backup (.txt)** — Solana address + private key + wallet import instructions
- **Download keypair (.json)** — Solana 64-byte secret as a JSON number array (`solana-keygen` style)

Round-trip tests verify the exported secret reconstructs the same address using Kit APIs only.

---

## Fonts / CSP tradeoff

The UI uses Fredoka + Nunito from Google Fonts to stay aligned with CBS NFT Builder.

A meta Content-Security-Policy restricts script/connect destinations. Font CSS/files are allowlisted. There is no analytics endpoint.

Self-hosting fonts later would further reduce third-party surface.

---

## License

MIT
