const fs = require('fs');

exports.default = (context) => {
  const localeDir = `${context.appOutDir}/locales/`;

  fs.readdir(localeDir, (err, files) => {
    if (err || !(files && files.length)) return;
    // Remove unused locales and retain only en-US and ja.
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < files.length; i++) {
      const match = files[i].match(/(en-US|ja)\.pak/);
      if (match === null) {
        fs.unlinkSync(localeDir + files[i]);
      }
    }
  });
};
