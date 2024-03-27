import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const save_attributes = createAction({
  name: 'save_attributes',
  auth: stretoAuth,
  displayName: 'Save Attributes',
  description:
    'Transform Mercadolibre attributes and save Attributes and Attribute Sets retrieving values from local DB',
  props: {
    attributeKey: Property.ShortText({
      displayName: 'Attributes DB Key',
      description: 'Key name where the attributes are stored in DB',
      required: true,
      defaultValue: 'ATTRIBUTE_LIST',
    }),
    attributeSetKey: Property.ShortText({
      displayName: 'Attribute Sets DB Key',
      description: 'Key name where the attribute sets are stored in DB',
      required: true,
      defaultValue: 'ATTRIBUTE_SET_LIST',
    }),
  },
  async run(context) {
    let resAttr = undefined;
    let resAttrSet = undefined;

    const attributeKey = context.propsValue['attributeKey'];
    const attributeSetKey = context.propsValue['attributeSetKey'];

    const attributes = (await context.store.get<string>(
      attributeKey,
      StoreScope.FLOW
    )) as string;
    const attributeSets = (await context.store.get<string>(
      attributeSetKey,
      StoreScope.FLOW
    )) as string;

    if (attributes) {
      const attrValues = removeDuplicates(JSON.parse(attributes), 'code');

      console.debug(`Attribute list length: ${attrValues.length}`);

      resAttr = await httpClient.sendRequest<{ id: string }>({
        method: HttpMethod.POST,
        headers: {
          'x-api-key': context.auth.apiKey,
          'Content-Type': 'application/json',
        },
        url: `${context.auth.baseUrl}/app/import-processes/attribute/import?source=json`,
        body: attrValues.map((attr) => ({
          code: attr.code,
          title: attr.title,
          type: attr.type,
          searchable: attr.searchable,
          filterable: attr.filterable,
          sortable: attr.sortable,
          options: attr.options,
        })),
      });
    }

    if (attributeSets) {
      const attrSetvalues = removeDuplicates(JSON.parse(attributeSets), 'name');

      console.debug(`Attribute Set list length: ${attrSetvalues.length}`);

      resAttrSet = await httpClient.sendRequest<{ id: string }>({
        method: HttpMethod.POST,
        headers: {
          'x-api-key': context.auth.apiKey,
          'Content-Type': 'application/json',
        },
        url: `${context.auth.baseUrl}/app/import-processes/attribute-set/import?source=json`,
        body: attrSetvalues,
      });
    }

    return {
      attrProcessId: resAttr?.body.id,
      attrSetProcessId: resAttrSet?.body.id,
    };
  },
});

function removeDuplicates(sourceList: any[], itemField: string) {
  const seen = new Set();
  return sourceList.filter((item) => {
    const value = item[itemField];
    if (seen.has(value)) {
      return false;
    } else {
      seen.add(value);
      return true;
    }
  });
}
