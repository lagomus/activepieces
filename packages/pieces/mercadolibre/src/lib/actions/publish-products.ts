import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import { Attribute, Item, Product } from '../common/models';

export const publish_products = createAction({
  name: 'publish_products',
  auth: meliAuth,
  displayName: 'Publish Products',
  description: 'Publish Products',
  props: {
    product: Property.Json({
      displayName: 'Product',
      description: 'Product',
      required: true,
    }),
    cdnBaseUrl: Property.ShortText({
      displayName: 'CDN Base URL',
      description: 'CDN Base URL',
      required: true,
    }),
  },
  async run(context) {
    const item = context.propsValue['product'] as Product;
    const cdnBaseUrl = context.propsValue['cdnBaseUrl'];
    const token = context.auth.access_token;

    const categoryId = getCategoryId(item.attributeSetName);

    if (categoryId) {
      const persistedAttrs = await context.store.get<string>(categoryId);
      let attributes = persistedAttrs ? JSON.parse(persistedAttrs) : undefined;
      if (!attributes) {
        attributes = (
          await httpClient.sendRequest<Attribute[]>({
            method: HttpMethod.GET,
            headers: { Authorization: `Bearer ${token}` },
            url: `https://api.mercadolibre.com/categories/${categoryId}/attributes`,
          })
        ).body;
        await context.store.put<string>(categoryId, JSON.stringify(attributes));
      }

      const body = generateProduct(item, attributes, cdnBaseUrl);

      try {
        await httpClient.sendRequest<Item>({
          method: HttpMethod.POST,
          headers: { Authorization: `Bearer ${token}` },
          url: 'https://api.mercadolibre.com/items',
          body: body,
        });
      } catch (e) {
        context.store.put<string>(item.id, JSON.stringify(e));
      }
    }

    return {
      result: 'completed',
    };
  },
});

function getCategoryId(name?: string) {
  return name?.split('__')[1];
}

function getAttributeOption(value: string) {
  return value?.split('--')[1].replaceAll('-', '');
}
function getAttributesValues(item: Product, attributes: Attribute[]) {
  return attributes
    .map((a) => ({
      id: a.id,
      ...(a.values && { value_id: getAttributeOption(item.attributes[a.id]) }),
      ...(!a.values && { value_name: item.attributes[a.id] }),
    }))
    .filter((v) => v.value_id !== undefined || v.value_name !== undefined);
}

function generateProduct(
  item: Product,
  attributes: Attribute[],
  cdnBaseUrl: string
) {
  return {
    title: item.attributes.name,
    category_id: getCategoryId(item.attributeSetName),
    price: item.price,
    currency_id: 'ARS',
    available_quantity: item.qty,
    description: item.attributes['shortDescription'],
    pictures: item.attributes['images']?.map((i) => ({
      source: `${cdnBaseUrl}/${i.id}`,
    })),
    listing_type_id: 'gold_special',
    attributes: getAttributesValues(item, attributes),
  };
}
