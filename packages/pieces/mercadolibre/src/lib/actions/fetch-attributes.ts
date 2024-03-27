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
  displayName: 'Fetch Category Attributes',
  description:
    'Fetch Mercadolibre attributes by category and generate Streto attributes and attribute sets keeping the result in local DB',
  props: {
    category: Property.Json({
      displayName: 'Category',
      description: 'Category Item from previous step',
      required: true,
    }),
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
    const category: Category = context.propsValue['category'] as Category;
    const attributeKey = context.propsValue['attributeKey'];
    const attributeSetKey = context.propsValue['attributeSetKey'];
    const token = context.auth.access_token;
    const baseUrl = context.auth.baseUrl;

    const attrs = await httpClient.sendRequest<MeliAttribute[]>({
      method: HttpMethod.GET,
      headers: { Authorization: `Bearer ${token}` },
      url: `${baseUrl}/categories/${category.id}/attributes`,
    });

    const attributes = attrs.body?.map((item) => ({
      code: item.id,
      title: getAttrName(item),
      description: item.hint,
      type: getAttrType(item),
      searchable: 'No',
      filterable: 'No',
      sortable: 'No',
      options: getAttrOptions(item) ?? '',
      required: item.tags?.required ?? false,
      variation: item.tags?.allow_variations ?? false,
    }));

    const attributeSet = {
      name: getCategoryName(category),
      attributes: attributes
        .filter((attr) => !attr.variation)
        .map((attr) => attr.code)
        .join(','),
      requiredAttributes: attributes.filter((attr) => attr.required).join(','),
    };

    let attributeList = [];
    let attributeSetList = [];

    if (await context.store.get<string>(attributeKey, StoreScope.FLOW)) {
      attributeList = JSON.parse(
        (await context.store.get<string>(
          attributeKey,
          StoreScope.FLOW
        )) as string
      );
    }

    if (await context.store.get<string>(attributeSetKey, StoreScope.FLOW)) {
      attributeSetList = JSON.parse(
        (await context.store.get<string>(
          attributeSetKey,
          StoreScope.FLOW
        )) as string
      );
    }

    attributeList = [
      ...attributeList,
      ...attributes.filter((attr) => !attr.variation),
    ];
    attributeSetList = [...attributeSetList, attributeSet];

    await Promise.all([
      context.store.put(
        attributeKey,
        JSON.stringify(attributeList),
        StoreScope.FLOW
      ),
      context.store.put(
        attributeSetKey,
        JSON.stringify(attributeSetList),
        StoreScope.FLOW
      ),
    ]);

    return {
      result: 'success',
      //attributes: attributeList,
      //attributeSets: attributeSetList,
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
  if (item.values && item.values.length > 0) {
    return item.values.map((v) => removeAccents(`${v.id}:${v.name}`)).join(',');
  }
  return undefined;
}

function getAttrName(item: MeliAttribute) {
  if (item.allowed_units) {
    return removeAccents(`${item.name} (${item.default_unit})`);
  }
  return removeAccents(item.name);
}

function getAttrType(item: MeliAttribute) {
  if (item.value_type === 'number_unit') {
    return 'number';
  }
  return 'text';
}

function getCategoryName(category: Category) {
  if (category.name === 'Otros') {
    const parent = category.path_from_root
      ? category.path_from_root[category.path_from_root.length - 2]
      : { name: '' };
    return removeAccents(`${category.name} ${parent.name} - ${category.id}`);
  }
  return removeAccents(`${category.name} - ${category.id}`);
}
