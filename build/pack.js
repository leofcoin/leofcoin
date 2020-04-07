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
      sourceDir: "../executables/leofcoin-x64.exe",
      sourceDirX86: "../executables/leofcoin-x86.exe",
      vbsPath: '../../node_modules/simple-inno-setup-script/templates/vbs.vbs',
      signTool: false,
      include: [
        'Source: "../../node_modules/ipfs/node_modules/leveldown/prebuilds/win32-x64/node.napi.node"; DestDir: "{pf}/leofcoin/prebuilds/win32-x64";\n',
        'Source: "../../node_modules/leveldown/prebuilds/android-arm/node.napi.armv7.node"; DestDir: "{pf}/leofcoin";'
      ]
    });
    await result.write(__dirname + '/win/leofcoin-setup.iss', result.script);
  
  const options = {
    main: 'leofcoin.js',
    assets: ['www', 'node_modules/ipfs/node_modules/leveldown/**/*', 'node_modules/lfc-storage/**/*'],
    output: 'build/executables',
    verbose: true,
    winExe: {
      scripts: 'build/win/leofcoin-setup.iss'
    }
  }
  try {
    options.targets = ['node12-win-x64', 'node12-win-x86']
    await pack(options)
  } catch (e) {
    console.error(e);
  }
  
  try {
    options.targets = ['node12-linux-x64', 'node12-linux-x86']
    options.output = 'build/executables/linux'
    await pack(options)
  } catch (e) {
    console.error(e)
  }
  
  try {
    options.targets = ['node12-macos-x64', 'node12-macos-x86']
    options.output = 'build/executables/mac'
    await pack(options)    
  } catch (e) {
    console.error(e)
  }
})()
