-- Account Organization Migration
INSERT INTO
  account_organization(account_id, organization_id, roles, date_added)
VALUES
SELECT
  account_id,
  organization_id,
  roles,
  NOW()
FROM
  account
WHERE
  organization_id IS NOT NULL;

-- ALTER TABLE account_organization DROP COLUMN organization_id;
-- ALTER TABLE account_organization DROP COLUMN roles;

-- Create Dummy Metrics data to DEV
INSERT INTO
  page_metrics (
    page_id,
    date,
    clicks,
    impressions,
    ctr,
    "position",
    date_added,
    week_num
  )
SELECT
  p.page_id AS page_id,
  date,
  FLOOR(RANDOM() * (m.max_clicks - m.min_clicks) * 1.5) + FLOOR(m.min_clicks / 2) AS clicks,
  FLOOR(
    RANDOM() * (m.max_impressions - m.min_impressions) * 1.5
  ) + FLOOR(m.min_impressions / 2) AS impressions,
  RANDOM() * (m.max_ctr - m.min_ctr) * 1.5 + m.min_ctr / 2 AS ctr,
  RANDOM() * (m.max_position - m.min_position) * 1.5 + m.min_position / 2 AS position,
  NOW() AS date_added,
  week_num
FROM
  page_metrics pm,
  (
    SELECT
      MAX(clicks) AS max_clicks,
      MIN(clicks) AS min_clicks,
      MAX(impressions) AS max_impressions,
      MIN(impressions) AS min_impressions,
      MAX(ctr) AS max_ctr,
      MIN(ctr) AS min_ctr,
      MAX(position) AS max_position,
      MIN(position) AS min_position
    FROM
      page_metrics pm
    WHERE
      pm.page_id = '4a509172-4625-49a0-a501-a70d3253c47d'
  ) m,
  page p
WHERE
  p.page_id != '4a509172-4625-49a0-a501-a70d3253c47d'
  AND p.organization_id = '9b5711e85';

UPDATE
  page p
SET
  weekly_metrics = (
    SELECT
      JSONB_AGG(r)
    FROM
      (
        SELECT
          pm.week_num AS weekNum,
          SUM(pm.clicks) AS clicks,
          SUM(pm.impressions) AS impressions,
          ROUND(AVG(pm.ctr), 2) AS ctr,
          ROUND(AVG(pm."position"), 2) AS position,
          MAX(date) AS end,
          MIN(date) as start
    FROM
      page_metrics pm
    WHERE
      pm.page_id = p.page_id
    GROUP BY
      pm.week_num
    ORDER BY
      pm.week_num ASC
  ) r
)
WHERE
  p.page_id != '4a509172-4625-49a0-a501-a70d3253c47d'
  AND p.organization_id = '9b5711e85';