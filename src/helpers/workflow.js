export const getProductQueryWhere = (
  orgId,
  {
    categories,
    attributes,
    missingContent,
    minLowestQuality,
    maxLowestQuality,
    filterLabels,
    matchType,
  },
  paramOffset,
) => {
  const params = [orgId];
  let query = `p.organization_id=$${paramOffset++} AND p.is_active=true`;

  if (categories && categories.length > 0) {
    query +=
      ' AND p.category_id IN (' +
      categories.map(() => `$${paramOffset++}`).join(', ') +
      ')';
    params.push(...categories);
  }

  //[{"name": "age", "values": ["grade school", "child"], "dataType": "STRING", "dataTypeInt": 2}, {"name": "gender", "values": ["female"], "dataType": "STRING", "dataTypeInt": 2}]
  if (attributes && attributes.length > 0) {
    query +=
      ' AND (' +
      attributes
        .map(() => `p.custom_attributes @> $${paramOffset++}::jsonb`)
        .join(' AND ') +
      ')';
    params.push(
      ...attributes
        .map((attribute) => {
          const [key, value] = attribute.split(':');
          const valueString = value
            .split('|')
            .map((v) => `"${v}"`)
            .join(', ');
          return `[{"name": "${key}", "values":[${valueString}]}]`;
        })
        .flat(),
    );
  }

  if (missingContent) {
    if (missingContent === 'description') {
      query += ' AND p.description_length=0';
    } else {
    }
  }

  if (minLowestQuality) {
    query += ` AND (SELECT ((l.last_results::jsonb->'score')::int) as score FROM listing l WHERE l.product_id = p.sku ORDER BY score LIMIT 1 ) >= $${paramOffset++}`;
    params.push(minLowestQuality);
  }
  if (maxLowestQuality) {
    query += ` AND (SELECT ((l.last_results::jsonb->'score')::int) as score FROM listing l WHERE l.product_id = p.sku ORDER BY score LIMIT 1 ) <= $${paramOffset++}`;
    params.push(maxLowestQuality);
  }

  if (filterLabels?.length > 0) {
    query += ' AND (';

    const subQuery = filterLabels.map((label) => {
      params.push(label.value);
      return `p.labels ? $${paramOffset++}`;
    });

    query += subQuery.join(matchType === 'all' ? ' AND ' : ' OR ') + ')';
  }

  return { query, params };
};
