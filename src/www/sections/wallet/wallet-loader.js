import api from '../../api';

const browserEnv = (() => {
  try {
    return Boolean(process !== undefined);
  } catch (e) {
    return false
  }
})

const loadForBrowser = () => {
  const wallet = localStorage.getItem('leofcoin-wallet')
  if (!wallet) // create wallet
  return wallet
}

/**
 * load wallet from local or local browser storage
 *
 * @param {string} path path/name for the wallet
 * @example
 * load('path/to/wallet').then(() ...) // local path to wallet file
 * load('localStorage_id').then(() ...) // browser localStorage id
 */
const load = async path => {
  let addresses;
  if (browserEnv) {
    addresses = await loadForBrowser();
  }
  try {
    addresses = await api().addresses();
  } catch (error) {
    console.error(error);
  }
  return addresses;
}

export default load
