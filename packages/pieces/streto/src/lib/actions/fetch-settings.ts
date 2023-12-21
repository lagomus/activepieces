import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const fetch_settings = createAction({
  name: 'fetch_settings',
  auth: stretoAuth,
  displayName: 'Fetch Settings',
  description:
    'Fetch settings from streto. Specify code/s or select them from previous step',
  props: {
    filter_codes: Property.Array({
      displayName: 'Filter Codes',
      description: undefined,
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const codes = context.propsValue['filter_codes'];
    let url = `${context.auth.baseUrl}/app/settings/all`;
    let settings = {};
    if (codes && codes?.length > 0) {
      url = `${context.auth.baseUrl}/app/settings/all?filter={"where":{"code":${codes}}}`;
      settings = await httpClient
        .sendRequest<Settings>({
          method: HttpMethod.GET,
          headers: {
            'x-api-key': context.auth.apiKey,
          },
          url,
        })
        .then((r) => (settings = r.status === 200 ? r.body : {}))
        .catch(() => {
          return {};
        });
    }

    return {
      settings,
    };
  },
});
