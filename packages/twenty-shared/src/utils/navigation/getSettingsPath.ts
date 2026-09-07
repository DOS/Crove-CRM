import qs from 'qs';
import { generatePath, type PathParam } from 'react-router-dom';
import { AppPath, type SettingsPath } from '../../types';
import { isDefined } from '../validation';

export const getSettingsPath = <T extends SettingsPath>(
  to: T,
  params?: {
    [key in PathParam<`/${AppPath.Settings}/${T}`>]: string | null;
  },
  queryParams?: Record<string, any>,
  hash?: string,
) => {
  const cleanTo = (typeof to === 'string'
    ? to.replace(/^\/?settings\/?/, '').replace(/^\//, '')
    : to) as T;

  let path = `/${AppPath.Settings}/${cleanTo}`;

  if (isDefined(params)) {
    path = generatePath<`/${AppPath.Settings}/${T}`>(
      `/${AppPath.Settings}/${cleanTo}`,
      params,
    );
  }

  if (isDefined(queryParams)) {
    const filteredParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => isDefined(value)),
    );

    const queryString = qs.stringify(filteredParams);

    if (queryString !== '') {
      path += `?${queryString}`;
    }
  }

  if (isDefined(hash)) {
    path += `#${hash.replace(/^#/, '')}`;
  }

  return path;
};
