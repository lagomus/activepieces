import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const fetch_attributes = createAction({
  name: 'fetch_attributes',
  auth: stretoAuth,
  displayName: 'Fetch Attributes',
  description: 'Fetch Attributes',
  props: {
    system: Property.Checkbox({
      displayName: 'Include system attributes',
      description: 'Include system attributes',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const attrs = await httpClient.sendRequest<Attribute[]>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url: `${context.auth.baseUrl}/app/attributes?filter=${JSON.stringify({
        where: { system: context.propsValue['system'] },
      })}`,
    });

    return {
      attributes: attrs.body,
    };
  },
});
