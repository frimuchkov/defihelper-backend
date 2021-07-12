import { Container, singleton } from '@services/Container';
import { isKey } from '@services/types';

export interface Config {
  mainNode: string;
  testNode: string;
}

export class BlockchainContainer extends Container<Config> {
  readonly byNetwork = (network: string | number) => {
    const normalizeNetwork = network.toString();
    const provider = isKey(this.provider, normalizeNetwork)
      ? this.provider[normalizeNetwork]
      : null;

    return {
      provider,
      avgBlockTime: null,
    };
  };

  readonly provider = {
    main: singleton(() => this.parent.mainNode),
    test: singleton(() => this.parent.testNode),
  };
}
