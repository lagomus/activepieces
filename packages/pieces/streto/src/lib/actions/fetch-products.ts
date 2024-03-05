import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const fetch_products = createAction({
  name: 'fetch_products', // Must be a unique across the piece, this shouldn't be changed.
  auth: stretoAuth,
  displayName: 'Fetch Products by Catalog Id',
  description: 'Fetch products by Catalog Id from Streto',
  props: {
    catalog_id: Property.ShortText({
      displayName: 'Catalog ID',
      description: undefined,
      required: true,
    }),
    filter_array: Property.Array({
      displayName: 'Array filter',
      description: 'Use to pass an array of elements to filter by',
      required: false,
      defaultValue: [],
    }),
    with_stock: Property.Checkbox({
      displayName: 'With Stock',
      description: 'Fetch product stock',
      required: false,
    }),
    with_price: Property.Checkbox({
      displayName: 'With Price',
      description: 'Fetch product price',
      required: false,
    }),
    with_children: Property.Checkbox({
      displayName: 'With Children',
      description: 'Fetch product children',
      required: false,
    }),
    with_attribute_set_names: Property.Checkbox({
      displayName: 'With Attribute Set Names',
      description: 'Fetch product attribute set names',
      required: false,
    }),
    pricelist_name: Property.ShortText({
      displayName: 'Price List Name',
      description: 'Price List Name is required when With Price is checked',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Skip',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit',
      required: false,
    }),
  },
  async run(context) {
    const catalogId = context.propsValue['catalog_id'];
    const filterArray = context.propsValue['filter_array'];
    const skip = context.propsValue['skip'];
    const limit = context.propsValue['limit'];

    const filter = {
      ...(filterArray &&
        filterArray?.length > 0 && {
          where: {
            and: [
              { 'attributes.sku': { inq: JSON.parse(`${filterArray}`) } },
              { type: { neq: 'variant' } },
            ],
          },
        }),
      ...(!filterArray && {
        where: { type: { neq: 'variant' } },
      }),
      ...(skip !== undefined &&
        limit !== undefined && {
          skip: skip,
          limit: limit,
        }),
    };

    const response = await httpClient.sendRequest<Product[]>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url: `${
        context.auth.baseUrl
      }/app/catalogs/${catalogId}/products?filter=${JSON.stringify(filter)}`,
    });
    let products: Product[] = response.body;

    if (context.propsValue['with_children']) {
      const productIds = products
        .filter((p: Product) => p.type === 'configurable')
        .map((p: Product) => p.id);

      const productVariants: Product[] = [];

      for (const id of productIds) {
        let children = (
          await httpClient.sendRequest<Product[]>({
            method: HttpMethod.GET,
            headers: {
              'x-api-key': context.auth.apiKey,
            },
            url: `${context.auth.baseUrl}/app/products/${id}/children`,
          })
        ).body;

        if (context.propsValue['with_stock']) {
          const childrenStockItems = await httpClient.sendRequest<StockItem[]>({
            method: HttpMethod.GET,
            headers: {
              'x-api-key': context.auth.apiKey,
            },
            url: `${
              context.auth.baseUrl
            }/app/products/${id}/children/stock-items?filter=${JSON.stringify({
              offset: 0,
              limit: 1000,
            })}`,
          });
          children = children.map((p) => {
            const stock = childrenStockItems.body.find(
              (item) => item.productId === p.id
            );
            return { ...p, qty: stock?.qty };
          });
        }

        if (context.propsValue['with_price']) {
          const childrenPrices = await httpClient.sendRequest<Price[]>({
            method: HttpMethod.GET,
            headers: {
              'x-api-key': context.auth.apiKey,
            },
            url: `${
              context.auth.baseUrl
            }/app/prices?filter={"where":{"productId":{"inq":${JSON.stringify(
              children.map((c) => c.id)
            )}}}}`,
          });

          children = children.map((p) => {
            const price = childrenPrices.body.find(
              (item) => item.productId === p.id
            );
            return { ...p, price: price?.value };
          });
        }
        productVariants.push(...children.filter((c) => c?.price !== undefined));
      }

      products = products.map((p) => {
        const variants = productVariants.filter(
          (v: any) => v.attributes.parentId === p.id
        );
        return p.type === 'simple' ? p : { ...p, variants: variants };
      });
    }

    if (context.propsValue['with_stock']) {
      const productIds = products.map((p: Product) => p.id);
      const stockList = await httpClient.sendRequest<StockItem[]>({
        method: HttpMethod.GET,
        headers: {
          'x-api-key': context.auth.apiKey,
        },
        url: `${
          context.auth.baseUrl
        }/app/stock-items?filter={"where":{"productId":{"inq":${JSON.stringify(
          productIds
        )}}}}`,
      });
      products = products.map((p) => {
        const stock = stockList.body.find((item) => item.productId === p.id);
        return { ...p, qty: stock?.qty };
      });
    }

    if (context.propsValue['with_price']) {
      const priceListName = context.propsValue['pricelist_name'];
      const priceLists = await httpClient.sendRequest<PriceList[]>({
        method: HttpMethod.GET,
        headers: {
          'x-api-key': context.auth.apiKey,
        },
        url: `${context.auth.baseUrl}/app/price-lists?filter={"where":{"name":"${priceListName}"}}`,
      });

      const priceListId = priceLists.body[0]?.id;
      const productIds = products.map((p: Product) => p.id);
      const priceList = await httpClient.sendRequest<Price[]>({
        method: HttpMethod.GET,
        headers: {
          'x-api-key': context.auth.apiKey,
        },
        url: `${
          context.auth.baseUrl
        }/app/price-lists/${priceListId}/prices?filter={"where":{"productId":{"inq":${JSON.stringify(
          productIds
        )}}}}`,
      });
      products = products.map((p) => {
        const price = priceList.body.find((item) => item.productId === p.id);
        return { ...p, price: price?.value };
      });
    }

    if (context.propsValue['with_attribute_set_names']) {
      const attrSetIds = products.map((p: Product) => p.attributeSets).flat();
      const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        headers: {
          'x-api-key': context.auth.apiKey,
          'Content-Type': 'application/json',
        },
        url: `${
          context.auth.baseUrl
        }/app/attribute-sets?filter={"fields":["id","name"],"where":{"and":[{"system":false},{"id":{"inq":${JSON.stringify(
          attrSetIds
        )}}}]}}`,
      });
      products = products.map((p) => {
        const attrSet = response.body.find((item) =>
          p.attributeSets?.includes(item.id)
        );
        return { ...p, attributeSetName: attrSet?.name };
      });
    }

    return {
      products,
      images: products.some(
        (p) => p.attributes?.images && p.attributes?.images.length > 0
      ),
    };
  },
});
