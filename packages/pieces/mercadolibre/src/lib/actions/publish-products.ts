import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import {
  MeliAttribute,
  StretoAttribute,
  Item,
  Product,
} from '../common/models';

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
    attributesField: Property.ShortText({
      displayName: 'Attributes field name',
      description:
        'Specify the storage field name where Streto attributes were stored in the previous step',
      required: true,
    }),
    attributesScope: Property.StaticDropdown({
      displayName: 'Attributes scope',
      description:
        'Specify the storage scope where Streto attributes were stored in the previous step',
      required: true,
      options: {
        options: [
          {
            label: 'Project',
            value: StoreScope.PROJECT,
          },
          {
            label: 'Flow',
            value: StoreScope.FLOW,
          },
        ],
      },
      defaultValue: StoreScope.FLOW,
    }),
  },
  async run(context) {
    const item = context.propsValue['product'] as Product;
    const cdnBaseUrl = context.propsValue['cdnBaseUrl'];
    const token = context.auth.access_token;

    const streto_attributes =
      (await context.store.get<StretoAttribute[]>(
        context.propsValue['attributesField'],
        context.propsValue['attributesScope']
      )) ?? [];

    // check wether the product is already published
    const sku = item.attributes['sku'];

    const mlaId = await context.store.get<string>(sku, StoreScope.FLOW);

    if (mlaId !== undefined && mlaId !== null) {
      // EDIT EXISTING PRODUCT
      try {
        let sold = false;
        const pub = (
          await httpClient.sendRequest<Item>({
            method: HttpMethod.GET,
            headers: { Authorization: `Bearer ${token}` },
            url: `https://api.mercadolibre.com/items/${mlaId}?include_attributes=all`,
          })
        ).body;

        if (pub['sold_quantity'] !== 0) {
          sold = true;
        }

        // edit configurable product
        if (pub?.variations?.length) {
          const variations = processVariations(
            cdnBaseUrl,
            streto_attributes,
            pub?.variations,
            item?.variants || []
          );

          await httpClient.sendRequest<Item>({
            method: HttpMethod.PUT,
            headers: { Authorization: `Bearer ${token}` },
            url: `https://api.mercadolibre.com/items/${mlaId}`,
            body: {
              variations: variations.existing,
            },
          });

          if (variations.added?.length) {
            const items = [
              ...variations.added.values(),
              ...variations.existing.map((v) => ({ id: v.id })).values(),
            ];
            const pictures = variations.added.flatMap((v) =>
              v.picture_ids?.map((pi) => ({ source: pi }))
            );
            const existingPicts =
              pub.pictures?.map((pi) => ({ id: pi.id })) || [];
            await httpClient.sendRequest<Item>({
              method: HttpMethod.PUT,
              headers: { Authorization: `Bearer ${token}` },
              url: `https://api.mercadolibre.com/items/${mlaId}`,
              body: {
                pictures: [...existingPicts, ...pictures],
                variations: items,
              },
            });
          }
        } // edit simple product
        else {
          await httpClient.sendRequest<Item>({
            method: HttpMethod.PUT,
            headers: { Authorization: `Bearer ${token}` },
            url: `https://api.mercadolibre.com/items/${mlaId}`,
            body: {
              ...(!sold && { title: item.attributes.name }),
              available_quantity: item.qty,
              price: item.price,
              pictures: item.attributes['images']?.map((i) => ({
                source: `${cdnBaseUrl}/${i.id}`,
              })),
            },
          });
        }

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
        const persistedMeliAttrs = await context.store.get<string>(
          categoryId,
          StoreScope.FLOW
        );
        let meli_attributes = persistedMeliAttrs
          ? JSON.parse(persistedMeliAttrs)
          : undefined;
        if (!meli_attributes) {
          meli_attributes = (
            await httpClient.sendRequest<MeliAttribute[]>({
              method: HttpMethod.GET,
              headers: { Authorization: `Bearer ${token}` },
              url: `https://api.mercadolibre.com/categories/${categoryId}/attributes`,
            })
          ).body;
          await context.store.put<string>(
            categoryId,
            JSON.stringify(meli_attributes),
            StoreScope.FLOW
          );
        }

        if (item.type === 'simple') {
          const body = generateProduct(item, meli_attributes, cdnBaseUrl);

          try {
            const published = await httpClient.sendRequest<Item>({
              method: HttpMethod.POST,
              headers: { Authorization: `Bearer ${token}` },
              url: 'https://api.mercadolibre.com/items',
              body: body,
            });
            await context.store.put<string>(
              item.attributes['sku'],
              published.body.id,
              StoreScope.FLOW
            );
          } catch (e) {
            context.store.put<string>(
              item.id,
              JSON.stringify(e),
              StoreScope.PROJECT
            );
          }
        } else if (item.type === 'configurable') {
          const body = generateProductVariation(
            item,
            meli_attributes,
            streto_attributes,
            cdnBaseUrl
          );

          try {
            const published = await httpClient.sendRequest<Item>({
              method: HttpMethod.POST,
              headers: { Authorization: `Bearer ${token}` },
              url: 'https://api.mercadolibre.com/items',
              body: body,
            });
            await context.store.put<string>(
              item.attributes['sku'],
              published.body.id,
              StoreScope.FLOW
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
  return value?.split('--')[1]?.replaceAll('-', '');
}
function getAttributesValues(item: Product, attributes: MeliAttribute[]) {
  return attributes
    .map((a) => ({
      id: a.id,
      ...((a.values || a.id !== 'BRAND') && {
        value_id: getAttributeOption(item.attributes[a.id]),
      }),
      ...((!a.values || a.id === 'BRAND') && {
        value_name: item.attributes[a.id],
      }),
    }))
    .filter((v) => v.value_id !== undefined || v.value_name !== undefined);
}

function generateProduct(
  item: Product,
  attributes: MeliAttribute[],
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

function getVariations(
  streto_attributes: StretoAttribute[],
  cdnBaseUrl: string,
  variants?: Product[]
) {
  return variants?.map((variant) => ({
    price: variant.price,
    available_quantity: variant.qty,
    attributes: [{ id: 'SELLER_SKU', value_name: variant.attributes['sku'] }],
    picture_ids: variant.attributes['images']?.map(
      (i) => `${cdnBaseUrl}/${i.id}`
    ),
    sold_quantity: 0,
    attribute_combinations: Object.keys(
      variant.attributes['variantOptions']
    ).map((k) => {
      const attr = streto_attributes.find((a) => a['id'] === k);
      return {
        name: attr?.title,
        value_name:
          attr?.validations?.[0].params.within[
            variant?.attributes.variantOptions[k]
          ],
      };
    }),
  }));
}

function generateProductVariation(
  item: Product,
  meli_attributes: MeliAttribute[],
  streto_attributes: StretoAttribute[],
  cdnBaseUrl: string
) {
  return {
    title: item.attributes.name,
    category_id: getCategoryId(item.attributeSetName),
    price: item.price,
    currency_id: 'ARS',
    available_quantity: item.qty,
    description: { plain_text: item.attributes['shortDescription'] },
    pictures: [
      item.attributes['images']?.map((i) => ({
        source: `${cdnBaseUrl}/${i.id}`,
      })),
      item.variants?.flatMap((v) =>
        v.attributes['images']?.map((i) => ({
          source: `${cdnBaseUrl}/${i.id}`,
        }))
      ),
    ].flat(),
    listing_type_id: 'gold_special',
    attributes: getAttributesValues(item, meli_attributes),
    variations: getVariations(streto_attributes, cdnBaseUrl, item.variants),
  };
}

function processVariations(
  cdnBaseUrl: string,
  streto_attributes: StretoAttribute[],
  meli_variations: any[],
  streto_variants: Product[]
) {
  const existing = [];
  const added = [];
  let isNew;
  for (const variant of streto_variants) {
    isNew = true;
    for (const mv of meli_variations) {
      const mv_attrs = mv.attributes.map((mva: any) => mva.value_name);
      if (mv_attrs.includes(variant.attributes.sku)) {
        isNew = false;
        existing.push({
          id: mv.id,
          price: variant?.price,
          available_quantity: variant?.qty,
          attribute_combinations: Object.keys(
            variant?.attributes['variantOptions']
          ).map((k) => {
            const attr = streto_attributes?.find((a) => a['id'] === k);
            return {
              name: attr?.title,
              value_name:
                attr?.validations?.[0].params.within[
                  variant?.attributes.variantOptions[k]
                ],
            };
          }),
        });
        break;
      }
    }
    if (isNew) {
      added.push({
        price: variant.price,
        available_quantity: variant.qty,
        attributes: [
          { id: 'SELLER_SKU', value_name: variant.attributes['sku'] },
        ],
        picture_ids: variant.attributes['images']?.map(
          (i) => `${cdnBaseUrl}/${i.id}`
        ),
        sold_quantity: 0,
        attribute_combinations: Object.keys(
          variant.attributes['variantOptions']
        ).map((k) => {
          const attr = streto_attributes.find((a) => a['id'] === k);
          return {
            name: attr?.title,
            value_name:
              attr?.validations?.[0].params.within[
                variant?.attributes.variantOptions[k]
              ],
          };
        }),
      });
    }
  }
  return { existing, added };
}
