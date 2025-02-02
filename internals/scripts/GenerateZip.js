const fs = require('fs');
const path = require('path');
const Zip = require('jszip');
const yaml = require('js-yaml');

const zip = Zip();

try {
  const ymlFile = path.join(__dirname, '../../release/latest.yml');
  const doc = yaml.load(fs.readFileSync(ymlFile, 'utf8'));
  const exeName = doc.path;
  const exePath = path.join(__dirname, `../../release/${exeName}`);
  const zipFile = exeName.replace('.exe', '.zip');
  const zipPath = path.join(__dirname, `../../release/${zipFile}`);

  zip.file('latest.yml', fs.readFileSync(ymlFile, { encoding: 'utf8' }));
  zip.file(exeName, fs.readFileSync(exePath));
  zip
    .generateAsync({ type: 'uint8array' })
    .then((content) => {
      fs.writeFileSync(zipPath, content);
      return undefined;
    })
    .catch((err) => console.error(err));
} catch (e) {
  console.log(e);
}
