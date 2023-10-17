const db = require('.');
const { SuggestionStatus, WorkflowType } = require('@util/enum');
const { getProductQueryWhere } = require('@helpers/workflow');

class SuggestionDB {
  static async setStatus(keyword, orgId, status) {
    try {
      const values = [keyword.toLowerCase(), orgId, status];
      await db.query(
        'UPDATE keyword_suggestion SET status=$3, date_modified=NOW() WHERE LOWER(keyword)=$1 AND organization_id=$2',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async addLabel(keyword, orgId, label) {
    const values = [keyword.toLowerCase(), orgId, label];
    await db.query(
      "UPDATE keyword_suggestion SET labels=COALESCE(labels, '[]'::jsonb) || jsonb_build_array($3) WHERE LOWER(keyword)=$1 AND organization_id=$2 AND (labels IS NULL OR NOT labels ? $3)",
      values,
    );
  }

  static async setLabels(keyword, orgId, labels) {
    const values = [keyword.toLowerCase(), orgId, JSON.stringify(labels)];
    await db.query(
      'UPDATE keyword_suggestion SET labels=$3 WHERE LOWER(keyword)=$1 AND organization_id=$2',
      values,
    );
  }

  static async getLabels(keyword, orgId) {
    const values = [keyword.toLowerCase(), orgId];
    const { rows } = await db.query(
      'SELECT keyword, labels From keyword_suggestion WHERE LOWER(keyword)=$1 AND organization_id=$2',
      values,
    );
    if (rows && rows.length > 0) {
      return rows[0].labels;
    }
    return [];
  }

  static async getAll(
    orgId,
    offset,
    limit,
    filter,
    importedOnly,
    minQuality,
    maxQuality,
    filterLabel,
    workflow,
    sortBy,
  ) {
    let values = [
      orgId,
      offset,
      limit,
      filter ? '%' + filter.toLowerCase() + '%' : '%',
      SuggestionStatus.SUGGESTED,
      minQuality,
      maxQuality,
      SuggestionStatus.MANUAL,
      SuggestionStatus.RECHECK,
    ];
    let valueIndex = values.length + 1;
    let query = `SELECT keyword, 
        current_search_results AS results, 
        current_quality_metrics AS "qualityMetrics", 
        quality_score AS "qualityScore", 
        status, 
        date_added AS "dateAdded", 
        last_checked AS "lastChecked", 
        monthly_volume AS "volume", 
        labels, 
        variants 
      FROM keyword_suggestion 
      WHERE organization_id=$1 
        AND (status=$5 OR status=$8 OR status=$9) 
        AND LOWER(keyword) LIKE $4 
        AND (NOT source IS NULL OR (quality_score >= $6 AND quality_score <= $7)) `;

    if (importedOnly) {
      query += 'AND NOT source IS NULL ';
    }
    if (filterLabel && filterLabel.trim().length > 0) {
      values.push(filterLabel);
      query += `AND labels ? $${valueIndex++}`;
    }
    if (workflow) {
      values.push(workflow.workflowId, WorkflowType.Idea);
      query += ` 
      AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$${valueIndex++} AND cwi.item_type=$${valueIndex++} AND cwi.item_id = keyword)`;

      if (workflow?.searchParams?.importedOnly) {
        query += ' AND NOT source IS NULL ';
      }

      if (workflow?.searchParams?.filterLabels?.length > 0) {
        query += ' AND (';

        const subQuery = workflow.searchParams.filterLabels.map((label) => {
          values.push(label.value);
          return ` labels ? $${valueIndex++}`;
        });

        query +=
          subQuery.join(
            workflow.searchParams.matchType === 'all' ? ' AND ' : ' OR ',
          ) + ')';
      }
    }
    query += ' ORDER BY ';
    if (sortBy === 'dateAdded_desc') {
      query += 'date_added DESC ';
    } else if (sortBy === 'dateAdded_asc') {
      query += 'date_added ASC ';
    } else if (sortBy === 'volume_desc') {
      query += 'monthly_volume DESC ';
    } else if (sortBy === 'volume_asc') {
      query += 'monthly_volume ASC ';
    } else if (sortBy === 'keyword_asc') {
      query += 'keyword ASC ';
    } else if (sortBy === 'keyword_desc') {
      query += 'keyword DESC ';
    } else {
      query += ' COALESCE(quality_score, 0) DESC, monthly_volume DESC ';
    }

    query += ', keyword ASC OFFSET $2 LIMIT $3';
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getNext(
    orgId,
    workflowId,
    filterLabels,
    importedOnly,
    matchType,
    keyword,
  ) {
    const values = [
      orgId,
      SuggestionStatus.SUGGESTED,
      SuggestionStatus.MANUAL,
      WorkflowType.Idea,
      SuggestionStatus.RECHECK,
      (keyword || '').toLowerCase(),
      workflowId || '',
    ];
    let valueIndex = values.length + 1;
    let query = `SELECT ks.keyword, ks.labels 
      FROM keyword_suggestion ks 
      WHERE ks.organization_id=$1 
        AND ($6='' OR LOWER(ks.keyword)=$6)
        AND (ks.status=$2 OR ks.status=$3 OR ks.status=$5) 
        AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$7 AND cwi.item_type=$4 AND cwi.item_id = ks.keyword)`;
    if (importedOnly) {
      query += ' AND NOT ks.source IS NULL ';
    }

    if (filterLabels?.length > 0) {
      query += ' AND (';

      const subQuery = filterLabels.map((label) => {
        values.push(label);
        return ` ks.labels ? $${valueIndex++}`;
      });

      query += subQuery.join(matchType === 'all' ? ' AND ' : ' OR ') + ')';
    }
    query +=
      ' ORDER BY COALESCE(ks.quality_score, 0) DESC, ks.monthly_volume DESC, ks.keyword ASC LIMIT 1';

    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return rows[0];
    }
    return null;
  }

  static async getCount(
    orgId,
    filter,
    importedOnly,
    minQuality,
    maxQuality,
    filterLabel,
    workflow,
  ) {
    let values = [
      orgId,
      filter ? '%' + filter.toLowerCase() + '%' : '%',
      SuggestionStatus.SUGGESTED,
      minQuality,
      maxQuality,
      SuggestionStatus.MANUAL,
      SuggestionStatus.RECHECK,
    ];
    let valueIndex = values.length + 1;
    let query =
      'SELECT COUNT(1) AS total FROM keyword_suggestion WHERE organization_id=$1 AND (status=$3 OR status=$6 OR status=$7) AND LOWER(keyword) LIKE $2 AND (NOT source IS NULL OR (quality_score >= $4 AND quality_score <= $5))';
    if (importedOnly) {
      query += ' AND NOT source IS NULL';
    }
    if (filterLabel && filterLabel.trim().length > 0) {
      values.push(filterLabel);
      query += ` AND labels ? $${valueIndex++}`;
    }
    if (workflow) {
      values.push(workflow.workflowId, WorkflowType.Idea);
      query += `
      AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$${valueIndex++} AND cwi.item_type=$${valueIndex++} AND cwi.item_id = keyword)`;

      if (workflow?.searchParams?.importedOnly) {
        query += ' AND NOT source IS NULL ';
      }

      if (workflow?.searchParams?.filterLabels?.length > 0) {
        query += ' AND (';

        const subQuery = workflow.searchParams.filterLabels.map((label) => {
          values.push(label.value);
          return ` labels ? $${valueIndex++}`;
        });

        query +=
          subQuery.join(
            workflow.searchParams.matchType === 'all' ? ' AND ' : ' OR ',
          ) + ')';
      }
    }

    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }

  static async getByKeyword(orgId, keyword) {
    const values = [orgId, keyword.toLowerCase()];
    const { rows } = await db.query(
      'SELECT keyword, current_search_results AS results, current_quality_metrics AS "qualityMetrics", quality_score AS "qualityScore", status, date_added AS "dateAdded", last_checked AS "lastChecked", monthly_volume AS "volume", labels FROM keyword_suggestion WHERE organization_id=$1 AND LOWER(keyword)=$2',
      values,
    );
    if (rows && rows.length === 1) {
      return rows[0];
    }
    return null;
  }
}

module.exports = SuggestionDB;
