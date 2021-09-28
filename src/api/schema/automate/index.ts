import * as Automate from '@models/Automate/Entity';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { Request } from 'express';
import container from '@container';
import { tableName as walletTableName } from '@models/Wallet/Entity';
import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from 'graphql';
import {
  DateTimeType,
  onlyAllowed,
  PaginateList,
  PaginationArgument,
  SortArgument,
  UuidType,
} from '../types';
import * as Actions from '../../../automate/action';
import * as Conditions from '../../../automate/condition';
import { WalletType } from '../user';
import { ProtocolType } from '../protocol';

export const ConditionTypeEnum = new GraphQLEnumType({
  name: 'AutomateConditionTypeEnum',
  values: Object.keys(Conditions).reduce(
    (res, handler) => ({ ...res, [handler]: { value: handler } }),
    {} as GraphQLEnumValueConfigMap,
  ),
});

export const ConditionType = new GraphQLObjectType<Automate.Condition>({
  name: 'AutomateConditionType',
  fields: {
    id: {
      type: GraphQLNonNull(UuidType),
      description: 'Identificator',
    },
    type: {
      type: GraphQLNonNull(ConditionTypeEnum),
      description: 'Type',
    },
    params: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Condition parameters',
      resolve: ({ params }) => JSON.stringify(params),
    },
    priority: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Execution priority (ascending)',
    },
    createdAt: {
      type: GraphQLNonNull(DateTimeType),
      description: 'Created at date',
    },
  },
});

export const ActionTypeEnum = new GraphQLEnumType({
  name: 'AutomateActionTypeEnum',
  values: Object.keys(Actions).reduce(
    (res, handler) => ({ ...res, [handler]: { value: handler } }),
    {} as GraphQLEnumValueConfigMap,
  ),
});

export const ActionType = new GraphQLObjectType<Automate.Action>({
  name: 'AutomateActionType',
  fields: {
    id: {
      type: GraphQLNonNull(UuidType),
      description: 'Identificator',
    },
    type: {
      type: GraphQLNonNull(ActionTypeEnum),
      description: 'Type',
    },
    params: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Condition parameters',
      resolve: ({ params }) => JSON.stringify(params),
    },
    priority: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Execution priority (ascending)',
    },
    createdAt: {
      type: GraphQLNonNull(DateTimeType),
      description: 'Created at date',
    },
  },
});

export const TriggerTypeEnum = new GraphQLEnumType({
  name: 'AutomateTriggerTypeEnum',
  values: Object.values(Automate.TriggerType).reduce(
    (res, value) => ({ ...res, [value]: { value } }),
    {} as GraphQLEnumValueConfigMap,
  ),
});

