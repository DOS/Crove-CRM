import { isDefined } from 'src/utils/is-defined';

export type ZaloApiResponse<TData = unknown> = {
  error: number;
  message: string;
  data?: TData;
};

export type ZaloApiResult<TData = unknown> =
  | {
      ok: true;
      data: TData;
      message: string;
    }
  | {
      ok: false;
      error: string;
      errorCode?: number;
    };

export const zaloApiRequest = async <TData = unknown>({
  endpointUrl,
  accessToken,
  method = 'POST',
  body,
}: {
  endpointUrl: string;
  accessToken: string;
  method?: 'GET' | 'POST';
  body?: unknown;
}): Promise<ZaloApiResult<TData>> => {
  const hasBody = isDefined(body);

  try {
    const response = await fetch(endpointUrl, {
      method,
      headers: {
        access_token: accessToken,
        Authorization: `Bearer ${accessToken}`,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    const json = (await response.json()) as ZaloApiResponse<TData>;

    if (json.error !== 0) {
      return {
        ok: false,
        error: json.message || `Zalo API returned error code ${json.error}`,
        errorCode: json.error,
      };
    }

    return {
      ok: true,
      data: (json.data ?? json) as TData,
      message: json.message || 'Success',
    };
  } catch (error) {
    return {
      ok: false,
      error: `Zalo request exception: ${(error as Error).message}`,
    };
  }
};
