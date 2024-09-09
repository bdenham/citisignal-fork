import { readBlockConfig } from '../../scripts/aem.js';
import { getConfigValue, getAemAuthorEnv, getAemContentPath } from '../../scripts/configs.js';

export default async function decorate(block) {
  const isAemAuthor = getAemAuthorEnv();
  if (isAemAuthor) {
    // let authorContentPath = getAemContentPath();
    // authorContentPath = `${authorContentPath}.resource/scripts/widgets/search.js`;
    // await import(`${authorContentPath}`);
    // eslint-disable-next-line import/no-unresolved
    await import('@widgets/search.js');
    // eslint-disable-next-line no-console
    console.log('after calling to importmap for plp');
  } else {
    // eslint-disable-next-line import/no-absolute-path, import/no-unresolved
    await import('/scripts/widgets/search.js');
  }
  // eslint-disable-next-line import/no-absolute-path, import/no-unresolved
  // await import('/scripts/widgets/search.js');

  const { category, urlpath, type } = readBlockConfig(block);
  block.textContent = '';
  // const plpAttributes = block.attributes;
  // const isAemAuthor = getAemAuthorEnv();
  // if (!isAemAuthor) {
  //   block.textContent = '';
  // } else if (isAemAuthor && plpAttributes && plpAttributes.getNamedItem('data-aue-resource')) {
  //   /* eslint-disable-next-line no-console */
  //   console.log(`in product-list-page block, in AEM author env = ${isAemAuthor}, window.location = ${window.location}`);
  // }

  const storeDetails = {
    environmentId: await getConfigValue('commerce-environment-id'),
    environmentType: (await getConfigValue('commerce-endpoint')).includes('sandbox') ? 'testing' : '',
    apiKey: await getConfigValue('commerce-x-api-key'),
    websiteCode: await getConfigValue('commerce-website-code'),
    storeCode: await getConfigValue('commerce-store-code'),
    storeViewCode: await getConfigValue('commerce-store-view-code'),
    config: {
      pageSize: 8,
      perPageConfig: {
        pageSizeOptions: '12,24,36',
        defaultPageSizeOption: '12',
      },
      minQueryLength: '2',
      currencySymbol: '$',
      currencyRate: '1',
      displayOutOfStock: true,
      allowAllProducts: false,
      imageCarousel: false,
      optimizeImages: true,
      imageBaseWidth: 200,
      listview: true,
      displayMode: '', // "" for plp || "PAGE" for category/catalog
      addToCart: async (...args) => {
        const { addProductsToCart } = await import('../../scripts/__dropins__/storefront-cart/api.js');
        await addProductsToCart([{
          sku: args[0],
          options: args[1],
          quantity: args[2],
        }]);
      },
    },
    context: {
      customerGroup: await getConfigValue('commerce-customer-group'),
    },
    route: ({ sku }) => {
      const base = urlpath === 'plans' ? '/products/plan/' : '/products/';
      return `${base}${sku}`;
    },
  };

  if (type !== 'search') {
    storeDetails.config.categoryName = document.querySelector('.default-content-wrapper > h1')?.innerText;
    storeDetails.config.currentCategoryId = category;
    storeDetails.config.currentCategoryUrlPath = urlpath;

    // Enable enrichment
    block.dataset.category = category;
  }

  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.LiveSearchPLP) {
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });

  return window.LiveSearchPLP({ storeDetails, root: block });
}