export const TriggerType = new GraphQLObjectType<Automate.Trigger>({
  name: 'AutomateTriggerType',
  fields: {
    id: {
      type: GraphQLNonNull(UuidType),
      description: 'Identificator',
    },
    type: {
      type: GraphQLNonNull(TriggerTypeEnum),
      description: 'Type',
    },
    params: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Trigger parameters',
      resolve: ({ params }) => JSON.stringify(params),
    },
    wallet: {
      type: GraphQLNonNull(WalletType),
      description: 'Wallet of owner',
      resolve: ({ wallet }) => {
        return container.model.walletTable().where('id', wallet).first();
      },
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Name',
    },
    active: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Is trigger active',
    },
    lastCallAt: {
      type: DateTimeType,
      description: 'Date of last call',
    },
    createdAt: {
      type: GraphQLNonNull(DateTimeType),
      description: 'Created at date',
    },
    conditions: {
      type: GraphQLNonNull(
        PaginateList('AutomateConditionListType', GraphQLNonNull(ConditionType)),
      ),
      args: {
        filter: {
          type: new GraphQLInputObjectType({
            name: 'AutomateConditionListFilterInputType',
            fields: {
              id: {
                type: UuidType,
              },
              type: {
                type: ConditionTypeEnum,
              },
            },
          }),
          defaultValue: {},
        },
        sort: SortArgument(
          'AutomateConditionListSortInputType',
          ['priority'],
          [{ column: 'priority', order: 'asc' }],
        ),
        pagination: PaginationArgument('AutomateConditionListPaginationInputType'),
      },
      resolve: async (trigger, { filter, sort, pagination }) => {
        const select = container.model.automateConditionTable().where(function () {
          this.where('trigger', trigger.id);

          const { id, type } = filter;
          if (id) {
            return this.andWhere('id', id);
          }

          if (type) {
            this.andWhere('type', type);
          }
          return null;
        });

        return {
          list: await select
            .clone()
            .orderBy(sort)
            .limit(pagination.limit)
            .offset(pagination.offset),
          pagination: {
            count: await select.clone().count().first(),
          },
        };
      },
    },
    actions: {
      type: GraphQLNonNull(PaginateList('AutomateActionListType', GraphQLNonNull(ActionType))),
      args: {
        filter: {
          type: new GraphQLInputObjectType({
            name: 'AutomateActionListFilterInputType',
            fields: {
              id: {
                type: UuidType,
              },
              type: {
                type: ConditionTypeEnum,
              },
            },
          }),
          defaultValue: {},
        },
        sort: SortArgument(
          'AutomateActionListSortInputType',
          ['priority'],
          [{ column: 'priority', order: 'asc' }],
        ),
        pagination: PaginationArgument('AutomateActionListPaginationInputType'),
      },
      resolve: async (trigger, { filter, sort, pagination }) => {
        const select = container.model.automateActionTable().where(function () {
          this.where('trigger', trigger.id);

          const { id, type } = filter;
          if (id) {
            return this.andWhere('id', id);
          }

          if (type) {
            this.andWhere('type', type);
          }
          return null;
        });

        return {
          list: await select
            .clone()
            .orderBy(sort)
            .limit(pagination.limit)
            .offset(pagination.offset),
          pagination: {
            count: await select.clone().count().first(),
          },
        };
      },
    },
  },
});

export const TriggerQuery: GraphQLFieldConfig<any, Request> = {
  type: TriggerType,
  args: {
    filter: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateTriggerFilterInputType',
          fields: {
            id: {
              type: GraphQLNonNull(UuidType),
            },
          },
        }),
      ),
    },
  },
  resolve: async (root, { filter }) => {
    return container.model.automateTriggerTable().where('id', filter.id).first();
  },
};

export const TriggerListQuery: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(PaginateList('AutomateTriggerListQuery', GraphQLNonNull(TriggerType))),
  args: {
    filter: {
      type: new GraphQLInputObjectType({
        name: 'AutomateTriggerListFilterInputType',
        fields: {
          user: {
            type: UuidType,
          },
          wallet: {
            type: UuidType,
          },
          active: {
            type: GraphQLBoolean,
          },
          search: {
            type: GraphQLString,
          },
        },
      }),
      defaultValue: {},
    },
    sort: SortArgument(
      'AutomateTriggerListSortInputType',
      ['id', 'name', 'createdAt'],
      [{ column: 'name', order: 'asc' }],
    ),
    pagination: PaginationArgument('AutomateTriggerListPaginationInputType'),
  },
  resolve: async (root, { filter, sort, pagination }) => {
    const select = container.model
      .automateTriggerTable()
      .innerJoin(
        walletTableName,
        `${walletTableName}.id`,
        '=',
        `${Automate.triggerTableName}.wallet`,
      )
      .where(function () {
        const { active, search, wallet, user } = filter;
        if (typeof user === 'string') {
          this.andWhere(`${walletTableName}.user`, user);
        }
        if (typeof wallet === 'string') {
          this.andWhere(`${Automate.triggerTableName}.wallet`, wallet);
        }
        if (typeof active === 'boolean') {
          this.andWhere(`${Automate.triggerTableName}.active`, active);
        }
        if (typeof search === 'string' && search !== '') {
          this.andWhere(`${Automate.triggerTableName}.name`, 'iLike', `%${search}%`);
        }
      });

    return {
      list: await select
        .clone()
        .distinct(`${Automate.triggerTableName}.*`)
        .orderBy(sort)
        .limit(pagination.limit)
        .offset(pagination.offset),
      pagination: {
        count: await select.clone().countDistinct(`${Automate.triggerTableName}.id`).first(),
      },
    };
  },
};

