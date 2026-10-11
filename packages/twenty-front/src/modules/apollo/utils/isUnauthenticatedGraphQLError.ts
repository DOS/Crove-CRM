import { type GraphQLFormattedError } from 'graphql';

<<<<<<< HEAD
// Guards that throw before the UNAUTHENTICATED code is attached reach the
// client as a bare "Unauthorized" message or token expiration messages.
=======
// Guards that throw before UNAUTHENTICATED is attached reach the client as a bare "Unauthorized".
>>>>>>> twenty/v2.45.0
export const isUnauthenticatedGraphQLError = (
  graphQLError: GraphQLFormattedError,
): boolean =>
  graphQLError.extensions?.code === 'UNAUTHENTICATED' ||
  graphQLError.message === 'Unauthorized' ||
  graphQLError.message === 'Token has expired.' ||
  graphQLError.message === 'Token invalid.' ||
  graphQLError.message === 'You must be authenticated to perform this action.';
