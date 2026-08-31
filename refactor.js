const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace expo-linear-gradient
  content = content.replace(/from ['"]expo-linear-gradient['"]/g, 'from "react-native-linear-gradient"');

  // Replace expo-web-browser
  content = content.replace(/from ['"]expo-web-browser['"]/g, 'from "react-native-inappbrowser-reborn"');

  // Replace expo-linking
  content = content.replace(/from ['"]expo-linking['"]/g, 'from "react-native"');

  // Replace expo-image-picker
  content = content.replace(/from ['"]expo-image-picker['"]/g, 'from "react-native-image-picker"');

  // Replace expo-secure-store
  content = content.replace(/from ['"]expo-secure-store['"]/g, 'from "react-native-keychain"');

  // Replace @expo/vector-icons
  content = content.replace(/from ['"]@expo\/vector-icons['"]/g, 'from "react-native-vector-icons/Ionicons"');

  // Replace expo-router
  const relativePath = path.relative(path.dirname(file), path.join(srcDir, 'navigation', 'RootNavigation')).replace(/\\/g, '/');
  const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
  content = content.replace(/from ['"]expo-router['"]/g, `from "${importPath}"`);

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
