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

function patchPoFile(filePath: string, replacements: Record<string, string>) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let patchCount = 0;

  for (const [msgid, newMsgstr] of Object.entries(replacements)) {
    // Match: msgid "<exact string>"\nmsgstr "..."
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

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  console.log('[Branding Patch] Starting Crove branding and terminology patch...');

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
