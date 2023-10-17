require('dotenv').config({ path: '../.env' });
const cliProgress = require('cli-progress');
const db = require('../src/db');
const AWSUtility = require('../src/util/aws');
const axios = require('axios');
import { v4 as uuidv4 } from 'uuid';
const path = require('path');

const orgId = '9b5711e85';

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
    const { rows } = await db.query(
      `SELECT sku, image_url FROM product p WHERE p.organization_id =$1 AND image_url IS NOT NULL AND image_url=original_image_url`,
      [orgId],
    );

    if (!isStarted) {
      bar.start(rows.length);
      isStarted = true;
    }

    await rows.reduce(async (prevPromise, product, index) => {
      await prevPromise;

      try {
        const response = await axios({
          url: product.image_url,
          method: 'GET',
          responseType: 'stream',
        });

        const extension = path.extname(product.image_url) || '.jpg';

        //write to s3
        const fileName = 'image-' + uuidv4() + extension;
        await AWSUtility.saveStreamToS3(
          'optiversal-demo-data',
          'img/' + fileName,
          response.data,
          'image/jpeg'
        );
        const downloadUrl =
          'https://optiversal-demo-data.s3.amazonaws.com/img/' +
          fileName;

        await db.query(
          'UPDATE product p SET image_url=$3 WHERE sku=$1 AND organization_id=$2',
          [product.sku, orgId, downloadUrl],
        );
        bar.update(index + 1);
      } catch (e2) {
        console.log(`Couldn't download ${product.image_url}`, e2);
      }
    }, Promise.resolve());
  } catch (e) {
    console.log('error', e);
  } finally {
    bar.stop();
  }
})();
