import fs from 'fs';
import path from 'path';

const SRC_DIR = process.cwd();
const DIST_DIR = path.join(SRC_DIR, 'www');

// Files to copy from root
const FILES_TO_COPY = [
  'index.html',
  'min-side.html',
  'oppgrader.html',
  'vilkar.html',
  'personvern.html',
  'for-laerere.html',
  'for-skoler.html',
  'offline.html',
  'om-oss.html',
  'manifest.json',
  'icon.png',
  'sw.js'
];

// Directories to copy recursively
const DIRS_TO_COPY = [
  'src',
  'css',
  'js',
  'images',
  'sounds'
];

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

function copyFileSync(source, target) {
  let targetFile = target;

  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  let files = [];
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

async function build() {
  console.log('🧹 Clearing www directory...');
  deleteFolderRecursive(DIST_DIR);
  fs.mkdirSync(DIST_DIR, { recursive: true });

  console.log('📋 Copying root files...');
  FILES_TO_COPY.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    if (fs.existsSync(srcPath)) {
      copyFileSync(srcPath, DIST_DIR);
      console.log(`  Copy: ${file}`);
    } else {
      console.warn(`  Warning: File ${file} not found.`);
    }
  });

  console.log('📁 Copying folders...');
  DIRS_TO_COPY.forEach(dir => {
    const srcPath = path.join(SRC_DIR, dir);
    if (fs.existsSync(srcPath)) {
      copyFolderRecursiveSync(srcPath, DIST_DIR);
      console.log(`  Copy: ${dir}/`);
    } else {
      console.warn(`  Warning: Directory ${dir}/ not found.`);
    }
  });

  console.log('✨ Web build completed successfully!');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
