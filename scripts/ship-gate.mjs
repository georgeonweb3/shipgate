// ship-gate.mjs — the deploy gate that only Kane can open.
//
// 1. Runs every Kane testmd flow in .testmuai/tests/ with
//    `kane-cli testmd run <flow> --agent`, parsing the NDJSON output.
// 2. Prints a per-flow verdict table.
// 3. Exit 1 if ANY flow fails — and writes
//    .testmuai/last-failure-handoff.md (failing flow, failing step, what
//    the browser showed) for the fix loop. NOTHING is deployed.
// 4. Exit 0 only if ALL pass — then deploys: git add, commit, push to
//    origin main. GitHub Pages serves docs/ from main, so a push IS the
//    deploy. The gate NEVER pushes when any flow fails.
//
// Usage:
//   node scripts/ship-gate.mjs             # test + deploy on all-pass
//   node scripts/ship-gate.mjs --test-only # test only, never deploy
import { spawn, execSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const TESTS_DIR = join(ROOT, '.testmuai', 'tests');
const HANDOFF = join(ROOT, '.testmuai', 'last-failure-handoff.md');
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:4173';
const TEST_ONLY = process.argv.includes('--test-only');

function serverUp() {
  return new Promise((resolve) => {
    const req = http.get(APP_URL, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

// Tolerant NDJSON verdict parser. Kane's --agent output is NDJSON; the
// exact event field names may vary by CLI version, so accept any of the
// common verdict spellings and keep the raw lines for the handoff.
function parseVerdict(lines) {
  const verdict = { status: 'unknown', step: '', evidence: [] };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj = null;
    try { obj = JSON.parse(trimmed); } catch { /* not JSON — keep as text */ }
    if (obj && typeof obj === 'object') {
      const text = JSON.stringify(obj);
      const status = String(obj.status || obj.result || obj.verdict || obj.outcome || '').toLowerCase();
      const step = obj.step || obj.stepName || obj.step_name || obj.currentStep || '';
      if (['fail', 'failed', 'failure', 'error'].includes(status)) {
        verdict.status = 'FAIL';
        verdict.step = step || verdict.step;
        verdict.evidence.push(text);
      } else if (['pass', 'passed', 'success'].includes(status) && verdict.status !== 'FAIL') {
        verdict.status = 'PASS';
        verdict.step = step || verdict.step;
      }
      if (obj.message || obj.error) verdict.evidence.push(text);
    } else if (/fail|error/i.test(trimmed)) {
      verdict.evidence.push(trimmed);
    }
  }
  // A run that produced output but no explicit verdict is a FAIL:
  // the gate must never treat silence as a pass.
  if (verdict.status === 'unknown') verdict.status = 'FAIL';
  return verdict;
}

function runFlow(flowPath) {
  return new Promise((resolve) => {
    const lines = [];
    const child = spawn('kane-cli', ['testmd', 'run', flowPath, '--agent'], { cwd: ROOT });
    child.stdout.on('data', (d) => lines.push(...String(d).split('\n')));
    child.stderr.on('data', (d) => lines.push(...String(d).split('\n')));
    child.on('error', (err) => {
      resolve({ flow: flowPath, status: 'FAIL', step: '', evidence: [`Could not start kane-cli: ${err.message}. Is Kane CLI installed and on PATH?`] });
    });
    child.on('close', (code) => {
      const verdict = parseVerdict(lines);
      // A non-zero exit with no explicit PASS is a fail, whatever the text says.
      if (code !== 0 && verdict.status === 'PASS') verdict.status = 'FAIL';
      resolve({ flow: flowPath, status: verdict.status, step: verdict.step, evidence: verdict.evidence.slice(-20), exitCode: code });
    });
  });
}

async function main() {
  if (!(await serverUp())) {
    console.error(`\nShipGate gate: app is not reachable at ${APP_URL}.`);
    console.error('Start it first with: npm start  (then re-run the gate in another terminal.)\n');
    process.exit(1);
  }

  const files = (await readdir(TESTS_DIR)).filter((f) => f.endsWith('_test.md')).sort();
  if (files.length === 0) {
    console.error('ShipGate gate: no flows found in .testmuai/tests/.');
    process.exit(1);
  }

  console.log(`\nShipGate gate: running ${files.length} Kane flow(s) against ${APP_URL}\n`);
  const results = [];
  for (const file of files) {
    const flowPath = join(TESTS_DIR, file);
    console.log(`  … ${file}`);
    results.push(await runFlow(flowPath));
  }

  console.log('\nFlow                      Verdict');
  console.log('------------------------  -------');
  for (const r of results) {
    console.log(`${r.flow.split('/').pop().padEnd(24)}  ${r.status}`);
  }

  const failures = results.filter((r) => r.status !== 'PASS');
  if (failures.length > 0) {
    const stamp = new Date().toISOString();
    const handoff = [
      '# ShipGate — Kane failure handoff',
      '',
      `Generated: ${stamp} (gate refused to deploy)`,
      '',
      ...failures.flatMap((f) => [
        `## Failing flow: ${f.flow.split('/').pop()}`,
        '',
        `- Failing step: ${f.step || '(not identified in Kane output — see evidence below)'}`,
        `- Kane exit code: ${f.exitCode ?? '(unknown)'}`,
        '- What the browser showed (last Kane output lines):',
        '```',
        ...(f.evidence.length ? f.evidence : ['(no output captured)']),
        '```',
        '',
      ]),
      '## What to do',
      '',
      'Fix the cause above, then re-run `npm run test:kane`.',
      'The gate deploys only when every flow passes.',
      '',
    ].join('\n');
    await writeFile(HANDOFF, handoff);
    console.log(`\n⛔ GATE CLOSED: ${failures.length} of ${results.length} flow(s) failed. Nothing deployed.`);
    console.log(`Handoff written to .testmuai/last-failure-handoff.md — fix, then re-run.\n`);
    process.exit(1);
  }

  console.log(`\n✅ ALL ${results.length} FLOWS PASSED — Kane opened the gate.`);
  if (TEST_ONLY) {
    console.log('(--test-only: deploy skipped.)\n');
    process.exit(0);
  }

  const date = new Date().toISOString().slice(0, 10);
  console.log('Deploying: git add, commit, push to origin main (GitHub Pages serves docs/)…');
  try {
    execSync('git add -A && git commit -m "ship: Kane green ' + date + '" && git push origin main', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('\nDeploy failed: the git push did not complete. The site is unchanged; fix git/remote and re-run.');
    process.exit(1);
  }
  console.log('\n🚢 Shipped. Live site updates from main/docs via GitHub Pages.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('ShipGate gate crashed:', err);
  process.exit(1);
});
