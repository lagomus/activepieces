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
import {
  CONFIGURABLE_TYPE,
  GOLD_SPECIAL_LISTING_TYPE,
  OPERATION_PUBLISH,
  OPERATION_SKIPPED,
  OPERATION_UPDATE,
  SIMPLE_TYPE,
  SKU,
} from '../common/publish_constants';

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
    catalogType: Property.ShortText({
      displayName: 'Catalog Type',
      description: 'Catalog Type',
      required: true,
    }),
    stretoAttributes: Property.Array({
      displayName: 'Streto Attributes',
      description: 'Streto Attributes',
      required: true,
      defaultValue: [],
    }),
    lastFlowExecKey: Property.ShortText({
      displayName: 'Last execution flow key',
      description: 'Last exectution flow storage key',
      required: true,
    }),
  },
  async run(context) {
    const item = context.propsValue['product'] as Product;
    const cdnBaseUrl = context.propsValue['cdnBaseUrl'];
    const catalogType = context.propsValue['catalogType'];
    const lastFlowExecKey = context.propsValue['lastFlowExecKey'];
    const token = context.auth.access_token;
    let publications = item.attributes['ml_publications'];
    const streto_attributes: any = Array.isArray(
      context.propsValue['stretoAttributes']
    )
      ? context.propsValue['stretoAttributes'].flat()
      : [];

    let operation = OPERATION_SKIPPED;
    let error = undefined;

    const lastExecution =
      (await context.store.get<number>(lastFlowExecKey, StoreScope.FLOW)) ??
      undefined;

    // Check wether the product is already published
    let publicationId = getPublicationId(catalogType, publications);

    if (!isProductUpdated(item.createdAt, item.updatedAt, lastExecution)) {
      return {
        operation: operation,
        publicationType: catalogType,
        productSku: item.attributes.sku,
        productId: item.id,
        publications: publications,
        status: 'done',
      };
    }

    const categoryId = getCategoryId(item.attributeSetNames);
    if (!categoryId) {
      return {
        operation: operation,
        publicationType: catalogType,
        productSku: item.attributes.sku,
        productId: item.id,
        publications: publications,
        status: 'fail',
        error: 'Category Not Found',
      };
    }

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
          url: `${context.auth.baseUrl}/categories/${categoryId}/attributes`,
        })
      ).body;
      await context.store.put<string>(
        categoryId,
        JSON.stringify(meli_attributes),
        StoreScope.FLOW
      );
    }

    if (publicationId !== undefined) {
      // EDIT EXISTING PRODUCT
      operation = OPERATION_UPDATE;
      try {
        let sold = false;

        const pub = (
          await httpClient.sendRequest<Item>({
            method: HttpMethod.GET,
            headers: { Authorization: `Bearer ${token}` },
            url: `${context.auth.baseUrl}/items/${publicationId}?include_attributes=all`,
          })
        ).body;

        if (pub['sold_quantity'] !== 0) {
          sold = true;
        }

        // EDIT CONFIGURABLE PRODUCT
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
            url: `${context.auth.baseUrl}/items/${publicationId}`,
            body: {
              variations: variations.existing,
              status: getPublicationStatus(catalogType, publications),
            },
          });

          if (variations.added?.length) {
            const items = [
              ...variations.added?.values(),
              ...variations.existing?.map((v) => ({ id: v.id }))?.values(),
            ];
            const pictures = variations.added.flatMap((v) =>
              v.picture_ids?.map((pi) => ({ source: pi }))
            );
            const existingPicts =
              pub.pictures?.map((pi) => ({ id: pi.id })) || [];

            await httpClient.sendRequest<Item>({
              method: HttpMethod.PUT,
              headers: { Authorization: `Bearer ${token}` },
              url: `${context.auth.baseUrl}/items/${publicationId}`,
              body: {
                pictures: [...existingPicts, ...pictures],
                variations: items,
              },
            });
          }
        } // EDIT SIMPLE PRODUCT
        else {
          await httpClient.sendRequest<Item>({
            method: HttpMethod.PUT,
            headers: { Authorization: `Bearer ${token}` },
            url: `${context.auth.baseUrl}/items/${publicationId}`,
            body: {
              ...(!sold && { title: item.attributes['ml_title'] }),
              available_quantity: item.qty,
              price: item.price,
              pictures: item.attributes['images']?.map((i) => ({
                source: `${cdnBaseUrl}/${i.id}`,
              })),
              status: getPublicationStatus(catalogType, publications),
              attributes: getAttributesValues(item, meli_attributes),
            },
          });
        }

        await httpClient.sendRequest<Item>({
          method: HttpMethod.PUT,
          headers: { Authorization: `Bearer ${token}` },
          url: `${context.auth.baseUrl}/items/${publicationId}/description?api_version=2`,
          body: {
            plain_text: item.attributes['shortDescription'],
          },
        });
      } catch (e: any) {
        console.dir(e);
        error = e.message;
      }
    } else {
      // PUBLISH NEW PRODUCT
      operation = OPERATION_PUBLISH;

      if (item.type === SIMPLE_TYPE) {
        const body = generateProduct(item, meli_attributes, cdnBaseUrl);

        try {
          const published = await httpClient.sendRequest<Item>({
            method: HttpMethod.POST,
            headers: { Authorization: `Bearer ${token}` },
            url: `${context.auth.baseUrl}/items`,
            body: body,
          });

          publicationId = published.body.id;
        } catch (e: any) {
          error = e.message;
        }
      } else if (item.type === CONFIGURABLE_TYPE) {
        try {
          const body = generateProductVariation(
            item,
            meli_attributes,
            streto_attributes,
            cdnBaseUrl
          );

          const published = await httpClient.sendRequest<Item>({
            method: HttpMethod.POST,
            headers: { Authorization: `Bearer ${token}` },
            url: `${context.auth.baseUrl}/items`,
            body: body,
          });

          publicationId = published.body.id;
        } catch (e: any) {
          error = e.message;
        }
      }
    }

    if (!publications) {
      publications = {};
    }
    publications[catalogType] = { [`${publicationId}`]: true };

    return {
      operation: operation,
      publicationType: catalogType,
      productSku: item.attributes.sku,
      productId: item.id,
      publications: { ml_publications: publications },
      status: error ? 'fail' : 'done',
      error: error,
    };
  },
});