export const TriggerCreateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(TriggerType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateTriggerCreateInputType',
          fields: {
            wallet: {
              type: GraphQLNonNull(UuidType),
              description: 'Wallet owner',
            },
            type: {
              type: GraphQLNonNull(TriggerTypeEnum),
              description: 'Type',
            },
            params: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Parameters',
            },
            name: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Name',
            },
            active: {
              type: GraphQLBoolean,
              description: 'Is active',
              defaultValue: true,
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateTrigger.create', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { wallet: walletId, type, params, name, active } = input;
    const wallet = await container.model.walletTable().where('id', walletId).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    const created = await container.model
      .automateService()
      .createTrigger(wallet, { type, params: JSON.parse(params) }, name, active);

    return created;
  }),
};

export const TriggerUpdateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(TriggerType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateTriggerUpdateInputType',
          fields: {
            id: {
              type: GraphQLNonNull(UuidType),
              description: 'Trigger identifier',
            },
            name: {
              type: GraphQLString,
              description: 'Name',
            },
            params: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Parameters',
            },
            active: {
              type: GraphQLBoolean,
              description: 'Is active',
              defaultValue: true,
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateTrigger.update-own', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { id, name, params, active } = input;
    const trigger = await container.model.automateTriggerTable().where('id', id).first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    const updated = await container.model.automateService().updateTrigger({
      ...trigger,
      params: typeof params === 'string' ? JSON.parse(params) : trigger.params,
      name: typeof name === 'string' ? name : trigger.name,
      active: typeof active === 'boolean' ? active : trigger.active,
    });

    return updated;
  }),
};

export const TriggerDeleteMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(GraphQLBoolean),
  args: {
    id: {
      type: GraphQLNonNull(UuidType),
    },
  },
  resolve: onlyAllowed('automateTrigger.delete-own', async (root, { id }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const trigger = await container.model.automateTriggerTable().where('id', id).first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    await container.model.automateService().deleteTrigger(trigger);

    return true;
  }),
};

export const ConditionCreateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(ConditionType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateConditionCreateInputType',
          fields: {
            trigger: {
              type: GraphQLNonNull(UuidType),
              description: 'Trigger',
            },
            type: {
              type: GraphQLNonNull(ConditionTypeEnum),
              description: 'Type',
            },
            params: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Parameters',
            },
            priority: {
              type: GraphQLInt,
              description: 'Execution priority (ascending)',
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateCondition.create', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { trigger: triggerId, type, params } = input;
    const trigger = await container.model.automateTriggerTable().where('id', triggerId).first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    let { priority } = input;
    if (typeof priority !== 'number') {
      const conditionCountRow = await container.model
        .automateConditionTable()
        .where('trigger', trigger.id)
        .count()
        .first();
      priority = conditionCountRow?.count || 0;
    }

    const created = await container.model
      .automateService()
      .createCondition(trigger, type, JSON.parse(params), priority);

    return created;
  }),
};

export const ConditionUpdateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(ConditionType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateConditionUpdateInputType',
          fields: {
            id: {
              type: GraphQLNonNull(UuidType),
              description: 'Condition identifier',
            },
            params: {
              type: GraphQLString,
              description: 'Parameters',
            },
            priority: {
              type: GraphQLInt,
              description: 'Execution priority (ascending)',
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateCondition.update-own', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { id, params, priority } = input;
    const condition = await container.model.automateConditionTable().where('id', id).first();
    if (!condition) throw new UserInputError('Condition not found');

    const trigger = await container.model
      .automateTriggerTable()
      .where('id', condition.trigger)
      .first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    const updated = await container.model.automateService().updateCondition({
      ...condition,
      params: typeof params === 'string' ? JSON.parse(params) : condition.params,
      priority: typeof priority === 'number' ? priority : condition.priority,
    });

    return updated;
  }),
};

export const ConditionDeleteMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(GraphQLBoolean),
  args: {
    id: {
      type: GraphQLNonNull(UuidType),
    },
  },
  resolve: onlyAllowed('automateCondition.delete-own', async (root, { id }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const condition = await container.model.automateConditionTable().where('id', id).first();
    if (!condition) throw new UserInputError('Condition not found');

    const trigger = await container.model
      .automateTriggerTable()
      .where('id', condition.trigger)
      .first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    await container.model.automateService().deleteCondition(condition);

    return true;
  }),
};

