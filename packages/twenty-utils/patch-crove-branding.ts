import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve(__dirname, '../..');

const EN_REPLACEMENTS: Record<string, string> = {
  'Workspace': 'Organization',
  'Workspaces': 'Organizations',
  'workspace': 'organization',
  'workspaces': 'organizations',
  'Twenty': 'Crove',
  'Twenty CRM': 'Crove CRM',
  'Create Workspace': 'Create Organization',
  'Create your workspace': 'Create your organization',
  'Choose a Workspace': 'Choose an Organization',
  'Welcome to Twenty': 'Welcome to Crove',
  'Welcome to your workspace': 'Welcome to your organization',
  'Workspace domain': 'Organization domain',
  'Workspace members': 'Organization members',
  'Workspace settings': 'Organization settings',
  'Delete Workspace': 'Delete Organization',
};

const VI_REPLACEMENTS: Record<string, string> = {
  'Workspace': 'Tổ chức',
  'Workspaces': 'Các tổ chức',
  'workspace': 'tổ chức',
  'workspaces': 'các tổ chức',
  'Twenty': 'Crove',
  'Twenty CRM': 'Crove CRM',
  'Create Workspace': 'Tạo tổ chức',
  'Create your workspace': 'Tạo tổ chức của bạn',
  'Choose a Workspace': 'Chọn một tổ chức',
  'Welcome to Twenty': 'Chào mừng đến với Crove',
  'Welcome to your workspace': 'Chào mừng đến với tổ chức của bạn',
  'Workspace domain': 'Tên miền tổ chức',
  'Workspace members': 'Thành viên tổ chức',
  'Workspace settings': 'Cài đặt tổ chức',
  'Delete Workspace': 'Xóa tổ chức',
};

const CROVE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" rx="20" fill="#E11D48"/>
  <path d="M68 34.5C64.2 29.2 58 26 50.5 26C36.9 26 26 36.9 26 50.5C26 64.1 36.9 75 50.5 75C58.2 75 64.5 71.6 68.3 66.1C69.1 64.9 68.3 63.3 66.8 63.3H61.2C60.3 63.3 59.5 63.8 59 64.5C56.9 67.5 53.9 69.2 50.5 69.2C40.1 69.2 31.8 60.9 31.8 50.5C31.8 40.1 40.1 31.8 50.5 31.8C54 31.8 57.1 33.6 59.2 36.7C59.7 37.4 60.5 37.8 61.4 37.8H66.9C68.4 37.8 69.2 36.1 68 34.5Z" fill="#FFFFFF"/>
</svg>
`;

function patchPoFile(filePath: string, replacements: Record<string, string>) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let patchCount = 0;

  for (const [msgid, newMsgstr] of Object.entries(replacements)) {
    const regex = new RegExp(`(msgid\\s+"${escapeRegex(msgid)}"\\s*\\n\\s*msgstr\\s+)"([^"]*)"`, 'g');
    content = content.replace(regex, (_, prefix, oldMsgstr) => {
      if (oldMsgstr !== newMsgstr) {
        patchCount++;
        return `${prefix}"${newMsgstr}"`;
      }
      return `${prefix}"${oldMsgstr}"`;
    });
  }

  if (patchCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Branding Patch] Applied ${patchCount} replacements to ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function patchHtmlAndManifest() {
  const indexHtmlPath = path.join(ROOT_DIR, 'packages/twenty-front/index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    html = html
      .replace(/<title>.*?<\/title>/gi, '<title>Crove CRM</title>')
      .replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/>/gi, '<meta property="og:title" content="Crove CRM" />')
      .replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/>/gi, '<meta name="twitter:title" content="Crove CRM" />')
      .replace(/<meta\s+name="description"\s+content=".*?"\s*\/>/gi, '<meta name="description" content="Crove CRM — AI-Native Business OS" />')
      .replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/>/gi, '<meta property="og:description" content="Crove CRM — AI-Native Business OS" />')
      .replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/>/gi, '<meta name="twitter:description" content="Crove CRM — AI-Native Business OS" />');

    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('[Branding Patch] Updated packages/twenty-front/index.html metadata.');
  }

  const manifestPath = path.join(ROOT_DIR, 'packages/twenty-front/public/manifest.json');
  if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    manifest = manifest
      .replace(/"name":\s*"Twenty"/g, '"name": "Crove CRM"')
      .replace(/"short_name":\s*"Twenty"/g, '"short_name": "Crove"');

    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('[Branding Patch] Updated packages/twenty-front/public/manifest.json.');
  }
}

function patchBrandAssets() {
  const integrationLogoPath = path.join(ROOT_DIR, 'packages/twenty-front/public/images/integrations/twenty-logo.svg');
  fs.writeFileSync(integrationLogoPath, CROVE_LOGO_SVG, 'utf8');
  console.log('[Branding Patch] Updated Crove logo asset at packages/twenty-front/public/images/integrations/twenty-logo.svg.');
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  console.log('[Branding Patch] Starting Crove branding, logo, favicon, and terminology patch...');

  const poFiles = [
    { path: path.join(ROOT_DIR, 'packages/twenty-front/src/locales/en.po'), replacements: EN_REPLACEMENTS },
    { path: path.join(ROOT_DIR, 'packages/twenty-front/src/locales/vi-VN.po'), replacements: VI_REPLACEMENTS },
    { path: path.join(ROOT_DIR, 'packages/twenty-server/src/engine/core-modules/i18n/locales/en.po'), replacements: EN_REPLACEMENTS },
    { path: path.join(ROOT_DIR, 'packages/twenty-server/src/engine/core-modules/i18n/locales/vi-VN.po'), replacements: VI_REPLACEMENTS },
    { path: path.join(ROOT_DIR, 'packages/twenty-emails/src/locales/en.po'), replacements: EN_REPLACEMENTS },
    { path: path.join(ROOT_DIR, 'packages/twenty-emails/src/locales/vi-VN.po'), replacements: VI_REPLACEMENTS },
  ];

  for (const item of poFiles) {
    patchPoFile(item.path, item.replacements);
  }

  patchHtmlAndManifest();
  patchBrandAssets();

  console.log('[Branding Patch] Compiling Lingui catalogs...');
  const compilePackages = [
    { name: 'twenty-front', cwd: path.join(ROOT_DIR, 'packages/twenty-front') },
    { name: 'twenty-server', cwd: path.join(ROOT_DIR, 'packages/twenty-server') },
    { name: 'twenty-emails', cwd: path.join(ROOT_DIR, 'packages/twenty-emails') },
  ];

  for (const pkg of compilePackages) {
    try {
      execSync('npx lingui compile --typescript', { cwd: pkg.cwd, stdio: 'inherit' });
      console.log(`[Branding Patch] ${pkg.name} catalogs compiled successfully.`);
    } catch (error) {
      console.warn(`[Branding Patch] Warning during ${pkg.name} compilation:`, error);
    }
  }

  console.log('[Branding Patch] Complete!');
}

main();
