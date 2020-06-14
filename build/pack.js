const packer = require('electron-packager');
const { join } = require('path');

(async () => await packer({
  // all: true,
  arch: ['x64'],
  platform: ['win32'],
  out: join(process.cwd(), 'build', 'out'),
  dir: join(process.cwd(), 'app')
}
))()