export const ActionCreateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(ActionType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateActionCreateInputType',
          fields: {
            trigger: {
              type: GraphQLNonNull(UuidType),
              description: 'Trigger',
            },
            type: {
              type: GraphQLNonNull(ActionTypeEnum),
              description: 'Type',
            },
            params: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Parameters',
            },
            priority: {
              type: GraphQLInt,
              description: 'Execution priority (ascending)',
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateAction.create', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { trigger: triggerId, type, params } = input;
    const trigger = await container.model.automateTriggerTable().where('id', triggerId).first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    let { priority } = input;
    if (typeof priority !== 'number') {
      const actionCountRow = await container.model
        .automateActionTable()
        .where('trigger', trigger.id)
        .count()
        .first();
      priority = actionCountRow?.count || 0;
    }

    const created = await container.model
      .automateService()
      .createAction(trigger, type, JSON.parse(params), priority);

    return created;
  }),
};

export const ActionUpdateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(ActionType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateActionUpdateInputType',
          fields: {
            id: {
              type: GraphQLNonNull(UuidType),
              description: 'Action identifier',
            },
            params: {
              type: GraphQLString,
              description: 'Parameters',
            },
            priority: {
              type: GraphQLInt,
              description: 'Execution priority (ascending)',
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateAction.update-own', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { id, params, priority } = input;
    const action = await container.model.automateActionTable().where('id', id).first();
    if (!action) throw new UserInputError('Action not found');

    const trigger = await container.model
      .automateTriggerTable()
      .where('id', action.trigger)
      .first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    const updated = await container.model.automateService().updateAction({
      ...action,
      params: typeof params === 'string' ? JSON.parse(params) : action.params,
      priority: typeof priority === 'number' ? priority : action.priority,
    });

    return updated;
  }),
};

export const ActionDeleteMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(GraphQLBoolean),
  args: {
    id: {
      type: GraphQLNonNull(UuidType),
    },
  },
  resolve: onlyAllowed('automateAction.delete-own', async (root, { id }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const action = await container.model.automateActionTable().where('id', id).first();
    if (!action) throw new UserInputError('Condition not found');

    const trigger = await container.model
      .automateTriggerTable()
      .where('id', action.trigger)
      .first();
    if (!trigger) throw new UserInputError('Trigger not found');

    const wallet = await container.model.walletTable().where('id', trigger.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    await container.model.automateService().deleteAction(action);

    return true;
  }),
};

export const ContractVerificationStatusEnum = new GraphQLEnumType({
  name: 'AutomateContractVerificationStatusEnum',
  values: Object.values(Automate.ContractVerificationStatus).reduce(
    (res, value) => ({ ...res, [value]: { value } }),
    {} as GraphQLEnumValueConfigMap,
  ),
});

export const ContractType = new GraphQLObjectType<Automate.Contract>({
  name: 'AutomateContractType',
  fields: {
    id: {
      type: GraphQLNonNull(UuidType),
      description: 'Identificator',
    },
    wallet: {
      type: GraphQLNonNull(WalletType),
      description: 'Owner wallet',
      resolve: (contract) => {
        return container.model.walletTable().where('id', contract.wallet).first();
      },
    },
    protocol: {
      type: GraphQLNonNull(ProtocolType),
      description: 'Protocol',
      resolve: (contract) => {
        return container.model.protocolTable().where('id', contract.protocol).first();
      },
    },
    address: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Address in blockchain',
    },
    adapter: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Adapter name',
    },
    initParams: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Init method parameters',
      resolve: ({ initParams }) => JSON.stringify(initParams),
    },
    verification: {
      type: GraphQLNonNull(ContractVerificationStatusEnum),
      description: 'Verification status',
    },
    rejectReason: {
      type: GraphQLNonNull(GraphQLString),
    },
  },
});

