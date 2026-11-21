export const mockIDRXAbi = [
  { name: 'faucet', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address', name: 'spender' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address', name: 'account' }], outputs: [{ type: 'uint256' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

export const campaignAbi = [
  { name: 'donasi', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256', name: 'jumlah' }], outputs: [] },
  { name: 'setWhitelist', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address', name: 'toko' }, { type: 'bool', name: 'diizinkan' }], outputs: [] },
  { name: 'setPenerimaBatch', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address[]', name: 'orang' }, { type: 'bool[]', name: 'diizinkan' }], outputs: [] },
  { name: 'setAgent', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address', name: 'agent_' }], outputs: [] },
  { name: 'setLimit', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256', name: 'maxPerTx_' }, { type: 'uint256', name: 'maxPerHari_' }], outputs: [] },
  { name: 'sudahBelanja', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'isPenerima', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'isWhitelist', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'jatahPerPenerima', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxPerTx', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxPerHari', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'token', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'agent', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'Donasi', type: 'event', inputs: [{ type: 'address', name: 'donatur', indexed: true }, { type: 'uint256', name: 'jumlah', indexed: false }] },
  { name: 'Belanja', type: 'event', inputs: [{ type: 'address', name: 'penerima', indexed: true }, { type: 'address', name: 'toko', indexed: true }, { type: 'uint256', name: 'jumlah', indexed: false }, { type: 'uint256', name: 'nonce', indexed: false }] },
  { name: 'WhitelistDiubah', type: 'event', inputs: [{ type: 'address', name: 'toko', indexed: true }, { type: 'bool', name: 'diizinkan', indexed: false }] },
  { name: 'PenerimaDiubah', type: 'event', inputs: [{ type: 'address', name: 'penerima', indexed: true }, { type: 'bool', name: 'diizinkan', indexed: false }] },
  { name: 'CampaignCreated', type: 'event', inputs: [{ type: 'address', name: 'campaign', indexed: true }, { type: 'address', name: 'operator', indexed: true }, { type: 'address', name: 'token', indexed: true }, { type: 'string', name: 'name', indexed: false }, { type: 'uint256', name: 'jatahPerPenerima', indexed: false }, { type: 'uint256', name: 'maxPerTx', indexed: false }, { type: 'uint256', name: 'maxPerHari', indexed: false }] },
] as const;

export const campaignFactoryAbi = [
  { name: 'createCampaign', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address', name: 'token' }, { type: 'string', name: 'name' }, { type: 'uint256', name: 'jatahPerPenerima' }, { type: 'uint256', name: 'maxPerTx' }, { type: 'uint256', name: 'maxPerHari' }], outputs: [{ type: 'address' }] },
  { name: 'CampaignCreated', type: 'event', inputs: [{ type: 'address', name: 'campaign', indexed: true }, { type: 'address', name: 'operator', indexed: true }, { type: 'address', name: 'token', indexed: true }, { type: 'string', name: 'name', indexed: false }, { type: 'uint256', name: 'jatahPerPenerima', indexed: false }, { type: 'uint256', name: 'maxPerTx', indexed: false }, { type: 'uint256', name: 'maxPerHari', indexed: false }] },
] as const;
