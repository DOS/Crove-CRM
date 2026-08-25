import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

const ROOT_DIR = path.resolve(__dirname, '../..');

function transformEnglishText(text: string): string {
  return text
    .replace(/\bTwenty CRM\b/g, 'Crove CRM')
    .replace(/\bTwenty\b/g, 'Crove')
    .replace(/\btwenty\b/g, 'crove')
    .replace(/\bWorkspaces\b/g, 'Organizations')
    .replace(/\bworkspaces\b/g, 'organizations')
    .replace(/\bWorkspace\b/g, 'Organization')
    .replace(/\bworkspace\b/g, 'organization');
}

function transformVietnameseText(text: string): string {
  return text
    .replace(/\bTwenty CRM\b/g, 'Crove CRM')
    .replace(/\bTwenty\b/g, 'Crove')
    .replace(/\btwenty\b/g, 'crove')
    .replace(/không gian làm việc/gi, 'tổ chức')
    .replace(/Không gian làm việc/g, 'Tổ chức')
    .replace(/\bWorkspaces\b/g, 'Các tổ chức')
    .replace(/\bworkspaces\b/g, 'các tổ chức')
    .replace(/\bWorkspace\b/g, 'Tổ chức')
    .replace(/\bworkspace\b/g, 'tổ chức');
}

