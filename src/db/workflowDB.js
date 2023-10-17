import { v4 as uuidv4 } from 'uuid';
const { getProductQueryWhere } = require('@helpers/workflow');
const db = require('.');
const { WorkflowType, SuggestionStatus, PageStatus } = require('@util/enum');
class WorkflowDB {
  static async save(
    workflowId,
    organizationId,
    name,
    searchParams,
    contentTypes,
    assignedTo,
    workflowType,
    settings,
    accountId,
  ) {
    try {
      const values = [
        workflowId,
        organizationId,
        name,
        searchParams,
        JSON.stringify(contentTypes),
        JSON.stringify(assignedTo),
        workflowType,
        settings,
        accountId,
        0,
      ];
      const { rows } = await db.query(
        'INSERT INTO content_workflow (content_workflow_id, organization_id, name, search_params, content_types, assigned_to, workflow_type, settings, created_by, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (content_workflow_id) DO UPDATE SET name=$3, search_params=$4, content_types=$5, assigned_to=$6, workflow_type=$7, settings=$8, created_by=$9, status=$10, date_modified=NOW()',
        values,
      );
      return rows[0];
    } catch (exc) {
      console.error(exc);
      return false;
    }
  }

  static async deleteWorkflowItems(workflowId, organizationId) {
    try {
      const values = [workflowId, organizationId];

      await db.query(
        'DELETE FROM content_workflow_item WHERE content_workflow_id=$1 and organization_id=$2',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
  }

  static async saveFileWorkflowItems(
    workflowId,
    organizationId,
    inputContents,
  ) {
    try {
      await Promise.all(
        inputContents.map(async (item) => {
          const itemId = uuidv4();
          const values = [
            itemId,
            workflowId,
            organizationId,
            item,
            WorkflowType.File,
            item.order,
          ];
          await db.query(
            `INSERT INTO content_workflow_item (content_workflow_item_id, content_workflow_id, organization_id, input_content, item_type, item_order) VALUES ($1, $2, $3, $4, $5, $6)`,
            values,
          );
        }),
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
  }

  static async getById(workflowId, organizationId) {
    const values = [workflowId, organizationId];
    const { rows } = await db.query(
      'SELECT content_workflow_id AS "workflowId", organization_id AS "organizationId", name as "name", search_params AS "searchParams", content_types AS "contentTypes", assigned_to AS "assignedTo", workflow_type AS "workflowType", settings, date_added AS "dateAdded", date_modified AS "dateModified" FROM content_workflow where content_workflow_id=$1 AND organization_id=$2 AND (status is null or status !=1)',
      values,
    );
    if (!rows || rows.length !== 1) {
      return null;
    } else {
      return rows[0];
    }
  }

  static async updateWorkflowStatus(workflowId, status, organizationId) {
    try {
      const values = [status, workflowId, organizationId];
      await db.query(
        'UPDATE content_workflow SET status=$1 WHERE content_workflow_id=$2 AND organization_id=$3',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  // Check if workflow is owned-by or assigned-to user
  static async checkAccess(workflowId, orgId, accountId) {
    const values = [orgId, accountId, '[{"value": "' + accountId + '"}]', workflowId];
    let query =
      'SELECT content_workflow_id AS "workflowId", organization_id AS "organizationId", name, search_params AS "searchParams", content_types AS "contentTypes", assigned_to AS "assignedTo", created_by AS creator, workflow_type AS "workflowType", date_added AS "dateAdded", date_modified AS "dateModified" FROM content_workflow WHERE content_workflow_id=$4 AND organization_id=$1 AND (created_by=$2 OR assigned_to @> $3::jsonb) AND (status IS NULL or status != 1)';
    const { rows } = await db.query(query, values);
    return rows.length === 1 ? rows[0] : undefined;
  }

  static async getForUser(orgId, accountId) {
    const values = [orgId, accountId, '[{"value": "' + accountId + '"}]'];
    let query =
      'SELECT content_workflow_id AS "workflowId", organization_id AS "organizationId", name, search_params AS "searchParams", content_types AS "contentTypes", assigned_to AS "assignedTo", created_by AS creator, workflow_type AS "workflowType", date_added AS "dateAdded", date_modified AS "dateModified" FROM content_workflow WHERE organization_id=$1 AND (created_by=$2 OR assigned_to @> $3::jsonb) AND (status IS NULL or status != 1) ORDER BY date_modified DESC';
    const { rows } = await db.query(query, values);

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].workflowType && rows[i].workflowType === WorkflowType.File) {
        const completedItemCount = await this.getCompletedFileItemCount(
          rows[i].workflowId,
          orgId,
        );
        const itemCount = await this.getFileItemCount(
          rows[i].workflowId,
          orgId,
        );

        rows[i].completedItemCount = completedItemCount;
        rows[i].itemCount = itemCount - completedItemCount;
      } else if (
        rows[i].workflowType &&
        rows[i].workflowType === WorkflowType.Idea
      ) {
        const completedItemCount = await this.getCompletedIdeaItemCount(
          rows[i].workflowId,
          orgId,
        );
        rows[i].itemCount = await this.getIdeaItemCount(rows[i], orgId);

        rows[i].completedItemCount = completedItemCount;
      } else if (
        rows[i].workflowType &&
        rows[i].workflowType === WorkflowType.Page
      ) {
        const completedItemCount = await this.getCompletedPageItemCount(
          rows[i].workflowId,
          orgId,
        );
        rows[i].itemCount = await this.getPageItemCount(rows[i], orgId);

        rows[i].completedItemCount = completedItemCount;
      } else {
        rows[i].completedItemCount = await this.getCompletedProductCount(
          rows[i].workflowId,
          orgId,
        );
        rows[i].itemCount = await this.getProductCount(
          rows[i].workflowId,
          orgId,
        );
      }
    }
    return rows;
  }

  static async getCount(orgId, accountId) {
    const values = [orgId, accountId, '[{"value": "' + accountId + '"}]'];
    let query =
      'SELECT COUNT(1) AS total FROM content_workflow WHERE organization_id=$1 AND (created_by=$2 OR assigned_to @> $3::jsonb) AND (status IS NULL or status != 1)';
    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }

  static async getItems(workflowId, organizationId) {
    const values = [workflowId, organizationId];
    const { rows } = await db.query(
      'SELECT content_workflow_item_id AS "itemId", content_workflow_id AS "workflowId", organization_id AS "organizationId", input_content AS "inputContent", output_content AS "outputContent" FROM content_workflow_item where content_workflow_id=$1 AND organization_id=$2 AND date_completed IS NULL ORDER BY item_order',
      values,
    );
    if (!rows) {
      return null;
    } else {
      return rows;
    }
  }

  static async getCompletedItemsCount(workflowId, organizationId) {
    const values = [workflowId, organizationId];
    let query = `SELECT COUNT(*) FROM content_workflow_item cwi WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=$2 AND cwi.date_completed IS NOT NULL`;

    const { rows } = await db.query(query, values);
    if (!rows) {
      return null;
    } else {
      return rows[0].count;
    }
  }

  static async getCompletedItems(
    workflowId,
    organizationId,
    offset,
    limit,
    sortBy,
  ) {
    const values = [workflowId, organizationId, offset, limit];

    let query = `SELECT cwi.content_workflow_item_id AS "itemId",
        cwi.input_content AS "inputContent",
        cwi.output_content AS "outputContent",
        cwi.workflow_action AS "workflowAction",
        COALESCE(a.email, cwi.completed_by) AS "completedBy",
        cwi.date_completed AS "dateCompleted",
        cwi.item_type AS "itemType"
      FROM content_workflow_item cwi LEFT JOIN account a ON cwi.completed_by=a.account_id
      WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=$2 AND cwi.date_completed IS NOT NULL`;

    query += ' ORDER BY ';
    if (sortBy === 'dateCompleted_desc') {
      query += 'cwi.date_completed DESC ';
    } else if (sortBy === 'dateCompleted_asc') {
      query += 'cwi.date_completed ASC ';
    }

    query += ', cwi.item_order ASC OFFSET $3 LIMIT $4';
    const { rows } = await db.query(query, values);
    if (!rows) {
      return null;
    } else {
      return rows;
    }
  }

  static async updateItem(item, accountId, organizationId) {
    try {
      const itemId = item.itemId;
      const outputContent = item.outputContent;
      const values = [
        outputContent,
        accountId,
        itemId,
        WorkflowType.File,
        organizationId,
      ];
      await db.query(
        'UPDATE content_workflow_item SET output_content=$1, item_type=$4, completed_by=$2 WHERE content_workflow_item_id=$3 AND organization_id=$5',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async resetItem(itemId, organizationId) {
    try {
      const values = [itemId, null, null, organizationId];
      await db.query(
        'UPDATE content_workflow_item SET date_completed=$2, completed_by=$3 WHERE content_workflow_item_id=$1 AND organization_id=$4',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async completeItem(itemId, accountId, organizationId) {
    try {
      const values = [itemId, accountId, organizationId];
      await db.query(
        'UPDATE content_workflow_item SET date_completed=NOW(), completed_by=$2 WHERE content_workflow_item_id=$1 AND organization_id=$3',
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getFileItemCount(workflowId, orgId) {
    const values = [workflowId, orgId];
    const { rows } = await db.query(
      'SELECT COUNT(*) FROM content_workflow_item where content_workflow_id=$1 AND organization_id=$2',
      values,
    );
    return rows[0]?.count || 0;
  }

  static async getCompletedFileItemCount(workflowId, orgId) {
    const values = [workflowId, orgId];
    const { rows } = await db.query(
      'SELECT COUNT(*) FROM content_workflow_item where content_workflow_id=$1 AND organization_id=$2 AND date_completed IS NOT NULL',
      values,
    );
    return rows[0]?.count || 0;
  }

  static async getIdeaItemCount(workflow, orgId) {
    const values = [
      orgId,
      SuggestionStatus.SUGGESTED,
      SuggestionStatus.MANUAL,
      WorkflowType.Idea,
      workflow.workflowId,
    ];
    let valueIndex = values.length + 1;
    let query =
      'SELECT count(*) FROM keyword_suggestion ks WHERE ks.organization_id=$1 AND (ks.status=$2 OR ks.status=$3) AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$5 AND cwi.item_type=$4 AND cwi.item_id = ks.keyword AND date_completed IS NOT NULL)';
    if (workflow?.searchParams?.importedOnly) {
      query += ' AND NOT ks.source IS NULL ';
    }

    if (workflow?.searchParams?.filterLabels?.length > 0) {
      query += ' AND (';

      const subQuery = workflow.searchParams.filterLabels.map((label) => {
        values.push(label.value);
        return ` ks.labels ? $${valueIndex++}`;
      });

      query +=
        subQuery.join(
          workflow.searchParams.matchType === 'all' ? ' AND ' : ' OR ',
        ) + ')';
    }

    const { rows } = await db.query(query, values);
    return rows[0]?.count || 0;
  }

  static async getCompletedIdeaItemCount(workflowId, orgId) {
    const values = [workflowId, orgId];
    const { rows } = await db.query(
      'SELECT COUNT(*) FROM content_workflow_item where content_workflow_id=$1 AND organization_id=$2 AND date_completed IS NOT NULL',
      values,
    );
    return rows[0]?.count || 0;
  }

  static async getPageItemCount(workflow, orgId) {
    const values = [
      orgId,
      workflow.workflowId,
      workflow?.contentTypes?.value || '',
      PageStatus.DELETED,
      parseInt(workflow?.searchParams?.pageStatus) || -1,
    ];
    let valueIndex = values.length + 1;

    let query = `SELECT COUNT(*)
      FROM page p LEFT JOIN content_template ct ON p.content_template_id=ct.content_template_id
      WHERE p.organization_id=$1
        AND ($3='' OR p.content_template_id=$3)
        AND (($5=-1 AND p.status<>$4) OR ($5<>-1 AND p.status=$5))
        AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.organization_id = $1 AND cwi.content_workflow_id=$2 AND cwi.item_id = p.page_id AND date_completed IS NOT NULL)`;

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

    const { rows } = await db.query(query, values);
    return rows[0]?.count || 0;
  }

  static async getCompletedPageItemCount(workflowId, orgId) {
    const values = [workflowId, orgId];
    const { rows } = await db.query(
      'SELECT COUNT(*) FROM content_workflow_item where content_workflow_id=$1 AND organization_id=$2 AND date_completed IS NOT NULL',
      values,
    );
    return rows[0]?.count || 0;
  }

  static async getProductCount(workflowId, orgId) {
    const queryWhere = await WorkflowDB.getQueryWhere(workflowId, orgId);
    let query =
      'SELECT COUNT(1) AS total FROM product p WHERE ' + queryWhere.query;
    const { rows } = await db.query(query, queryWhere.params);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }

  static async getCompletedProductCount(workflowId, orgId) {
    const values = [orgId, workflowId];
    let query = `SELECT COUNT(1) AS total FROM content_workflow_item cwi WHERE cwi.organization_id=$1 AND cwi.content_workflow_id=$2 AND cwi.completed_by IS NOT NULL`;
    const { rows } = await db.query(query, values);
    if (rows && rows.length === 1) {
      return rows[0].total;
    }
    return 0;
  }

  static async getNextProduct(workflowId, orgId) {
    const queryWhere = await WorkflowDB.getQueryWhere(workflowId, orgId);
    let query =
      'SELECT sku, name, image_url AS "imageUrl", url, description, features, category_id AS "categoryId", content, review_analysis AS "reviewAnalysis" FROM product p WHERE ' +
      queryWhere.query +
      ' ORDER BY RANDOM() LIMIT 1';
    const { rows } = await db.query(query, queryWhere.params);
    if (rows && rows.length === 1) {
      return rows[0];
    }
    return null;
  }

  static async getProductItemTodos(workflowId, orgId) {
    const queryWhere = await WorkflowDB.getQueryWhere(workflowId, orgId);
    let query =
      'SELECT sku, name, image_url AS "imageUrl", url, description, features, category_id AS "categoryId", content, review_analysis AS "reviewAnalysis" FROM product p WHERE ' +
      queryWhere.query;
    const { rows } = await db.query(query, queryWhere.params);
    if (rows) {
      return rows;
    }
    return null;
  }

  static async getQueryWhere(workflowId, orgId) {
    const params = [workflowId];
    let query = `name<>'' AND NOT EXISTS (SELECT 1 FROM content_workflow_item cwi WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=p.organization_id AND cwi.item_id=p.sku)`;
    const workflow = await WorkflowDB.getById(workflowId, orgId);
    const queryResult = getProductQueryWhere(
      orgId,
      workflow && workflow.searchParams
        ? {
            categories:
              workflow.searchParams.categories &&
              workflow.searchParams.categories.map(
                (category) => category.value,
              ),
            attributes:
              workflow.searchParams.attributes &&
              workflow.searchParams.attributes.map((attr) => attr.value),
            missingContent: workflow.searchParams.missingContent,
            filterLabels: workflow.searchParams.filterLabels,
            matchType: workflow.searchParams.matchType,
          }
        : {},
      2,
    );
    query += ' AND ' + queryResult.query;
    params.push(...queryResult.params);
    return {
      query: query,
      params: params,
    };
  }

  static async getCompletedProductWorkflowItems(workflowId, orgId) {
    const values = [workflowId, orgId];
    let query =
      'SELECT p.sku, p.name, cwi.output_content AS "content", cwi.date_completed AS "dateCompleted", COALESCE(a.email, cwi.completed_by) AS "completedBy" FROM content_workflow_item cwi INNER JOIN product p ON cwi.item_id=p.sku AND cwi.organization_id=p.organization_id LEFT JOIN account a ON cwi.completed_by=a.account_id WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=$2 AND cwi.date_completed IS NOT NULL ORDER BY cwi.date_completed DESC';
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getCompletedFileWorkflowItems(workflowId, orgId) {
    const values = [workflowId, orgId];
    let query =
      'SELECT cwi.content_workflow_item_id AS "itemId", cwi.input_content AS "inputContent", cwi.output_content AS "outputContent", cwi.date_completed AS "dateCompleted", COALESCE(a.email, cwi.completed_by) as "completedBy" FROM content_workflow_item cwi LEFT JOIN account a ON cwi.completed_by=a.account_id WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=$2 AND cwi.date_completed IS NOT NULL ORDER BY cwi.date_completed DESC';
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getCompletedIdeaWorkflowItems(workflowId, orgId) {
    const values = [workflowId, orgId];
    let query =
      'SELECT p.page_id AS "pageId", p.title, p.content, cwi.workflow_action as "action", cwi.date_completed AS "dateCompleted", COALESCE(a.email, cwi.completed_by) as "completedBy" FROM content_workflow_item cwi LEFT JOIN account a ON cwi.completed_by=a.account_id LEFT JOIN page p on p.title=cwi.item_id WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=$2 AND cwi.date_completed IS NOT NULL ORDER BY cwi.date_completed DESC';
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async getCompletedPageWorkflowItems(workflowId, orgId) {
    const values = [workflowId, orgId];
    let query =
      'SELECT p.page_id AS "pageId", p.title, p.content, cwi.workflow_action as "action", cwi.date_completed AS "dateCompleted", COALESCE(a.email, cwi.completed_by) as "completedBy" FROM content_workflow_item cwi LEFT JOIN account a ON cwi.completed_by=a.account_id LEFT JOIN page p on p.page_id=cwi.item_id WHERE cwi.content_workflow_id=$1 AND cwi.organization_id=$2 AND cwi.date_completed IS NOT NULL ORDER BY cwi.date_completed DESC';
    const { rows } = await db.query(query, values);
    return rows;
  }

  static async saveProductWorkflowItem(
    accountId,
    workflowItemId,
    workflowId,
    organizationId,
    itemType,
    itemId,
    input_content,
    outputContent,
  ) {
    try {
      const values = [
        workflowItemId,
        workflowId,
        organizationId,
        itemType,
        itemId,
        input_content,
        outputContent,
        accountId,
        'NOW()',
      ];

      await db.query(
        `INSERT INTO content_workflow_item (content_workflow_item_id, content_workflow_id, organization_id, item_type, item_id, input_content, output_content, completed_by, date_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async saveIdeaWorkflowItem(
    accountId,
    workflowItemId,
    workflowId,
    organizationId,
    itemType,
    itemId,
    input_content,
    workflowAction,
  ) {
    try {
      const values = [
        workflowItemId,
        workflowId,
        organizationId,
        itemType,
        itemId,
        input_content,
        workflowAction,
        accountId,
        'NOW()',
      ];

      await db.query(
        `INSERT INTO content_workflow_item (content_workflow_item_id, content_workflow_id, organization_id, item_type, item_id, input_content, workflow_action, completed_by, date_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async savePageWorkflowItem(
    accountId,
    workflowItemId,
    workflowId,
    organizationId,
    itemType,
    itemId,
    inputContent,
    workflowAction,
  ) {
    try {
      const values = [
        workflowItemId,
        workflowId,
        organizationId,
        itemType,
        itemId,
        inputContent,
        workflowAction,
        accountId,
        'NOW()',
      ];

      await db.query(
        `INSERT INTO content_workflow_item (content_workflow_item_id, content_workflow_id, organization_id, item_type, item_id, input_content, workflow_action, completed_by, date_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values,
      );
    } catch (exc) {
      console.error(exc);
      return false;
    }
    return true;
  }

  static async getIdeaWorkflowsByUser(accountId, organizationId, query) {
    const values = [
      WorkflowType.Idea,
      accountId,
      organizationId,
      query ? '%' + query.toLowerCase() + '%' : '%',
    ];
    const { rows } = await db.query(
      'SELECT content_workflow_id AS "workflowId", name FROM content_workflow, jsonb_array_elements(assigned_to) with ordinality arr(assignee) WHERE workflow_type=$1 AND organization_id=$3 AND LOWER(name) LIKE $4 AND arr.assignee->>\'value\'=$2 ORDER BY name',
      values,
    );
    if (!rows) {
      return null;
    } else {
      return rows;
    }
  }

  static async getPageWorkflowsByUser(accountId, organizationId, query) {
    const values = [
      WorkflowType.Page,
      accountId,
      organizationId,
      query ? '%' + query.toLowerCase() + '%' : '%',
    ];
    const { rows } = await db.query(
      'SELECT content_workflow_id AS "workflowId", name FROM content_workflow, jsonb_array_elements(assigned_to) with ordinality arr(assignee) WHERE workflow_type=$1 AND organization_id=$3 AND LOWER(name) LIKE $4 AND arr.assignee->>\'value\'=$2 ORDER BY name',
      values,
    );
    if (!rows) {
      return null;
    } else {
      return rows;
    }
  }
}

module.exports = WorkflowDB;
