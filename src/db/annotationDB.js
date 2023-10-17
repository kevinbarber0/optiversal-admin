const db = require('.');
class AnnotationDB {
  static async getAnnotationTypes(orgId) {
    const values = [orgId];
    const { rows } = await db.query(
      'SELECT annotation_type_id as "annotationTypeId", organization_ids as "orgIds", name, type, content_type as "contentType", color FROM annotation_type WHERE organization_ids::jsonb ? $1 OR organization_ids is NULL ORDER BY display_order',
      values,
    );
    return rows;
  }

  static async ensureAnnotationTopic(
    topicId,
    typeId,
    orgId,
    topic,
    displayName,
  ) {
    const values = [topicId, typeId, orgId, topic, displayName];
    await db.query(
      'INSERT INTO annotation_topic (annotation_topic_id, annotation_type_id, organization_id, topic, display_name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      values,
    );
  }
}

module.exports = AnnotationDB;
