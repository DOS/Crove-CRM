import { gql } from '@apollo/client';
import { WORKSPACE_URLS_FRAGMENT } from '@/users/graphql/fragments/workspaceUrlsFragment';

export const GET_PUBLIC_WORKSPACE_DATA_BY_DOMAIN = gql`
  query GetPublicWorkspaceDataByDomain($origin: String!) {
    getPublicWorkspaceDataByDomain(origin: $origin) {
      id
      logo
      displayName
      workspaceUrls {
        ...WorkspaceUrlsFragment
      }
      authProviders {
        sso {
          id
          name
          type
          status
          issuer
        }
        google
        magicLink
        password
        microsoft
        dosId
      }
      authBypassProviders {
        google
        password
        microsoft
        dosId
      }
    }
  }
  ${WORKSPACE_URLS_FRAGMENT}
`;
