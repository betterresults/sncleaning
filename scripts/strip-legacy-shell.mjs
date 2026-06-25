#!/usr/bin/env node
/**
 * Removes per-page legacy SidebarProvider / AppShell wrappers.
 * Run after ShellLayout is wired in ProtectedRoute.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync('rg -l "UnifiedSidebar|AppShell" src/pages', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

function stripImports(content) {
  return content
    .split('\n')
    .filter((line) => {
      if (!line.startsWith('import ')) return true;
      if (/SidebarProvider|SidebarInset|UnifiedSidebar|UnifiedHeader/.test(line)) return false;
      if (/@\/layouts\/shell/.test(line)) return false;
      if (/navigationItems/.test(line) && /adminNavigation|salesAgentNavigation|cleanerNavigation|customerNavigation|getCustomerNavigation/.test(line)) {
        return false;
      }
      return true;
    })
    .join('\n');
}

function stripAuxiliaryCode(content) {
  return content
    .replace(/\n\s*const handleSignOut = async \(\) => \{[\s\S]*?\};\n/g, '\n')
    .replace(/\n\s*const navigation = userRole === 'sales_agent' \? salesAgentNavigation : adminNavigation;\n/g, '\n')
    .replace(/\n\s*const navigation = adminNavigation;\n/g, '\n')
    .replace(/\n\s*const isAdminViewing = userRole === 'admin';\n/g, '\n');
}

function extractSidebarBlock(block) {
  const mainMatch = block.match(/<SidebarInset[^>]*>\s*<main[^>]*>([\s\S]*?)<\/main>\s*<\/SidebarInset>/);
  if (mainMatch) return mainMatch[1].trim();

  const insetMatch = block.match(/<SidebarInset[^>]*>([\s\S]*?)<\/SidebarInset>/);
  if (insetMatch) return insetMatch[1].trim();

  return null;
}

function stripSidebarProvider(content) {
  let result = content;
  let safety = 0;

  while (result.includes('<SidebarProvider>') && safety < 10) {
    safety += 1;
    const match = result.match(/return \(\s*<SidebarProvider>[\s\S]*?<\/SidebarProvider>\s*\);/);
    if (!match) break;

    const inner = extractSidebarBlock(match[0]);
    if (!inner) break;

    result = result.replace(match[0], `return (\n${inner}\n  );`);
  }

  return result;
}

function stripAppShell(content) {
  const match = content.match(/return \(\s*<AppShell[\s\S]*?>\s*([\s\S]*?)\s*<\/AppShell>\s*\);/);
  if (!match) return content;
  return content.replace(match[0], `return (\n${match[1].trim()}\n  );`);
}

let updated = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  let content = original;

  content = stripImports(content);
  content = stripAuxiliaryCode(content);
  content = stripAppShell(content);
  content = stripSidebarProvider(content);

  if (content !== original) {
    writeFileSync(file, content);
    updated += 1;
    console.log('updated:', file);
  }
}

console.log(`Done. Updated ${updated} of ${files.length} files.`);
