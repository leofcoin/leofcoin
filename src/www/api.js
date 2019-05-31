// import socketRequestClient from '../node_modules/socket-request-client/src/index';


export default async () => {
  const client = await socketRequestClient(6000, 'echo-protocol');

  return {
    getBalance: async address => {
      console.log(address);
      const response = await fetch(`${apiUrl}/getbalance/${address}`);
      const balance = await response.text();
      return Number(balance);
    },
    accounts: async () => client.request({url: 'accounts'}),
    addresses: async () => {
      let call = 0;
      const accounts = await client.request({url: 'accounts'});
      return accounts.map(acc => [call++, acc])
    },
    wallet: async () => {
      const response = await fetch(`${apiUrl}/wallet`);
      const wallet = await response.text();
      return wallet;
    }
  }
}