function getCategoryId(attributeSetNames?: string[]) {
  return attributeSetNames
    ?.find((attrSet) => attrSet.includes(' - MLA'))
    ?.split(' - ')[1];
}

function getAttributesValues(item: Product, attributes: MeliAttribute[]) {
  return attributes
    .map((a) => ({
      id: a.id,
      ...((a.values || a.id !== 'BRAND') && {
        value_id:
          item.attributes[a.id] && a.value_type === 'number_unit'
            ? `${item.attributes[a.id]} ${a.default_unit}`
            : item.attributes[a.id],
      }),
      ...((!a.values || a.id === 'BRAND') && {
        value_name:
          item.attributes[a.id] && a.value_type === 'number_unit'
            ? `${item.attributes[a.id]} ${a.default_unit}`
            : item.attributes[a.id],
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
    title: item.attributes['ml_title'],
    category_id: getCategoryId(item.attributeSetNames),
    price: item.price,
    currency_id: 'ARS',
    available_quantity: item.qty,
    description: { plain_text: item.attributes['shortDescription'] },
    pictures: item.attributes['images']?.map((i) => ({
      source: `${cdnBaseUrl}/${i.id}`,
    })),
    listing_type_id: GOLD_SPECIAL_LISTING_TYPE,
    attributes: getAttributesValues(item, attributes),
  };
}

function getVariationTitle(attrTitle?: string) {
  if (attrTitle?.toLowerCase().includes('color')) {
    return 'Color';
  }
  if (attrTitle?.toLowerCase().includes('talle')) {
    return 'Talle';
  }
  if (attrTitle?.toLowerCase().includes('genero')) {
    return 'Genero';
  }
  return attrTitle;
}

function getAttributeCombinations(
  variant: Product,
  attributes: StretoAttribute[]
) {
  return Object.keys(variant.attributes.variantOptions).map((k) => {
    const attr = attributes.find((a) => a.id === k);
    return {
      name: getVariationTitle(attr?.title),
      value_name:
        attr?.validations?.[0].params.within[
          variant?.attributes?.variantOptions[k]
        ],
    };
  });
}

function getVariations(
  streto_attributes: StretoAttribute[],
  cdnBaseUrl: string,
  variants?: Product[]
) {
  return variants?.map((variant) => ({
    price: variant.price,
    available_quantity: variant.qty,
    attributes: [{ id: SKU, value_name: variant.attributes['sku'] }],
    picture_ids: variant.attributes['images']?.map(
      (i) => `${cdnBaseUrl}/${i.id}`
    ),
    sold_quantity: 0,
    attribute_combinations: getAttributeCombinations(
      variant,
      streto_attributes
    ),
  }));
}

function generateProductVariation(
  item: Product,
  meli_attributes: MeliAttribute[],
  streto_attributes: StretoAttribute[],
  cdnBaseUrl: string
) {
  return {
    title: item.attributes['ml_title'],
    category_id: getCategoryId(item.attributeSetNames),
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
    listing_type_id: GOLD_SPECIAL_LISTING_TYPE,
    attributes: getAttributesValues(item, meli_attributes).filter(
      (a) => a.id !== SKU
    ),
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
          attribute_combinations: getAttributeCombinations(
            variant,
            streto_attributes
          ),
        });
        break;
      }
    }
    if (isNew) {
      added.push({
        price: variant.price,
        available_quantity: variant.qty,
        attributes: [{ id: SKU, value_name: variant.attributes['sku'] }],
        picture_ids: variant.attributes['images']?.map(
          (i) => `${cdnBaseUrl}/${i.id}`
        ),
        sold_quantity: 0,
        attribute_combinations: getAttributeCombinations(
          variant,
          streto_attributes
        ),
      });
    }
  }
  return { existing, added };
}

function getPublicationId(catalogType: string, ml_publications?: any) {
  return ml_publications && ml_publications[catalogType]
    ? Object.keys(ml_publications[catalogType])[0]
    : undefined;
}

function getPublicationStatus(catalogType: string, ml_publications?: any) {
  return ml_publications && ml_publications[catalogType]
    ? Object.values(ml_publications[catalogType])[0]
      ? 'active'
      : 'paused'
    : 'active';
}

function isProductUpdated(
  createdAt: string,
  updatedAt?: string,
  lastFlowExecution?: number
) {
  if (lastFlowExecution) {
    const milliseconds = updatedAt
      ? Date.parse(updatedAt)
      : Date.parse(createdAt);
    return lastFlowExecution < milliseconds;
  }
  return true;
}
