import MultiWallet from 'multi-wallet';

onmessage = ({data}) => {
  const wallet = new MultiWallet(data.network);
  wallet.import(data.saved)
  postMessage(wallet)
};
