#!/usr/bin/env node
/**
 * Migrates shell-protected pages to ShellPage + ShellLoading.
 * Skips pages already migrated and cleaner mobile-only app screens.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PAGES_DIR = 'src/pages';

const SKIP = new Set([
  'Dashboard.tsx',
  'UpcomingBookings.tsx',
  'CustomerDashboard.tsx',
  'StaffSettings.tsx',
  'CleanerTodayPage.tsx',
  'CleanerBookingsPage.tsx',
  'CleanerUpcomingBookingsPage.tsx',
  'CleanerCompletedBookingsPage.tsx',
  // Public / standalone (no app shell)
  'Auth.tsx',
  'Index.tsx',
  'NotFound.tsx',
  'PaymentFailed.tsx',
  'ShortLinkResolver.tsx',
  'LandingPage.tsx',
  'FreeQuote.tsx',
  'ApplyToWork.tsx',
  'CustomerWelcome.tsx',
  'ChooseService.tsx',
  'PublicServiceSelection.tsx',
  'QuoteRequest.tsx',
  'BookingConfirmation.tsx',
  'CheckCoverage.tsx',
  'CustomerPhotos.tsx',
]);

function inferWidth(className) {
  if (/max-w-2xl|max-w-4xl/.test(className)) return 'narrow';
  if (/max-w-7xl|max-w-6xl|max-w-\[/.test(className)) return 'wide';
  if (/w-full/.test(className) && !/max-w/.test(className)) return 'full';
  return 'default';
}

function migrate(content) {
  if (content.includes('ShellPage') || content.includes('ShellLoading')) {
    return null;
  }

  let next = content;

  if (!next.includes("@/layouts/shell")) {
    const imports = [...next.matchAll(/^import .+;$/gm)];
    if (imports.length === 0) return null;
    const last = imports[imports.length - 1];
    next = next.replace(last[0], `${last[0]}\nimport { ShellLoading, ShellPage } from '@/layouts/shell';`);
  }

  next = next.replace(
    /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div className="min-h-screen flex items-center justify-center[^"]*">[\s\S]*?<\/div>\s*\);\s*\}/g,
    'if (loading) {\n    return <ShellLoading />;\n  }'
  );

  next = next.replace(
    /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div className="min-h-screen flex items-center justify-center[^"]*">[\s\S]*?<\/div>\s*\);\s*\}/g,
    'if (loading) {\n    return <ShellLoading />;\n  }'
  );

  const wrapperMatch = next.match(/return\s*\(\s*\n?\s*<div className="([^"]+)">/);
  if (!wrapperMatch) {
    return next !== content ? next : null;
  }

  const className = wrapperMatch[1];
  const width = inferWidth(className);
  const shellOpen = width === 'default' ? '<ShellPage>' : `<ShellPage width="${width}">`;

  next = next.replace(/return\s*\(\s*\n?\s*<div className="[^"]+">/, `return (\n    ${shellOpen}`);

  const closingPattern = /(\n[ \t]*)<\/div>(\s*\);\s*\n\};)/;
  if (!closingPattern.test(next)) {
    return null;
  }
  next = next.replace(closingPattern, '$1</ShellPage>$2');

  return next;
}

const files = readdirSync(PAGES_DIR).filter((f) => f.endsWith('.tsx') && !SKIP.has(f));
let updated = 0;
let skipped = 0;

for (const file of files) {
  const path = join(PAGES_DIR, file);
  const original = readFileSync(path, 'utf8');
  const migrated = migrate(original);
  if (migrated && migrated !== original) {
    writeFileSync(path, migrated);
    updated += 1;
    console.log('updated:', file);
  } else {
    skipped += 1;
  }
}

console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
