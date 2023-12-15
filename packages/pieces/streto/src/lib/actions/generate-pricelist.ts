import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const generate_pricelist = createAction({
  name: 'generate_pricelist', // Must be a unique across the piece, this shouldn't be changed.
  auth: stretoAuth,
  displayName: 'Generate price list from Google Sheets',
  description:
    'Generate price list from based on Price Rules stored in a Google Sheets spreadsheet',
  props: {
    catalog_name: Property.ShortText({
      displayName: 'Catalog Name',
      description: 'Product Source catalog name',
      required: true,
    }),
    list_name: Property.ShortText({
      displayName: 'List Name',
      description: 'The Price List name for the output file',
      required: true,
    }),
    rules: Property.Array({
      displayName: 'Rules',
      description: 'Array of price rules',
      required: true,
    }),
  },
  async run(context) {
    const catalogName = context.propsValue['catalog_name'];
    const listName = context.propsValue['list_name'];

    const catalogResponse = await httpClient.sendRequest<Catalog[]>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url: `${context.auth.baseUrl}/app/catalogs?filter={"where":{"name":"${catalogName}"}}`,
    });

    const catalogId: string = catalogResponse.body[0]?.id;

    const rules: Rule[] = context.propsValue['rules'] as Rule[];

    const priceLists = [];

    for (let i = 1; i < rules.length; i++) {
      const priceName = rules[i]?.values['B'];

      const productResponse = await httpClient.sendRequest<Product[]>({
        method: HttpMethod.GET,
        headers: {
          'x-api-key': context.auth.apiKey,
        },
        url: `${context.auth.baseUrl}/app/catalogs/${catalogId}/products?filter={"where":{"and":[{"type":{"neq":"variant"}},{"attributes.mvb_source_rule":"${priceName}"}]}}`,
      });

      const products: Product[] = productResponse.body;

      const matchedProducts = products.filter(
        (p) => p.attributes?.mvb_source_rule === priceName
      );
      for (const product of matchedProducts) {
        priceLists.push({
          product: product.attributes?.sku,
          currency: 'ARS',
          price: calculatePrice(
            product.attributes?.mvb_cost,
            rules[i]?.values['C'],
            rules[i]?.values['D'],
            rules[i]?.values['E'],
            rules[i]?.values['F'],
            rules[i]?.values['G']
          ),
          qty: 1,
          list: `${listName}`,
        });
      }
    }

    return {
      priceLists,
    };
  },
});

const calculatePrice = (
  basePrice?: string,
  multiplier?: string,
  percentageOperation?: string,
  percentage?: string,
  fixedOperation?: string,
  fixed?: string
) => {
  const numericBasePrice = parseFloat(basePrice || '0');
  const numericMultiplier = parseFloat(multiplier || '1');
  const numericPercentage = parseFloat(percentage || '0');
  const numericFixed = parseFloat(fixed || '0');

  let result = numericBasePrice * numericMultiplier;

  if (percentageOperation === 'Aumentar') {
    result *= 1 + numericPercentage / 100;
  } else if (percentageOperation === 'Disminuir') {
    result *= 1 - numericPercentage / 100;
  }

  if (fixedOperation === 'Aumentar') {
    result += numericFixed;
  } else if (fixedOperation === 'Disminuir') {
    result -= numericFixed;
  }
  return result;
};
