const db = require('.');
const { PageStatus } = require('@util/enum');
const AWSUtility = require('@util/aws');
const { Constants } = require('@util/global');
const { compareArray } = require('@helpers/utils');
class PageDB {
  static async save(
    accountId,
    pageId,
    orgId,
    slug,
    keyword,
    title,
    contentTemplateId,
    content,
    contentSettings,
    searchParameters,
    results,
    qualityMetrics,
    query,
    labels,
    pageSettings,
    locations,
  ) {
    try {
      const values = [
        pageId,
        orgId,
        slug,
        keyword,
        title,
        contentTemplateId,
        JSON.stringify(content),
        contentSettings,
        searchParameters,
        JSON.stringify(results),
        qualityMetrics?.score,
        qualityMetrics,
        query,
        JSON.stringify(labels),
        JSON.stringify(pageSettings),
        JSON.stringify(locations),
        accountId,
      ];

      const { rows } = await db.query(
        'SELECT labels FROM page WHERE page_id = $1',
        [pageId],
      );

      this.setLabelSubscriptions(
        pageId,
        rows.length > 0 ? rows[0].labels : [],
        labels,
      );

      await db.query(
        'INSERT INTO page (page_id, organization_id, slug, keyword, title, content_template_id, content, content_settings, search_params, status, results, quality_score, quality_metrics, query, labels, page_settings, locations, author_id, last_editor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $14, $15, $16, $17, $17) ON CONFLICT (page_id) DO UPDATE SET slug=$3, keyword=$4, title=$5, content_template_id=$6, content=$7, content_settings=$8, search_params=$9, results=$10, quality_score=$11, quality_metrics=$12, query=$13, last_editor_id=$17, labels=$14, page_settings=$15, locations=$16, date_modified=NOW()',
        values,
      );
      const stage = process.env.STAGE;
      AWSUtility.triggerLambda('optifx-' + stage + '-updatepage', {
        organizationId: orgId,
        pageId: pageId,
      });
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async checkSlugExists(orgId, slug) {
    const values = [orgId, slug];
    const { rows } = await db.query(
      'SELECT slug FROM page WHERE organization_id=$1 AND slug=$2',
      values,
    );
    return rows.length > 0;
  }

  static async setStatus(pageId, orgId, status, refreshPage) {
    const arrStatus = Object.values(PageStatus);
    try {
      if (!arrStatus.includes(status)) throw new Error('Invalid page status');

      const values = [pageId, orgId, status];
      await db.query(
        'UPDATE page SET status=$3, date_published=CASE WHEN $3=1 THEN NOW() ELSE date_published END, date_unpublished=CASE WHEN $3=4 or $3=3 THEN NOW() ELSE date_unpublished END WHERE page_id=$1 AND organization_id=$2',
        values,
      );
      if (refreshPage) {
        const stage = process.env.STAGE;
        AWSUtility.triggerLambda('optifx-' + stage + '-updatepage', {
          organizationId: orgId,
          pageId: pageId,
        });
      }
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getById(pageId) {
    const values = [pageId];
    const { rows } = await db.query(
      'SELECT p.page_id AS "pageId", p.organization_id AS "organizationId", p.title, p.content_template_id AS "contentTemplateId", p.content, p.slug, content_settings AS "contentSettings", p.keyword, p.status, p.date_added AS "dateAdded", p.search_params AS "searchParameters", p.results, a1.email AS "authorEmail", a2.email AS "lastEditorEmail", p.labels FROM page p INNER JOIN account a1 ON p.author_id=a1.account_id INNER JOIN account a2 ON p.last_editor_id=a2.account_id WHERE p.page_id=$1',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async getBySlug(orgId, slug) {
    const values = [orgId, slug];
    const { rows } = await db.query(
      'SELECT p.page_id AS "pageId", p.organization_id AS "organizationId", p.slug, p.title, p.content_template_id AS "contentTemplateId", p.content, p.content_settings AS "contentSettings", p.keyword, p.status, p.date_added AS "dateAdded", p.search_params AS "searchParameters", p.results, a1.email AS "authorEmail", a2.email AS "lastEditorEmail", p.labels, p.page_settings AS "pageSettings", p.date_added AS "dateAdded", p.date_modified AS "dateModified", p.last_updated as "lastUpdated", p.locations, p.related_pages as "relatedPages"  FROM page p INNER JOIN account a1 ON p.author_id=a1.account_id INNER JOIN account a2 ON p.last_editor_id=a2.account_id WHERE p.organization_id=$1 AND p.slug=$2',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async getExampleTitles(orgId, contentTemplateId, max) {
    let values = [orgId, contentTemplateId, max, PageStatus.DELETED];
    let { rows } = await db.query(
      'SELECT title FROM page WHERE organization_id=$1 AND content_template_id=$2 AND status<>$4 ORDER BY RANDOM() LIMIT $3',
      values,
    );
    if (rows && rows.length > 0) {
      return rows.map((r) => r.title);
    } else {
      //if no matches for that content template, try all non-assortment types
      values = [
        orgId,
        Constants.ProductAssortmentContentTemplateId,
        max,
        PageStatus.DELETED,
      ];
      let { rows } = await db.query(
        'SELECT title FROM page WHERE organization_id=$1 AND content_template_id<>$2 AND status<>$4 ORDER BY RANDOM() LIMIT $3',
        values,
      );
      if (rows && rows.length > 0) {
        return rows.map((r) => r.title);
      }
    }
    return [];
  }

  static async getMetrics(orgId, startDate, endDate) {
    const values = [orgId];
    let valueIndex = 2;

    let query = `SELECT
                    JSONB_AGG(jsonb_build_object('date', d.date, 'data', d.clicks)) AS clicks,
                    JSONB_AGG(jsonb_build_object('date', d.date, 'data', d.impressions)) AS impressions,
                    JSONB_AGG(jsonb_build_object('date', d.date, 'data', d.ctr)) AS ctr,
                    JSONB_AGG(jsonb_build_object('date', d.date, 'data', d.position)) AS position
                FROM (
                  SELECT
                    pm.date,
                    SUM(pm.clicks) AS clicks,
                    SUM(pm.impressions) AS impressions,
                    ROUND(AVG(CASE WHEN pm.ctr = 0.0 THEN NULL ELSE pm.ctr END), 2) AS ctr,
                    ROUND(AVG(CASE WHEN pm."position" = 100 THEN NULL ELSE pm."position" END), 2) AS position
                  FROM
                    page_metrics pm, page p 
                  WHERE
                    p.organization_id = $1 AND pm.page_id = p.page_id`;
    if (startDate) {
      query += ` AND pm.date >= $${valueIndex++}`;
      values.push(startDate);
    }
    if (endDate) {
      query += ` AND pm.date <= $${valueIndex++}`;
      values.push(endDate);
    }
    query += ` GROUP BY
                    pm.date
                  ORDER BY pm.date asc) d`;

    const { rows } = await db.queryReadOnly(query, values);
    return rows;
  }

  static async getPubPages(orgId, startDate, endDate) {
    const values = [orgId, PageStatus.PUBLISHED];
    let valueIndex = 3;

    let query = `SELECT JSONB_AGG(pub) AS pg_data
        From (SELECT date, (SELECT count(1) from page WHERE date_published <= g.date and status=$2 and organization_id=$1) AS data
        FROM (SELECT generate_series((select min(date_published) from page where organization_id=$1 and status=$2) + interval '1 day', now(), interval  '1 day')::date) AS g(date)`;

    if (startDate || endDate) {
      query += ' WHERE 1=1';

      if (startDate) {
        query += ` AND date >= $${valueIndex++}`;
        values.push(startDate);
      }
      if (endDate) {
        query += ` AND date <= $${valueIndex++}`;
        values.push(endDate);
      }
    }

    query += `) pub`;
    const { rows } = await db.queryReadOnly(query, values);
    return rows;
  }

  static async getImpPages(orgId, startDate, endDate) {
    const values = [orgId, PageStatus.PUBLISHED];
    let valueIndex = 3;

    let query = `SELECT JSONB_AGG(imp) AS pg_data
    FROM (SELECT date, (SELECT count(1) FROM page p WHERE status=$2 AND organization_id=$1 AND EXISTS(SELECT 1 FROM page_metrics pm3 WHERE pm3.page_id=p.page_id AND pm3.impressions>0 AND pm3."date"<=CAST(g.date AS varchar))) AS data FROM (SELECT generate_series((select min(date_published) from page p2 inner join page_metrics pm2 on p2.page_id=pm2.page_id where p2.organization_id=$1 and status=$2 and pm2.impressions>0) + interval '1 day', now(), interval  '1 day')::date) AS g(date)`;

    if (startDate || endDate) {
      query += ' WHERE 1=1';

      if (startDate) {
        query += ` AND date >= $${valueIndex++}`;
        values.push(startDate);
      }
      if (endDate) {
        query += ` AND date <= $${valueIndex++}`;
        values.push(endDate);
      }
    }

    query += `) imp`;

    const { rows } = await db.queryReadOnly(query, values);
    return rows;
  }

  static async getSERPs(orgId, startDate, endDate) {
    const values = [orgId, PageStatus.PUBLISHED];

    let query = `SELECT COUNT(1) AS serp_count, p.serp_summary->'currentPosition' AS serp FROM page p WHERE p.organization_id = $1 AND p.status = $2 AND COALESCE((p.serp_summary->>'currentPosition')::int, 100) >= 1 AND COALESCE((p.serp_summary->>'currentPosition')::int, 100) <= 10 GROUP BY p.serp_summary->'currentPosition' ORDER BY p.serp_summary->'currentPosition' ASC`;

    // if (startDate || endDate) {
    //   if (startDate) {
    //     query += ` AND date >= $${valueIndex++}`;
    //     values.push(startDate);
    //   }
    //   if (endDate) {
    //     query += ` AND date <= $${valueIndex++}`;
    //     values.push(endDate);
    //   }
    // }

    const { rows } = await db.queryReadOnly(query, values);
    return rows;
  }

  static async getAll(
    orgId,
    offset,
    limit,
    keyword,
    filters,
    sortBy,
    resultKey,
  ) {
    let {
      contentType,
      status,
      redirect,
      matchType,
      minQuality,
      maxQuality,
      labels,
      creators,
      startCreatDate,
      endCreatDate,
      editors,
      startEditDate,
      endEditDate,
      pagePath,
      minSerp,
      maxSerp,
      minClicks,
      maxClicks,
      minImpressions,
      maxImpressions,
      minCTR,
      maxCTR,
      minPosition,
      maxPosition,
      workflow,
      minSkus,
      maxSkus,
    } = filters || {};

    if (labels?.length > 0) {
      labels = labels.map(({ value }) => value);
    }

    if (creators?.length > 0) {
      creators = creators.map(({ value }) => value);
    }

    if (editors?.length > 0) {
      editors = editors.map(({ value }) => value);
    }

    if (!minQuality) {
      minQuality = 0;
    }
    if (!maxQuality) {
      maxQuality = 10;
    }

    if (!minClicks) {
      minClicks = 0;
    }
    if (maxClicks === null || typeof maxClicks == 'undefined') {
      maxClicks = 2147483647;
    }
    const values = [
      orgId,
      offset,
      limit,
      keyword ? '%' + keyword.toLowerCase() + '%' : '%',
      PageStatus.DELETED,
      contentType || '',
      status || -1,
      minQuality,
      maxQuality,
      workflow?.contentTypes?.value || '',
      parseInt(workflow?.searchParams?.pageStatus) || -1,
      resultKey || '',
      minSkus === '0' ? 0 : parseInt(minSkus) || -1,
      maxSkus === '0' ? 0 : parseInt(maxSkus) || -1,
      creators || [],
    ];
    let valueIndex = values.length + 1;
    let query = `SELECT 
        p.page_id AS "pageId", 
        p.organization_id AS "organizationId",
        p.slug, 
        p.title, 
        p.content_template_id AS "contentTemplateId", 
        COALESCE(ct.name, \'Free-Form\') AS "contentTemplateName", 
        p.keyword, 
        p.status, 
        p.date_added AS "dateAdded", 
        p.date_published AS "datePublished", 
        p.date_unpublished AS "dateUnpublished", 
        p.date_modified AS "dateModified", 
        p.serp_summary AS "serp", 
        p.results, 
        p.monthly_volume AS "volume", 
        p.quality_score AS "qualityScore", 
        p.quality_metrics AS "qualityMetrics", 
        p.labels, 
        p.weekly_metrics AS "weeklyMetrics", 
        p.page_settings AS "pageSettings",
        p.label_context AS "labelContext"  
      FROM page p LEFT JOIN content_template ct ON p.content_template_id=ct.content_template_id 
      WHERE p.organization_id=$1 
        AND LOWER(p.title) LIKE $4 
        AND ($6='' OR p.content_template_id=$6) 
        AND (($7=-1 AND p.status<>$5) OR ($7<>-1 AND p.status=$7) OR ($11<>-1 AND p.status=$11)) 
        AND (p.quality_score IS NULL OR p.quality_score >= $8) 
        AND (p.quality_score IS NULL OR p.quality_score <= $9) 
        AND ($10='' OR p.content_template_id=$10) 
        AND ($12='' OR p.result_key=$12) 
        AND ($13=-1 OR jsonb_array_length(p.results)>=$13)
        AND ($14=-1 OR jsonb_array_length(p.results)<=$14) 
        AND (cardinality($15::text[])=0 OR p.author_id=ANY($15))`;

    if (redirect) {
      query += ` AND p.page_settings->>'redirectUrl' IS NOT NULL AND p.page_settings->>'redirectUrl' != ''`;
    }

    if (pagePath) {
      query += ` AND p.page_settings->>'pagePath' LIKE $${valueIndex++}`;
      values.push(`%${pagePath}%`);
    }

    if (startCreatDate) {
      query += ` AND p.date_added>=$${valueIndex++}`;
      values.push(startCreatDate + ' 00:00:00');
    }
    if (endCreatDate) {
      query += ` AND p.date_added <= $${valueIndex++}`;
      values.push(endCreatDate + ' 23:59:59');
    }

    if (editors || startEditDate || endEditDate) {
      query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

      if (editors) {
        query += ` AND aa.account_id IN (${editors
          .map(() => `$${valueIndex++}`)
          .join(', ')})`;
        values.push(...editors);
      }

      if (startEditDate) {
        query += ` AND aa.date_added >= $${valueIndex++}`;
        values.push(startEditDate + ' 00:00:00');
      }
      if (endEditDate) {
        query += ` AND aa.date_added <= $${valueIndex++}`;
        values.push(endEditDate + ' 23:59:59');
      }

      query += ')';
    }

    if (labels) {
      query += ' AND (';

      const subQuery = labels.map((label) => {
        values.push(label);
        return `p.labels ? $${valueIndex++}`;
      });

      query += subQuery.join(matchType ? ' AND ' : ' OR ') + ')';
    }

    if (minSerp) {
      query += ` AND (COALESCE((p.serp_summary->>'currentPosition')::int, 100) >= ${minSerp})`;
    }
    if (maxSerp) {
      query += ` AND (COALESCE((p.serp_summary->>'currentPosition')::int, 100) <= ${maxSerp})`;
    }

    // for metrics filter
    query += ` AND (coalesce((p.weekly_metrics->0->>\'clicks\')::int, 0) >= ${
      minClicks || 0
    }) AND (coalesce((p.weekly_metrics->0->>\'clicks\')::int, 0) <= ${
      maxClicks || 2147483647
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'impressions\')::int, 0) >= ${
      minImpressions || 0
    }) AND (coalesce((p.weekly_metrics->0->>\'impressions\')::int, 0) <= ${
      maxImpressions || 2147483647
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'ctr\')::float, 0) >= ${
      minCTR || 0.0
    }) AND (coalesce((p.weekly_metrics->0->>\'ctr\')::float, 0.00) <= ${
      maxCTR || 1.0
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'position\')::float, 0) >= ${
      minPosition || 0.0
    }) AND (coalesce((p.weekly_metrics->0->>\'position\')::float, 0.00) <= ${
      maxPosition || 2147483647
    })`;

    if (workflow) {
      values.push(workflow.workflowId);
      query += `AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$${valueIndex++} AND cwi.item_id = p.page_id)`;

      const editors = workflow?.searchParams?.editors?.map((e) => e.value);
      if (editors.length > 0) {
        query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

        if (editors) {
          query += ` AND aa.account_id IN (${editors
            .map(() => `$${valueIndex++}`)
            .join(', ')})`;
          values.push(...editors);
        }
        query += ')';
      }

      if (workflow?.searchParams?.filterLabels?.length > 0) {
        query += ' AND (';

        const subQuery = workflow?.searchParams?.filterLabels?.map((label) => {
          values.push(label.value);
          return `p.labels ? $${valueIndex++}`;
        });

        query +=
          subQuery.join(
            workflow?.searchParams?.matchType === 'all' ? ' AND ' : ' OR ',
          ) + ')';
      }
    }

    query += ' ORDER BY ';
    if (sortBy === 'dateModified_asc') {
      query += 'p.date_modified ASC';
    } else if (sortBy === 'dateAdded_desc') {
      query += 'p.date_added DESC';
    } else if (sortBy === 'dateAdded_asc') {
      query += 'p.date_added ASC';
    } else if (sortBy === 'contentTemplateName_asc') {
      query += 'ct.name ASC';
    } else if (sortBy === 'contentTemplateName_desc') {
      query += 'ct.name DESC';
    } else if (sortBy === 'title_asc') {
      query += 'p.title ASC';
    } else if (sortBy === 'title_desc') {
      query += 'p.title DESC';
    } else if (sortBy === 'highquality') {
      query += 'p.quality_score DESC';
    } else if (sortBy === 'lowquality') {
      query += 'p.quality_score ASC';
    } else if (sortBy === 'serp_desc') {
      query += "COALESCE((p.serp_summary->>'currentPosition')::int, 0) DESC";
    } else if (sortBy === 'serp_asc') {
      query += "COALESCE((p.serp_summary->>'currentPosition')::int, 100) ASC";
    } else if (sortBy === 'clicks_desc') {
      query += "COALESCE((p.weekly_metrics->0->>'clicks')::int, 0) DESC";
    } else if (sortBy === 'clicks_asc') {
      query += "COALESCE((p.weekly_metrics->0->>'clicks')::int, 0) ASC";
    } else if (sortBy === 'mostimpressions') {
      query += "COALESCE((p.weekly_metrics->0->>'impressions')::int, 0) DESC";
    } else if (sortBy === 'highestctr') {
      query += "COALESCE((p.weekly_metrics->0->>'ctr')::float, 0) DESC";
    } else if (sortBy === 'bestposition') {
      query += "COALESCE((p.weekly_metrics->0->>'position')::float, 100) ASC";
    } else {
      query += 'p.date_modified DESC';
    }

    query += ' OFFSET $2 LIMIT $3';
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getExportData(orgId, options) {
    const { keyword, resultKey, sortBy, filters, workflow } = options;
    let {
      contentType,
      status,
      redirect,
      matchType,
      minQuality,
      maxQuality,
      labels,
      creators,
      startCreatDate,
      endCreatDate,
      editors,
      startEditDate,
      endEditDate,
      pagePath,
      minSerp,
      maxSerp,
      minClicks,
      maxClicks,
      minImpressions,
      maxImpressions,
      minCTR,
      maxCTR,
      minPosition,
      maxPosition,
      minSkus,
      maxSkus,
    } = filters || {};

    if (labels?.length > 0) {
      labels = labels.map(({ value }) => value);
    }

    if (creators?.length > 0) {
      creators = creators.map(({ value }) => value);
    }

    if (editors?.length > 0) {
      editors = editors.map(({ value }) => value);
    }

    if (!minQuality) {
      minQuality = 0;
    }
    if (!maxQuality) {
      maxQuality = 10;
    }
    if (!minClicks) {
      minClicks = 0;
    }
    if (maxClicks === null || typeof maxClicks == 'undefined') {
      maxClicks = 2147483647;
    }
    const values = [
      orgId,
      keyword ? '%' + keyword.toLowerCase() + '%' : '%',
      PageStatus.DELETED,
      contentType || '',
      status || -1,
      minQuality,
      maxQuality,
      workflow?.contentTypes?.value || '',
      parseInt(workflow?.searchParams?.pageStatus) || -1,
      resultKey || '',
      minSkus === '0' ? 0 : parseInt(minSkus) || -1,
      maxSkus === '0' ? 0 : parseInt(maxSkus) || -1,
      creators || [],
    ];
    let valueIndex = values.length + 1;

    let query = `SELECT 
          p.page_id AS "pageId", 
          p.slug, p.title, 
          p.content_template_id AS "contentTemplateId", 
          COALESCE(ct.name, 'Free-Form') AS "contentTemplateName", 
          p.keyword, 
          p.status, 
          p.date_added AS "dateAdded", 
          p.date_published AS "datePublished", 
          p.date_unpublished AS "dateUnpublished", 
          p.date_modified AS "dateModified", 
          p.results, 
          p.monthly_volume AS "volume", 
          p.quality_score AS "qualityScore", 
          p.quality_metrics AS "qualityMetrics", 
          p.labels, 
          p.weekly_metrics AS "weeklyMetrics", 
          COALESCE(p.serp_summary->>'currentPosition', '') AS "serp",
          p.page_settings AS "pageSettings", 
          (SELECT email FROM account a WHERE a.account_id = p.author_id) AS "authorEmail", 
          (SELECT email FROM account a WHERE a.account_id = p.last_editor_id) AS "lastEditorEmail",
          k.monthly_volume AS "monthlyVolume", 
          p.page_settings->>'metaDescription' AS "metaDescription", 
          concat('https://s3.amazonaws.com/preview.devops.optiversal.com/', p.organization_id, '/', p.page_id, CASE WHEN COALESCE(p.page_settings->>'pagePath', '')='' THEN '/' ELSE p.page_settings->>'pagePath' END, p.slug) AS "previewURL"
        FROM page p LEFT JOIN content_template ct ON p.content_template_id=ct.content_template_id LEFT JOIN keyword k ON lower(p.title)=lower(k.keyword)
        WHERE p.organization_id=$1 
          AND LOWER(p.title) LIKE $2 
          AND ($4='' OR p.content_template_id=$4) 
          AND (($5=-1 AND p.status<>$3) OR ($5<>-1 AND p.status=$5)  OR ($9<>-1 AND p.status=$9)) 
          AND (p.quality_score IS NULL OR p.quality_score >= $6) 
          AND (p.quality_score IS NULL OR p.quality_score <= $7)
          AND ($8 = '' OR p.content_template_id = $8) 
          AND ($10 = '' OR p.result_key = $10)
          AND ($11=-1 OR jsonb_array_length(p.results)>=$11)
          AND ($12=-1 OR jsonb_array_length(p.results)<=$12) 
          AND (cardinality($13::text[])=0 OR p.author_id=ANY($13))`;

    if (redirect) {
      query += ` AND p.page_settings->>'redirectUrl' IS NOT NULL AND p.page_settings->>'redirectUrl' != ''`;
    }

    if (pagePath) {
      query += ` AND p.page_settings->>'pagePath' LIKE $${valueIndex++}`;
      values.push(`%${pagePath}%`);
    }

    if (startCreatDate) {
      query += ` AND p.date_added>=$${valueIndex++}`;
      values.push(startCreatDate + ' 00:00:00');
    }
    if (endCreatDate) {
      query += ` AND p.date_added <= $${valueIndex++}`;
      values.push(endCreatDate + ' 23:59:59');
    }

    if (editors || startEditDate || endEditDate) {
      query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

      if (editors) {
        query += ` AND aa.account_id IN (${editors
          .map(() => `$${valueIndex++}`)
          .join(', ')})`;
        values.push(...editors);
      }

      if (startEditDate) {
        query += ` AND aa.date_added >= $${valueIndex++}`;
        values.push(startEditDate + ' 00:00:00');
      }
      if (endEditDate) {
        query += ` AND aa.date_added <= $${valueIndex++}`;
        values.push(endEditDate + ' 23:59:59');
      }

      query += ')';
    }

    if (labels) {
      query += ' AND (';

      const subQuery = labels.map((label) => {
        values.push(label);
        return `p.labels ? $${valueIndex++}`;
      });

      query += subQuery.join(matchType ? ' AND ' : ' OR ') + ')';
    }

    if (minSerp) {
      query += ` AND (COALESCE((p.serp_summary->>'currentPosition')::int, 100) >= ${minSerp})`;
    }
    if (maxSerp) {
      query += ` AND (COALESCE((p.serp_summary->>'currentPosition')::int, 100) <= ${maxSerp})`;
    }

    // for metrics filter
    query += ` AND (coalesce((p.weekly_metrics->0->>\'clicks\')::int, 0) >= ${
      minClicks || 0
    }) AND (coalesce((p.weekly_metrics->0->>\'clicks\')::int, 0) <= ${
      maxClicks || 2147483647
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'impressions\')::int, 0) >= ${
      minImpressions || 0
    }) AND (coalesce((p.weekly_metrics->0->>\'impressions\')::int, 0) <= ${
      maxImpressions || 2147483647
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'ctr\')::float, 0) >= ${
      minCTR || 0.0
    }) AND (coalesce((p.weekly_metrics->0->>\'ctr\')::float, 0.00) <= ${
      maxCTR || 1.0
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'position\')::float, 0) >= ${
      minPosition || 0.0
    }) AND (coalesce((p.weekly_metrics->0->>\'position\')::float, 0.00) <= ${
      maxPosition || 2147483647
    })`;

    if (workflow) {
      values.push(workflow.workflowId);
      query += `AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$${valueIndex++} AND cwi.item_id = p.page_id)`;

      const editors = workflow?.searchParams?.editors?.map((e) => e.value);
      if (editors.length > 0) {
        query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

        if (editors) {
          query += ` AND aa.account_id IN (${editors
            .map(() => `$${valueIndex++}`)
            .join(', ')})`;
          values.push(...editors);
        }
        query += ')';
      }

      if (workflow?.searchParams?.filterLabels?.length > 0) {
        query += ' AND (';

        const subQuery = workflow?.searchParams?.filterLabels?.map((label) => {
          values.push(label.value);
          return `p.labels ? $${valueIndex++}`;
        });

        query +=
          subQuery.join(
            workflow?.searchParams?.matchType === 'all' ? ' AND ' : ' OR ',
          ) + ')';
      }
    }

    query += ' ORDER BY ';
    if (sortBy === 'dateModified_asc') {
      query += 'p.date_modified ASC';
    } else if (sortBy === 'dateAdded_desc') {
      query += 'p.date_added DESC';
    } else if (sortBy === 'dateAdded_asc') {
      query += 'p.date_added ASC';
    } else if (sortBy === 'contentTemplateName_asc') {
      query += 'ct.name ASC';
    } else if (sortBy === 'contentTemplateName_desc') {
      query += 'ct.name DESC';
    } else if (sortBy === 'title_asc') {
      query += 'p.title ASC';
    } else if (sortBy === 'title_desc') {
      query += 'p.title DESC';
    } else if (sortBy === 'highquality') {
      query += 'p.quality_score DESC';
    } else if (sortBy === 'lowquality') {
      query += 'p.quality_score ASC';
    } else if (sortBy === 'serp_desc') {
      query += "COALESCE((p.serp_summary->>'currentPosition')::int, 0) DESC";
    } else if (sortBy === 'serp_asc') {
      query += "COALESCE((p.serp_summary->>'currentPosition')::int, 100) ASC";
    } else if (sortBy === 'clicks_desc') {
      query += "COALESCE((p.weekly_metrics->0->>'clicks')::int, 0) DESC";
    } else if (sortBy === 'clicks_asc') {
      query += "COALESCE((p.weekly_metrics->0->>'clicks')::int, 0) ASC";
    } else if (sortBy === 'mostimpressions') {
      query += "COALESCE((p.weekly_metrics->0->>'impressions')::int, 0) DESC";
    } else if (sortBy === 'highestctr') {
      query += "COALESCE((p.weekly_metrics->0->>'ctr')::float, 0) DESC";
    } else if (sortBy === 'bestposition') {
      query += "COALESCE((p.weekly_metrics->0->>'position')::float, 100) ASC";
    } else {
      query += 'p.date_modified DESC';
    }

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getCount(orgId, keyword, filters, resultKey) {
    let {
      contentType,
      status,
      redirect,
      matchType,
      minQuality,
      maxQuality,
      labels,
      creators,
      startCreatDate,
      endCreatDate,
      editors,
      startEditDate,
      endEditDate,
      pagePath,
      minSerp,
      maxSerp,
      minClicks,
      maxClicks,
      minImpressions,
      maxImpressions,
      minCTR,
      maxCTR,
      minPosition,
      maxPosition,
      workflow,
      minSkus,
      maxSkus,
    } = filters || {};

    if (labels?.length > 0) {
      labels = labels.map(({ value }) => value);
    }

    if (creators?.length > 0) {
      creators = creators.map(({ value }) => value);
    }

    if (editors?.length > 0) {
      editors = editors.map(({ value }) => value);
    }

    if (!minQuality) {
      minQuality = 0;
    }
    if (!maxQuality) {
      maxQuality = 10;
    }
    if (!minClicks) {
      minClicks = 0;
    }
    if (maxClicks === null || typeof maxClicks == 'undefined') {
      maxClicks = 2147483647;
    }
    const values = [
      orgId,
      keyword ? '%' + keyword.toLowerCase() + '%' : '%',
      PageStatus.DELETED,
      contentType || '',
      status || -1,
      minQuality,
      maxQuality,
      workflow?.contentTypes?.value || '',
      parseInt(workflow?.searchParams?.pageStatus) || -1,
      resultKey || '',
      minSkus === '0' ? 0 : parseInt(minSkus) || -1,
      maxSkus === '0' ? 0 : parseInt(maxSkus) || -1,
      creators || [],
    ];
    let valueIndex = values.length + 1;

    let query = `SELECT COUNT(1) AS total 
        FROM page p LEFT JOIN content_template ct ON p.content_template_id=ct.content_template_id 
        WHERE p.organization_id=$1 
          AND LOWER(p.title) LIKE $2 AND ($4='' OR p.content_template_id=$4) 
          AND (($5=-1 AND p.status<>$3) OR ($5<>-1 AND p.status=$5)  OR ($9<>-1 AND p.status=$9)) 
          AND (p.quality_score IS NULL OR p.quality_score >= $6) 
          AND (p.quality_score IS NULL OR p.quality_score <= $7)
          AND ($8 = '' OR p.content_template_id = $8)
          AND ($10 = '' OR p.result_key = $10)
          AND ($11=-1 OR jsonb_array_length(p.results)>=$11)
          AND ($12=-1 OR jsonb_array_length(p.results)<=$12)
          AND (cardinality($13::text[])=0 OR p.author_id=ANY($13))`;

    if (redirect) {
      query += ` AND p.page_settings->>'redirectUrl' IS NOT NULL AND p.page_settings->>'redirectUrl' != ''`;
    }

    if (pagePath) {
      query += ` AND p.page_settings->>'pagePath' LIKE $${valueIndex++}`;
      values.push(`%${pagePath}%`);
    }

    if (startCreatDate) {
      query += ` AND p.date_added>=$${valueIndex++}`;
      values.push(startCreatDate + ' 00:00:00');
    }
    if (endCreatDate) {
      query += ` AND p.date_added <= $${valueIndex++}`;
      values.push(endCreatDate + ' 23:59:59');
    }

    if (editors || startEditDate || endEditDate) {
      query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

      if (editors) {
        query += ` AND aa.account_id IN (${editors
          .map(() => `$${valueIndex++}`)
          .join(', ')})`;
        values.push(...editors);
      }

      if (startEditDate) {
        query += ` AND aa.date_added >= $${valueIndex++}`;
        values.push(startEditDate + ' 00:00:00');
      }
      if (endEditDate) {
        query += ` AND aa.date_added <= $${valueIndex++}`;
        values.push(endEditDate + ' 23:59:59');
      }

      query += ')';
    }

    if (labels) {
      query += ' AND (';

      const subQuery = labels.map((label) => {
        values.push(label);
        return `p.labels ? $${valueIndex++}`;
      });

      query += subQuery.join(matchType ? ' AND ' : ' OR ') + ')';
    }

    if (minSerp) {
      query += ` AND (COALESCE((p.serp_summary->>'currentPosition')::int, 100) >= ${minSerp})`;
    }
    if (maxSerp) {
      query += ` AND (COALESCE((p.serp_summary->>'currentPosition')::int, 100) <= ${maxSerp})`;
    }

    // for metrics filter
    query += ` AND (coalesce((p.weekly_metrics->0->>\'clicks\')::int, 0) >= ${
      minClicks || 0
    }) AND (coalesce((p.weekly_metrics->0->>\'clicks\')::int, 0) <= ${
      maxClicks || 2147483647
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'impressions\')::int, 0) >= ${
      minImpressions || 0
    }) AND (coalesce((p.weekly_metrics->0->>\'impressions\')::int, 0) <= ${
      maxImpressions || 2147483647
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'ctr\')::float, 0) >= ${
      minCTR || 0.0
    }) AND (coalesce((p.weekly_metrics->0->>\'ctr\')::float, 0.00) <= ${
      maxCTR || 1.0
    })`;
    query += ` AND (coalesce((p.weekly_metrics->0->>\'position\')::float, 0) >= ${
      minPosition || 0.0
    }) AND (coalesce((p.weekly_metrics->0->>\'position\')::float, 0.00) <= ${
      maxPosition || 2147483647
    })`;

    if (workflow) {
      values.push(workflow.workflowId);
      query += `AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$${valueIndex++} AND cwi.item_id = p.page_id)`;

      const editors = workflow?.searchParams?.editors?.map((e) => e.value);
      if (editors.length > 0) {
        query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

        if (editors) {
          query += ` AND aa.account_id IN (${editors
            .map(() => `$${valueIndex++}`)
            .join(', ')})`;
          values.push(...editors);
        }
        query += ')';
      }

      if (workflow?.searchParams?.filterLabels?.length > 0) {
        query += ' AND (';

        const subQuery = workflow?.searchParams?.filterLabels?.map((label) => {
          values.push(label.value);
          return `p.labels ? $${valueIndex++}`;
        });

        query +=
          subQuery.join(
            workflow?.searchParams?.matchType === 'all' ? ' AND ' : ' OR ',
          ) + ')';
      }
    }

    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }

  static async addLabel(pageId, orgId, label) {
    const { rows } = await db.query(
      'SELECT labels FROM page WHERE page_id = $1',
      [pageId],
    );

    if (rows.length > 0 && !rows[0].labels?.includes(label)) {
      const values = [pageId, orgId, label];

      this.setLabelSubscriptions(pageId, [], [label]);

      await db.query(
        "UPDATE page SET labels=COALESCE(labels, '[]'::jsonb) || jsonb_build_array($3) WHERE page_id=$1 AND organization_id=$2 AND (labels IS NULL OR NOT labels ? $3)",
        values,
      );
    }
  }

  static async setLabels(pageId, orgId, labels) {
    const { rows } = await db.query(
      'SELECT labels FROM page WHERE page_id = $1',
      [pageId],
    );

    if (rows.length > 0 && !compareArray(rows[0].labels, labels)) {
      const values = [pageId, orgId, JSON.stringify(labels)];

      this.setLabelSubscriptions(pageId, rows[0].labels, labels);

      await db.query(
        'UPDATE page SET labels=$3 WHERE page_id=$1 AND organization_id=$2',
        values,
      );
    }
  }

  static async setLabelsBySlug(pageSlug, orgId, labels) {
    const { rows } = await db.query(
      'SELECT page_id AS "pageId", labels FROM page WHERE slug = $1',
      [pageSlug],
    );

    if (rows.length > 0 && !compareArray(rows[0].labels, labels)) {
      const values = [rows[0].pageId, orgId, JSON.stringify(labels)];

      this.setLabelSubscriptions(rows[0].pageId, rows[0].labels, labels);

      await db.query(
        'UPDATE page SET labels=$3 WHERE page_id=$1 AND organization_id=$2',
        values,
      );
    }
  }

  static async getTranslations(orgId, pageId) {
    const values = [orgId, pageId];
    const { rows } = await db.query(
      'SELECT translations FROM page WHERE organization_id=$1 AND page_id=$2',
      values,
    );
    if (rows && rows.length > 0) {
      return rows[0].translations;
    }
    return null;
  }

  static async setTranslation(pageId, languageCode, data) {
    const values = [pageId, '{"' + languageCode + '"}', data];
    const { rows } = await db.query(
      "UPDATE page SET translations=jsonb_set(COALESCE(translations, jsonb '{}'), $2, $3, true) WHERE page_id=$1",
      values,
    );
    return rows;
  }

  static async setLabelSubscriptions(pageId, originalLabels, newLabels) {
    try {
      const labels = newLabels?.filter(
        (label) => !originalLabels?.includes(label),
      );
      const values = [pageId, labels, JSON.stringify(labels)];
      const sql = `
      INSERT 
        INTO content_label_alert (alert_id, subscription_id, account_id, labels, date_triggered, date_notified, item_id, item_type)
      SELECT 
        uuid_generate_v4() AS alert_id, 
        cls.subscription_id, 
        cls.account_id,
        array_to_json(ARRAY(
          select t1.value from jsonb_array_elements_text(cls.labels) t1, jsonb_array_elements_text($3::jsonb) t2 where t1.value = t2.value
        )) AS labels,
        NOW() AS date_triggered, 
        NULL AS date_notified, 
        p.page_id AS item_id, 
        'page' AS item_type 
      FROM 
        content_label_subscription cls, 
        page p 
      WHERE 
        p.page_id = $1
      AND cls.labels ?| $2
      `;
      await db.query(sql, values);
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getNext(
    orgId,
    workflowId,
    editors,
    contentTemplateId,
    filterLabels,
    matchType,
    status,
    pageId,
  ) {
    const values = [
      orgId,
      contentTemplateId || '',
      PageStatus.DELETED,
      status || -1,
      pageId || '',
      workflowId || '',
    ];
    let valueIndex = values.length + 1;

    let query = `SELECT p.page_id AS "pageId", 
        p.organization_id AS "organizationId",
        p.slug, p.title, 
        p.content_template_id AS "contentTemplateId", 
        p.content, 
        p.content_settings AS "contentSettings", 
        p.keyword, p.status, 
        p.date_added AS "dateAdded", 
        p.search_params AS "searchParameters", 
        p.results, p.labels, 
        p.page_settings AS "pageSettings", 
        p.date_added AS "dateAdded", 
        p.date_modified AS "dateModified", 
        p.last_updated as "lastUpdated", 
        p.locations 
      FROM page p LEFT JOIN content_template ct ON p.content_template_id=ct.content_template_id 
      WHERE p.organization_id=$1 
        AND ($5='' OR p.page_id=$5)
        AND ($2='' OR p.content_template_id=$2) 
        AND (($4=-1 AND p.status<>$3) OR ($4<>-1 AND p.status=$4)) 
        AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id=$1 AND cwi.content_workflow_id=$6 AND cwi.item_id = p.page_id)`;

    if (editors.length > 0) {
      query += ` AND EXISTS (SELECT 1 FROM account_action aa WHERE aa.organization_id = $1 AND aa.action_details->>'itemType'='page' AND aa.action_details->>'itemId'=p.page_id AND (aa.action_details->>'actionType'='CreatePage' OR aa.action_details->>'actionType'='UpdatePageContent')`;

      if (editors) {
        query += ` AND aa.account_id IN (${editors
          .map(() => `$${valueIndex++}`)
          .join(', ')})`;
        values.push(...editors);
      }
      query += ')';
    }

    if (filterLabels?.length > 0) {
      query += ' AND (';

      const subQuery = filterLabels.map((label) => {
        values.push(label);
        return `p.labels ? $${valueIndex++}`;
      });

      query += subQuery.join(matchType === 'all' ? ' AND ' : ' OR ') + ')';
    }

    query += ' ORDER BY p.date_modified DESC LIMIT 1';

    const { rows } = await db.query(query, values);
    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  }

  static async findByResultKey(orgId, pageId, resultKey) {
    const values = [orgId, pageId || '', resultKey];

    let query = `SELECT page_id AS "pageId", slug, title FROM page WHERE organization_id=$1 AND ($2='' OR page_id!=$2)  AND result_key=$3`;

    const { rows } = await db.query(query, values);

    if (rows && rows.length > 0) {
      return rows;
    }
    return null;
  }

  static async findByTitle(orgId, titles, pageId) {
    const values = [orgId, pageId || '', titles || ''];

    let query = `SELECT page_id AS "pageId", slug, title FROM page WHERE organization_id=$1 AND ($2='' OR page_id<>$2) AND LOWER(title)=ANY($3)`;
    const { rows } = await db.query(query, values);

    if (rows && rows.length > 0) {
      return rows;
    }
    return null;
  }
}

module.exports = PageDB;
