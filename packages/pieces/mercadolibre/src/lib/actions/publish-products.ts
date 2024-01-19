import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
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

    // check wether the product is already published
    const sku = item.attributes['sku'];
    const mlaId = await context.store.get<string>(sku, StoreScope.FLOW);

    if (mlaId !== undefined && mlaId !== null) {
      // EDIT EXISTING PRODUCT
      try {
        await httpClient.sendRequest<Item>({
          method: HttpMethod.PUT,
          headers: { Authorization: `Bearer ${token}` },
          url: `https://api.mercadolibre.com/items/${mlaId}`,
          body: {
            ...{ available_quantity: item.qty },
            ...{ price: item.price },
            ...{
              pictures: item.attributes['images']?.map((i) => ({
                source: `${cdnBaseUrl}/${i.id}`,
              })),
            },
          },
        });

        await httpClient.sendRequest<Item>({
          method: HttpMethod.PUT,
          headers: { Authorization: `Bearer ${token}` },
          url: `https://api.mercadolibre.com/items/${mlaId}/description?api_version=2`,
          body: {
            plain_text: item.attributes['shortDescription'],
          },
        });
      } catch (e) {
        context.store.put<string>(
          item.id,
          JSON.stringify(e),
          StoreScope.PROJECT
        );
      }
    } else {
      // PUBLISH NEW PRODUCT
      const categoryId = getCategoryId(item.attributeSetName);

      if (categoryId) {
        const persistedAttrs = await context.store.get<string>(
          categoryId,
          StoreScope.FLOW
        );
        let attributes = persistedAttrs
          ? JSON.parse(persistedAttrs)
          : undefined;
        if (!attributes) {
          attributes = (
            await httpClient.sendRequest<Attribute[]>({
              method: HttpMethod.GET,
              headers: { Authorization: `Bearer ${token}` },
              url: `https://api.mercadolibre.com/categories/${categoryId}/attributes`,
            })
          ).body;
          await context.store.put<string>(
            categoryId,
            JSON.stringify(attributes),
            StoreScope.FLOW
          );
        }

        const body = generateProduct(item, attributes, cdnBaseUrl);

        try {
          const published = await httpClient.sendRequest<Item>({
            method: HttpMethod.POST,
            headers: { Authorization: `Bearer ${token}` },
            url: 'https://api.mercadolibre.com/items',
            body: body,
          });
          await context.store.put<string>(
            item.attributes['sku'],
            published.body.id
          );
        } catch (e) {
          context.store.put<string>(
            item.id,
            JSON.stringify(e),
            StoreScope.PROJECT
          );
        }
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
    description: { plain_text: item.attributes['shortDescription'] },
    pictures: item.attributes['images']?.map((i) => ({
      source: `${cdnBaseUrl}/${i.id}`,
    })),
    listing_type_id: 'gold_special',
    attributes: getAttributesValues(item, attributes),
  };
}
