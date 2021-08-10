import container from '@container';
import { Process } from '@models/Queue/Entity';

export interface MasterChiefScannerParams {
  masterChefAddress: string;
  protocolName: string;
  protocolDescription: string;
  adapterName: string;
  farmingAdapterName: string;
  network: '1' | '56' | '137';
  reservedPools: number[];
}

export default async (process: Process) => {
  const {
    masterChefAddress,
    protocolName,
    protocolDescription,
    adapterName,
    farmingAdapterName,
    network,
  } = process.task.params as MasterChiefScannerParams;

  let protocol = await container.model.protocolTable().where('name', protocolName).first();

  if (!protocol) {
    protocol = await container.model
      .protocolService()
      .create(adapterName, protocolName, protocolDescription, null, null, false);
  }

  const blockchain = container.blockchain.ethereum;
  const provider = blockchain.byNetwork(network).provider();

  const masterChiefContract = container.blockchain.ethereum.contract(
    masterChefAddress,
    container.blockchain.ethereum.abi.masterChefV1ABI,
    provider,
  );

  const totalPools = await masterChiefContract.poolLength();
  const allPools = await Promise.all(
    new Array(totalPools.toNumber()).fill(1).map((_, i) => masterChiefContract.poolInfo(i)),
  );

  const contracts = await container.model.contractTable().where('protocol', protocol.id).select();

  const newPools = allPools.filter(
    (pool) =>
      Number(pool.allocPoint.toString()) > 0 &&
      !contracts.some((c) => c.address.toLowerCase() === pool.lpToken.toLowerCase()),
  );
  const removedContracts = contracts.filter(
    (contract) =>
      !allPools.some(
        (p) =>
          Number(p.allocPoint.toString()) > 0 &&
          contract.address.toLowerCase() === p.lpToken.toLowerCase(),
      ),
  );

  await Promise.all(
    newPools.map(async (pool) => {
      if (!protocol) {
        return;
      }
      const pair = container.blockchain.ethereum.contract(
        pool.lpToken,
        container.blockchain.ethereum.abi.uniswapV2PairABI,
        provider,
      );

      let token0: string;
      let token1: string;

      // In case of pool with ERC20 instead of LP-token
      try {
        [token0, token1] = await Promise.all([pair.token0(), pair.token1()]);
      } catch (e) {
        return;
      }

      const [symbol0, symbol1] = await Promise.all([
        container.blockchain.ethereum
          .contract(token0, container.blockchain.ethereum.abi.erc20ABI, provider)
          .symbol(),
        container.blockchain.ethereum
          .contract(token1, container.blockchain.ethereum.abi.erc20ABI, provider)
          .symbol(),
      ]);

      await container.model
        .contractService()
        .create(
          protocol,
          'ethereum',
          network,
          pool.lpToken.toLowerCase(),
          null,
          farmingAdapterName,
          '',
          `${symbol0}/${symbol1} LP`,
          '',
          `${container.blockchain.ethereum.networks[
            network
          ].walletExplorerURL.toString()}/${masterChefAddress}`,
          false,
        );
    }),
  );

  await Promise.all(
    removedContracts.map(async (contract) => {
      if (!protocol) {
        return;
      }

      await container.model
        .contractTable()
        .update({
          hidden: true,
        })
        .where('id', contract.id);
    }),
  );

  return process.done();
};
