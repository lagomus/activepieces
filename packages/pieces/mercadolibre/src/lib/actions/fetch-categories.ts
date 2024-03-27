import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import { Category } from '../common/models';

export const fetch_categories = createAction({
  name: 'fetch_categories',
  auth: meliAuth,
  displayName: 'Fetch Categories',
  description: 'Fetch the selected category including its subcategory tree',
  props: {
    root_category: Property.ShortText({
      displayName: 'Parent Category',
      description: 'Parent Category Id',
      required: true,
      defaultValue: 'MLA1292', // 'Ciclismo'
    }),
  },
  async run(context) {

    ///
    await context.store.delete('ATTRIBUTE_LIST', StoreScope.FLOW);
    await context.store.delete('ATTRIBUTE_SET_LIST', StoreScope.FLOW);
    ///

    const parentCategoryId = context.propsValue['root_category'];
    const token = context.auth.access_token;
    const baseUrl = context.auth.baseUrl;
    const result = new Map<string, Category>();
    const category = await fetchCategory(
      parentCategoryId,
      baseUrl,
      token,
      result
    );
    await collectCategoryIds(category, baseUrl, token, result);
    return {
      categories: Array.from(result.values()),
    };
  },
});

async function fetchCategory(
  categoryId: string,
  apiBaseUrl: string,
  token: string,
  uniqueIds: Map<string, Category>
) {
  const response = await httpClient.sendRequest<Category>({
    method: HttpMethod.GET,
    headers: { Authorization: `Bearer ${token}` },
    url: `${apiBaseUrl}/categories/${categoryId}`,
  });
  uniqueIds.set(categoryId, {
    id: response.body.id,
    name: response.body.name,
    path_from_root: response.body.path_from_root,
  });
  return response.body;
}

async function collectCategoryIds(
  category: Category,
  apiBaseUrl: string,
  token: string,
  uniqueIds: Map<string, Category>
) {
  if (category.children_categories && category.children_categories.length > 0) {
    for (const childCategory of category.children_categories) {
      if (!uniqueIds.has(childCategory.id)) {
        const category = await fetchCategory(
          childCategory.id,
          apiBaseUrl,
          token,
          uniqueIds
        );
        await collectCategoryIds(category, apiBaseUrl, token, uniqueIds);
      }
    }
  }
}
