import container from '@container';
import { Process } from '@models/Queue/Entity';

export default async (process: Process) => {
  const queue = container.model.queueService();
  await Promise.all([
    queue.push('metricsContractBroker', {}),
    queue.push('metricsWalletBroker', {}),
  ]);

  return process.done();
};