function patchPoFile(filePath: string, isVietnamese = false) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let patchCount = 0;

  const regex = /(msgid\s+("[\s\S]*?"))\n(msgstr\s+("[\s\S]*?"))(?=\n\n|\n#[.,~:\s]|\n*$)/g;

  const newContent = content.replace(regex, (fullMatch, msgidPrefix, msgidRaw, msgstrPrefix, msgstrRaw) => {
    let msgidValue = '';
    try {
      msgidValue = JSON.parse(msgidRaw.replace(/\n"/g, '"'));
    } catch {
      msgidValue = msgidRaw;
    }

    let msgstrValue = '';
    try {
      msgstrValue = JSON.parse(msgstrRaw.replace(/\n"/g, '"'));
    } catch {
      msgstrValue = msgstrRaw;
    }

    const sourceText = msgstrValue || msgidValue;
    const transformedText = isVietnamese
      ? transformVietnameseText(sourceText)
      : transformEnglishText(sourceText);

    if (transformedText !== msgstrValue) {
      patchCount++;
      return `${msgidPrefix}\nmsgstr ${JSON.stringify(transformedText)}`;
    }

    return fullMatch;
  });

  if (patchCount > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
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

const DOS_PATH_D = `M5761.2,2378.9c-91.1-498.8-309.9-953.6-620.9-1328.2C4607.7,408.9,3803.6,0,2904.4,0H655.7 C292.8,4.6,0,300.3,0,664.3v4480c0,364,292.8,659.7,655.7,664.3h2248.7c899.5,0,1703.2-408.8,2235.9-1050.7 c311.3-375,529.8-829.4,620.9-1328.2c31.3-170.5,47.3-345.9,47.3-525.5C5808.6,2724.3,5792.5,2549.2,5761.2,2378.9z M2912.9,4758.2 h-17c-182.5-0.8-358.9-28-525.3-78c-299.7-90-567.5-253.8-782.3-470.3c-144.5-145.7-265.1-315.3-355-502.4 c-42.7-88.9-78.6-181.8-107.1-277.9c-49.1-166.5-75.5-343-75.5-525.5s26.4-358.7,75.5-525.5c14.6-49.1,31-97.1,49.1-144.5 c17.1-44.5,80.8-42.4,95.3,3.2c15.3,48,32.7,95,51.9,140.9c82.5,196.4,200.6,374.3,346.2,525.5c172.6,179.1,383.7,320.8,620,411.8 l0,0c43.1,16.6,86.9,31.4,131.5,44.5c153.4,45,315.8,69.2,483.8,69.2c366.8,0,664.3,297.4,664.3,664.3 C3568.4,4457.8,3275.9,4753.5,2912.9,4758.2z M4682.4,3429.9c-14.6,49.1-31,97.1-49.1,144.5c-17.1,44.5-80.8,42.4-95.3-3.2 c-15.3-48-32.7-95-51.9-140.9c-82.5-196.4-200.6-374.3-346.2-525.5c-312-323.8-750.1-525.5-1235.3-525.5 c-161.1,0-308.9-57.4-423.9-152.9c-146.9-121.9-240.3-305.7-240.3-511.4c0-176.2,68.6-336.4,180.6-455.3 c119.3-126.8,287.9-206.6,475.2-209h17c732.2,3.2,1364.5,431.2,1662.7,1050.7c42.7,88.9,78.6,181.8,107.1,277.9 c49.1,166.5,75.5,343,75.5,525.5C4758.2,3087.2,4731.9,3263.1,4682.4,3429.9z`;

const CROVE_APP_ICON_SVG = (size: number, width?: number, height?: number, isTransparent = false) => {
  const w = width ?? size;
  const h = height ?? size;
  const minDim = Math.min(w, h);
  const rx = isTransparent ? 0 : Math.round(minDim * 0.22);
  const padding = Math.round(minDim * 0.18);
  const innerW = minDim - padding * 2;
  const innerH = minDim - padding * 2;
  const offsetX = (w - innerW) / 2;
  const offsetY = (h - innerH) / 2;

  const bgRect = isTransparent
    ? ''
    : `<rect width="${w}" height="${h}" rx="${rx}" fill="#0A0A0C"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${bgRect}
  <svg x="${offsetX}" y="${offsetY}" width="${innerW}" height="${innerH}" viewBox="0 0 5808.5 5808.4">
    <path fill="#FF2E29" d="${DOS_PATH_D}"/>
  </svg>
</svg>`;
};

async function patchBrandAssets() {
  const integrationLogoPath = path.join(ROOT_DIR, 'packages/twenty-front/public/images/integrations/twenty-logo.svg');
  if (fs.existsSync(path.dirname(integrationLogoPath))) {
    fs.writeFileSync(integrationLogoPath, CROVE_APP_ICON_SVG(96), 'utf8');
    console.log('[Branding Patch] Updated Crove logo asset at packages/twenty-front/public/images/integrations/twenty-logo.svg.');
  }

  const iconsDir = path.join(ROOT_DIR, 'packages/twenty-front/public/images/icons');
  if (fs.existsSync(iconsDir)) {
    const getAllFiles = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...getAllFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.png')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const iconFiles = getAllFiles(iconsDir);
    for (const iconFile of iconFiles) {
      try {
        const metadata = await sharp(iconFile).metadata();
        if (metadata.width && metadata.height) {
          const isUnplated = iconFile.includes('unplated');
          const svgContent = CROVE_APP_ICON_SVG(metadata.width, metadata.width, metadata.height, isUnplated);
          const pngBuffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
          fs.writeFileSync(iconFile, pngBuffer);
        }
      } catch (err) {
        console.warn(`[Branding Patch] Warning updating icon ${iconFile}:`, err);
      }
    }
    console.log(`[Branding Patch] Generated ${iconFiles.length} DOS/Crove app icons and favicons.`);
  }
}

async function main() {
  console.log('[Branding Patch] Starting Crove branding, logo, favicon, and terminology patch...');

  const poFiles = [
    { path: path.join(ROOT_DIR, 'packages/twenty-front/src/locales/en.po'), isVietnamese: false },
    { path: path.join(ROOT_DIR, 'packages/twenty-front/src/locales/vi-VN.po'), isVietnamese: true },
    { path: path.join(ROOT_DIR, 'packages/twenty-server/src/engine/core-modules/i18n/locales/en.po'), isVietnamese: false },
    { path: path.join(ROOT_DIR, 'packages/twenty-server/src/engine/core-modules/i18n/locales/vi-VN.po'), isVietnamese: true },
    { path: path.join(ROOT_DIR, 'packages/twenty-emails/src/locales/en.po'), isVietnamese: false },
    { path: path.join(ROOT_DIR, 'packages/twenty-emails/src/locales/vi-VN.po'), isVietnamese: true },
  ];

  for (const item of poFiles) {
    patchPoFile(item.path, item.isVietnamese);
  }

  patchHtmlAndManifest();
  await patchBrandAssets();

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

main().catch((err) => {
  console.error('[Branding Patch] Fatal error:', err);
  process.exit(1);
});