export const ContractListQuery: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(PaginateList('AutomateContractListQuery', GraphQLNonNull(ContractType))),
  args: {
    filter: {
      type: new GraphQLInputObjectType({
        name: 'AutomateContractListFilterInputType',
        fields: {
          user: {
            type: UuidType,
          },
          wallet: {
            type: UuidType,
          },
          protocol: {
            type: UuidType,
          },
          address: {
            type: GraphQLList(GraphQLNonNull(GraphQLString)),
          },
        },
      }),
      defaultValue: {},
    },
    sort: SortArgument(
      'AutomateContractListSortInputType',
      ['createdAt'],
      [{ column: 'createdAt', order: 'asc' }],
    ),
    pagination: PaginationArgument('AutomateContractListPaginationInputType'),
  },
  resolve: async (root, { filter, sort, pagination }) => {
    const select = container.model
      .automateContractTable()
      .innerJoin(
        walletTableName,
        `${walletTableName}.id`,
        '=',
        `${Automate.contractTableName}.wallet`,
      )
      .where(function () {
        const { wallet, user, protocol, address } = filter;
        if (typeof user === 'string') {
          this.andWhere(`${walletTableName}.user`, user);
        }
        if (typeof wallet === 'string') {
          this.andWhere(`${Automate.contractTableName}.wallet`, wallet);
        }
        if (typeof protocol === 'string') {
          this.andWhere(`${Automate.contractTableName}.protocol`, protocol);
        }
        if (Array.isArray(address) && address.length > 0) {
          this.whereIn(`${Automate.contractTableName}.address`, address);
        }
      });

    return {
      list: await select
        .clone()
        .distinct(`${Automate.contractTableName}.*`)
        .orderBy(sort)
        .limit(pagination.limit)
        .offset(pagination.offset),
      pagination: {
        count: await select.clone().countDistinct(`${Automate.contractTableName}.id`).first(),
      },
    };
  },
};

export const ContractCreateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(ContractType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateContractCreateInputType',
          fields: {
            wallet: {
              type: GraphQLNonNull(UuidType),
              description: 'Wallet owner',
            },
            protocol: {
              type: GraphQLNonNull(UuidType),
              description: 'Protocol',
            },
            address: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Address',
            },
            adapter: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Adapter name',
            },
            initParams: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Init method parameters',
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateContract.create', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { wallet: walletId, protocol: protocolId, address, adapter, initParams } = input;
    const wallet = await container.model.walletTable().where('id', walletId).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    const protocol = await container.model.protocolTable().where('id', protocolId).first();
    if (!protocol) throw new UserInputError('Protocol not found');

    const created = await container.model
      .automateService()
      .createContract(wallet, protocol, address, adapter, JSON.parse(initParams));

    return created;
  }),
};

export const ContractUpdateMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(ContractType),
  args: {
    input: {
      type: GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'AutomateContractUpdateInputType',
          fields: {
            id: {
              type: GraphQLNonNull(UuidType),
              description: 'Contract identifier',
            },
            initParams: {
              type: GraphQLString,
              description: 'Init method parameters',
            },
          },
        }),
      ),
    },
  },
  resolve: onlyAllowed('automateContract.update-own', async (root, { input }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const { id, initParams } = input;
    const contract = await container.model.automateContractTable().where('id', id).first();
    if (!contract) throw new UserInputError('Contract not found');

    const wallet = await container.model.walletTable().where('id', contract.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    const updated = await container.model.automateService().updateContract({
      ...contract,
      initParams: typeof initParams === 'string' ? JSON.parse(initParams) : contract.initParams,
    });

    return updated;
  }),
};

export const ContractDeleteMutation: GraphQLFieldConfig<any, Request> = {
  type: GraphQLNonNull(GraphQLBoolean),
  args: {
    id: {
      type: GraphQLNonNull(UuidType),
    },
  },
  resolve: onlyAllowed('automateContract.delete-own', async (root, { id }, { currentUser }) => {
    if (!currentUser) throw new AuthenticationError('UNAUTHENTICATED');

    const contract = await container.model.automateContractTable().where('id', id).first();
    if (!contract) throw new UserInputError('Contract not found');

    const wallet = await container.model.walletTable().where('id', contract.wallet).first();
    if (!wallet) throw new UserInputError('Wallet not found');
    if (wallet.user !== currentUser.id) throw new UserInputError('Foreign wallet');

    await container.model.automateService().deleteContract(contract);

    return true;
  }),
};