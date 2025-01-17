import { Express, Request } from 'express';
import { Server } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { json } from 'body-parser';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { AuthEthereumMutation, UserType } from './schema/user';
import { currentUser } from './middlewares/currentUser';
import {
  ProtocolCreateMutation,
  ProtocolDeleteMutation,
  ProtocolListQuery,
  ProtocolQuery,
  ProtocolUpdateMutation,
  ContractCreateMutation,
  ContractUpdateMutation,
  ContractDeleteMutation,
  ContractWalletLinkMutation,
  ContractWalletUnlinkMutation,
} from './schema/protocol';
import {
  ProposalCreateMutation,
  ProposalDeleteMutation,
  ProposalListQuery,
  ProposalQuery,
  ProposalUpdateMutation,
  UnvoteMutation,
  VoteMutation,
} from './schema/proposal';

export function route({ express, server }: { express: Express; server: Server }) {
  const apollo = new ApolloServer({
    schema: new GraphQLSchema({
      query: new GraphQLObjectType<undefined, Request>({
        name: 'Query',
        fields: {
          ping: {
            type: GraphQLNonNull(GraphQLString),
            resolve: () => 'pong',
          },
          me: {
            type: UserType,
            resolve: (root, args, { currentUser }) => currentUser,
          },
          protocol: ProtocolQuery,
          protocols: ProtocolListQuery,
          proposal: ProposalQuery,
          proposals: ProposalListQuery,
        },
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          authEth: AuthEthereumMutation,
          protocolCreate: ProtocolCreateMutation,
          protocolUpdate: ProtocolUpdateMutation,
          protocolDelete: ProtocolDeleteMutation,
          contractCreate: ContractCreateMutation,
          contractUpdate: ContractUpdateMutation,
          contractDelete: ContractDeleteMutation,
          contractWalletLink: ContractWalletLinkMutation,
          contractWalletUnlink: ContractWalletUnlinkMutation,
          proposalCreate: ProposalCreateMutation,
          proposalUpdate: ProposalUpdateMutation,
          proposalDelete: ProposalDeleteMutation,
          vote: VoteMutation,
          unvote: UnvoteMutation,
        },
      }),
    }),
    subscriptions: '/api',
    playground: true,
    context: ({ req }) => req,
  });
  apollo.installSubscriptionHandlers(server);
  express.use('/api', [json(), currentUser, apollo.getMiddleware({ path: '/' })]);
}
