import { resolve } from 'path';
import { Container, singleton } from '@services/Container';
import AppContainer from '@container';
import * as Models from '@models/index';

export class ModelContainer extends Container<typeof AppContainer> {
  readonly migrationTable = Models.Migration.Entity.tableFactory(this.parent.database);

  readonly migrationService = singleton(
    Models.Migration.Service.factory(
      this.parent.logger,
      this.parent.database,
      this.migrationTable,
      resolve(__dirname, '../migrations'),
    ),
  );

  readonly queueTable = Models.Queue.Entity.tableFactory(this.parent.database);

  readonly queueService = singleton(() => new Models.Queue.Service.QueueService(this.queueTable));

  readonly userTable = Models.User.Entity.tableFactory(this.parent.database);

  readonly userService = singleton(() => new Models.User.Service.UserService(this.userTable));

  readonly sessionService = singleton(
    () =>
      new Models.User.Service.SessionService(
        this.parent.cache,
        'defihelper:session',
        this.parent.parent.session.ttl,
      ),
  );

  readonly walletTable = Models.Wallet.Entity.tableFactory(this.parent.database);

  readonly walletService = singleton(
    () => new Models.Wallet.Service.WalletService(this.walletTable),
  );

  readonly protocolTable = Models.Protocol.Entity.protocolTableFactory(this.parent.database);

  readonly protocolService = singleton(
    () => new Models.Protocol.Service.ProtocolService(this.protocolTable),
  );

  readonly contractTable = Models.Protocol.Entity.contractTableFactory(this.parent.database);

  readonly walletContractLinkTable = Models.Protocol.Entity.walletContractLinkTableFactory(
    this.parent.database,
  );

  readonly contractService = singleton(
    () =>
      new Models.Protocol.Service.ContractService(this.contractTable, this.walletContractLinkTable),
  );

  readonly proposalTable = Models.Proposal.Entity.proposalTableFactory(this.parent.database);

  readonly voteTable = Models.Proposal.Entity.voteTableFactory(this.parent.database);

  readonly proposalService = singleton(
    () => new Models.Proposal.Service.ProposalService(this.proposalTable, this.voteTable),
  );

  readonly metricContractTable = Models.Metric.Entity.metricContractTableFactory(
    this.parent.database,
  );

  readonly metricWalletTable = Models.Metric.Entity.metricWalletTableFactory(this.parent.database);

  readonly metricWalletTokenTable = Models.Metric.Entity.metricWalletTokenTableFactory(
    this.parent.database,
  );

  readonly metricService = singleton(
    () =>
      new Models.Metric.Service.MetricContractService(
        this.metricContractTable,
        this.metricWalletTable,
        this.metricWalletTokenTable,
        this.parent.parent.adapters.host,
      ),
  );
}
