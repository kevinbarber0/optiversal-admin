const cliProgress = require('cli-progress');
const db = require('../src/db');
const { Constants } = require('../src/util/global');

const bar = new cliProgress.SingleBar(
  {
    format:
      'Convert Progress |{bar}| {percentage}% || {value}/{total} Rows Adjusted',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  },
  cliProgress.Presets.shades_classic,
);

(async () => {
  let isStarted = false;

  try {
    const { rows } = await db.query('SELECT page_id, organization_id, content, search_params, content_settings FROM page');

    if (!isStarted) {
      bar.start(rows.length);
      isStarted = true;
    }

    await rows.reduce(async (prevPromise, page, index) => {
      await prevPromise;
      const pageContents = Array.isArray(page.content) ? page.content : [];
      const newContent = pageContents.map((contentBlockRow) => {
        let isFirstProductAssortment = true;
        if (Array.isArray(contentBlockRow)) {
          return contentBlockRow;
        }

        const newContentBlockRow = {
          ...contentBlockRow,
          settings: {},
        };

        if (
          contentBlockRow.component.componentId ===
            Constants.ProductAssortmentComponentId &&
          isFirstProductAssortment
        ) {
          isFirstProductAssortment = false;
          return [
            {
              ...newContentBlockRow,
              settings: {
                ...newContentBlockRow.settings,
                searchParameters: page.search_params,
                contentSettings: page.content_settings,
              },
            },
          ];
        }
        return [contentBlockRow];
      });

      const values = [
        page.page_id,
        page.organization_id,
        JSON.stringify(newContent),
      ];
      const query =
        'UPDATE page SET content=$3 WHERE page_id=$1 AND organization_id=$2';

      await db.query(query, values);
      bar.update(index + 1);
    }, Promise.resolve());
  } catch (e) {
    console.log('error', e);
  } finally {
    bar.stop();
  }
})();
