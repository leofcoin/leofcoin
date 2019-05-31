const pack = require('packapp');
const { join } = require('path');
const { readFile } = require('fs');
const { promisify } = require('util');
const read = promisify(readFile);
const simpleInno = require('simple-inno-setup-script');

(async () => {
  let _package = await read(join(process.cwd(), 'package.json'));
  _package = JSON.parse(_package.toString());
  const name = _package.name;
  const version = _package.version;
  const author = _package.author;
  const supportURL = _package.bugs.url;
  const updatesURL = _package.homepage;
  const publisherURL = _package.homepage;
  try {
    const script = await read(join(__dirname, 'win', 'leofcoin-setup.iss'));
  } catch (error) {
console.log(error)
    if (error.code === 'ENOENT') {
      const result = await simpleInno({
      name,
      version,
      author,
      url: {
        supportURL,
        updatesURL,
        publisherURL
      },
      outputDir: '../',
      sourceDir: "../executables/leofcoin-win-x64.exe",
      sourceDirX86: "../executables/leofcoin-win-x86.exe",
      vbsPath: '../../node_modules/simple-inno-setup-script/templates/vbs.vbs',
      signTool: false,
      include: ['Source: "../../node_modules/go-ipfs-dep/go-ipfs/ipfs.exe"; DestDir: "{pf}/leofcoin";']
    });
    await result.write(__dirname + '/win/leofcoin-setup.iss', result.script);
    }
  }
  try {
    await pack({
      main: 'leofcoin.js',
      targets: ['node10-win-x64', 'node10-win-x86', 'node10-linux-x64', 'node10-linux-x86', 'node10-macos-x64', 'node10-macos-x86'],
      assets: 'www',
      output: 'build/executables',
      verbose: true,
      winExe: {
        scripts: 'build/win/leofcoin-setup.iss'
      }
    })
  } catch (e) {
    console.error(e);
  }
})()
