import { createAction, Property } from '@activepieces/pieces-framework';

export const build_pages = createAction({
  name: 'build_pages',
  displayName: 'Build Pages',
  description: 'Build array of page limits',
  auth: undefined,
  props: {
    total_items: Property.Number({
      displayName: 'Total Items',
      description: undefined,
      required: true,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const totalItems = context.propsValue['total_items'];
    const pageSize = context.propsValue['page_size'];

    if (
      typeof totalItems !== 'number' ||
      typeof pageSize !== 'number' ||
      totalItems < 0 ||
      pageSize <= 0
    ) {
      throw new Error('Invalid input parameters');
    }

    const totalPages = Math.ceil(totalItems / pageSize);

    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      const start = (i - 1) * pageSize;
      const end = pageSize;
      pages.push({ start, end });
    }

    return {
      pages,
    };
  },
});
