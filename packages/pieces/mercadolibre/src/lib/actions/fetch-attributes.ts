import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import { MeliAttribute, Category } from '../common/models';

export const fetch_attributes = createAction({
  name: 'fetch_attributes',
  auth: meliAuth,
  displayName: 'Fetch Attributes',
  description: 'Fetch Attributes and keep the result in local DB',
  props: {
    category: Property.Json({
      displayName: 'Category',
      description: 'Category',
      required: true,
    }),
  },
  async run(context) {
    const category: Category = context.propsValue['category'] as Category;
    const token = context.auth.access_token;

    const attrs = await httpClient.sendRequest<MeliAttribute[]>({
      method: HttpMethod.GET,
      headers: { Authorization: `Bearer ${token}` },
      url: `https://api.mercadolibre.com/categories/${category.id}/attributes`,
    });

    const attributes = attrs.body?.map((item) => ({
      code: item.id,
      title: getAttrName(item),
      description: item.hint,
      type: 'text',
      searchable: 'No',
      filterable: 'No',
      sortable: 'No',
      options: getAttrOptions(item),
    }));

    const attributeSet = {
      name: getCategoryName(category),
      attributes: attributes.map((attr) => attr.code).join(','),
    };

    let attributeList = [];
    let attributeSetList = [];

    if (await context.store.get<string>('ATTRIBUTE_LIST', StoreScope.FLOW)) {
      attributeList = JSON.parse(
        (await context.store.get<string>(
          'ATTRIBUTE_LIST',
          StoreScope.FLOW
        )) as string
      );
    }

    if (
      await context.store.get<string>('ATTRIBUTE_SET_LIST', StoreScope.FLOW)
    ) {
      attributeSetList = JSON.parse(
        (await context.store.get<string>(
          'ATTRIBUTE_SET_LIST',
          StoreScope.FLOW
        )) as string
      );
    }

    attributeList = [...attributeList, ...attributes];
    attributeSetList = [...attributeSetList, attributeSet];

    await Promise.all([
      context.store.put(
        'ATTRIBUTE_LIST',
        JSON.stringify(attributeList),
        StoreScope.FLOW
      ),
      context.store.put(
        'ATTRIBUTE_SET_LIST',
        JSON.stringify(attributeSetList),
        StoreScope.FLOW
      ),
    ]);

    return {
      result: 'success',
    };
  },
});

function removeAccents(text?: string) {
  return text
    ? text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replaceAll(',', '')
    : '';
}

function getAttrOptions(item: MeliAttribute) {
  if (item.values) {
    return item.values
      .map((v) => removeAccents(`${v.name} (${v.id})`))
      .join(',');
  }
  return undefined;
}

function getAttrName(item: MeliAttribute) {
  if (item.allowed_units) {
    return removeAccents(`${item.name} (${item.default_unit})`);
  }
  return removeAccents(item.name);
}

function getCategoryName(category: Category) {
  if (category.name === 'Otros') {
    const parent = category.path_from_root
      ? category.path_from_root[category.path_from_root.length - 2]
      : { name: '' };
    return removeAccents(`${category.name} ${parent.name}__${category.id}`);
  }
  return removeAccents(`${category.name}__${category.id}`);
}
