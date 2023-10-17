-- CreateTable
CREATE TABLE "shopify_sessions" (
    "id" VARCHAR(255) NOT NULL,
    "shop" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "isOnline" BOOLEAN NOT NULL,
    "scope" VARCHAR(1024),
    "expires" INTEGER,
    "onlineAccessInfo" VARCHAR(255),
    "accessToken" VARCHAR(255),

    CONSTRAINT "shopify_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_sessions_migrations" (
    "migration_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "shopify_sessions_migrations_pkey" PRIMARY KEY ("migration_name")
);

-- CreateTable
CREATE TABLE "account" (
    "account_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "email" TEXT NOT NULL,
    "details" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "last_access" TIMESTAMP(6),
    "roles" JSONB DEFAULT '["manage product copy", "view pages"]',
    "old_account_id" TEXT,

    CONSTRAINT "account_pk" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "account_action" (
    "account_action_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "account_id" TEXT,
    "account_email" TEXT,
    "action_details" JSONB,
    "date_added" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "account_action_pk" PRIMARY KEY ("account_action_id")
);

-- CreateTable
CREATE TABLE "account_organization" (
    "account_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "roles" JSONB DEFAULT '["view pages", "manage product copy"]',
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "status" INTEGER,

    CONSTRAINT "account_organization_pk" PRIMARY KEY ("account_id","organization_id")
);

-- CreateTable
CREATE TABLE "account_token" (
    "token" TEXT NOT NULL,

    CONSTRAINT "account_token_pk" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "annotation_topic" (
    "annotation_topic_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "annotation_type_id" TEXT,
    "organization_id" TEXT,
    "topic" TEXT NOT NULL,
    "display_name" TEXT,
    "synonyms" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "approved" BOOLEAN,
    "prediction_count" INTEGER DEFAULT 0,
    "tags" JSONB,

    CONSTRAINT "annotation_topic_pk" PRIMARY KEY ("annotation_topic_id")
);

-- CreateTable
CREATE TABLE "annotation_type" (
    "annotation_type_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organization_ids" JSONB,
    "name" TEXT,
    "type" TEXT,
    "display_order" INTEGER,
    "content_type" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "color" TEXT,

    CONSTRAINT "annotation_type_pk" PRIMARY KEY ("annotation_type_id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "api_key" TEXT NOT NULL,
    "organization_id" TEXT,

    CONSTRAINT "api_key_pk" PRIMARY KEY ("api_key")
);

-- CreateTable
CREATE TABLE "category" (
    "organization_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT,
    "category_url" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "category_hierarchy" JSONB,
    "parent_category_id" TEXT,
    "top_level_category_id" TEXT,
    "translations" JSONB,

    CONSTRAINT "category_pk" PRIMARY KEY ("organization_id","external_id")
);

-- CreateTable
CREATE TABLE "category_concept" (
    "organization_id" TEXT NOT NULL,
    "category_reference_id" VARCHAR(200),
    "concept_id" INTEGER NOT NULL,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now())
);

-- CreateTable
CREATE TABLE "completion_cache" (
    "prompt" TEXT NOT NULL,
    "completion" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "completion_cache_pk" PRIMARY KEY ("prompt")
);

-- CreateTable
CREATE TABLE "component" (
    "component_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT,
    "name" TEXT,
    "settings" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_modified" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "deleted" BOOLEAN DEFAULT false,
    "display_order" INTEGER,
    "display_group" TEXT,
    "description" TEXT,
    "allow_workflow" BOOLEAN DEFAULT false,

    CONSTRAINT "component_pk" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "composition" (
    "composition_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content_template_id" TEXT,
    "title" TEXT,
    "content" JSONB,
    "status" INTEGER,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_modified" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_published" TIMESTAMP(6),

    CONSTRAINT "composition_pk" PRIMARY KEY ("composition_id")
);

-- CreateTable
CREATE TABLE "concept" (
    "concept_id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "suppress" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "custom_positive" TEXT,
    "custom_neutral" TEXT,
    "custom_negative" TEXT,
    "lemma" TEXT,

    CONSTRAINT "concepts_pk" PRIMARY KEY ("concept_id")
);

-- CreateTable
CREATE TABLE "concept_expression" (
    "concept_expression_id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "expression" VARCHAR(100),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "lemma" TEXT,

    CONSTRAINT "conceptexpressions_pk" PRIMARY KEY ("concept_expression_id")
);

-- CreateTable
CREATE TABLE "concept_expression_orig" (
    "concept_expression_id" INTEGER NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "expression" VARCHAR(100),
    "date_added" TIMESTAMP(6),
    "lemma" TEXT
);

-- CreateTable
CREATE TABLE "concept_orig" (
    "concept_id" INTEGER NOT NULL,
    "name" VARCHAR(100),
    "suppress" BOOLEAN,
    "notes" TEXT,
    "date_added" TIMESTAMP(6),
    "custom_positive" TEXT,
    "custom_neutral" TEXT,
    "custom_negative" TEXT,
    "lemma" TEXT
);

-- CreateTable
CREATE TABLE "concept_relationship" (
    "from_concept_id" INTEGER NOT NULL,
    "to_concept_id" INTEGER NOT NULL,
    "relationship_type" VARCHAR(50),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now())
);

-- CreateTable
CREATE TABLE "concept_relationship_orig" (
    "from_concept_id" INTEGER NOT NULL,
    "to_concept_id" INTEGER NOT NULL,
    "relationship_type" VARCHAR(50),
    "date_added" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "content_label" (
    "label" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "date_added" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "content_label_pk" PRIMARY KEY ("label","organization_id")
);

-- CreateTable
CREATE TABLE "content_label_alert" (
    "alert_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "labels" JSONB,
    "date_triggered" TIMESTAMP(0),
    "date_notified" TIMESTAMP(0),
    "item_id" TEXT,
    "item_type" TEXT,

    CONSTRAINT "content_label_alert_pk" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "content_label_subscription" (
    "subscription_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "labels" JSONB,
    "frequency" TEXT,
    "date_added" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "last_notified" TIMESTAMP(0),

    CONSTRAINT "content_label_subscription_pk" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "content_template" (
    "content_template_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT,
    "settings" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_modified" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "deleted" BOOLEAN DEFAULT false,
    "content" JSONB,
    "display_order" INTEGER,

    CONSTRAINT "content_template_pk" PRIMARY KEY ("content_template_id")
);

-- CreateTable
CREATE TABLE "content_workflow" (
    "content_workflow_id" TEXT NOT NULL,
    "name" TEXT,
    "search_params" JSONB,
    "content_types" JSONB,
    "assigned_to" JSONB,
    "created_by" TEXT,
    "date_added" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "date_modified" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "organization_id" TEXT,
    "workflow_type" TEXT,
    "status" INTEGER,
    "settings" JSONB,

    CONSTRAINT "content_workflow_pk" PRIMARY KEY ("content_workflow_id")
);

-- CreateTable
CREATE TABLE "content_workflow_item" (
    "content_workflow_item_id" TEXT NOT NULL,
    "content_workflow_id" TEXT,
    "organization_id" TEXT,
    "input_content" JSONB,
    "output_content" TEXT,
    "date_completed" TIMESTAMP(6),
    "completed_by" TEXT,
    "item_type" TEXT,
    "item_id" TEXT,
    "workflow_action" TEXT,
    "item_order" INTEGER,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "content_workflow_item_pk" PRIMARY KEY ("content_workflow_item_id")
);

-- CreateTable
CREATE TABLE "content_workflow_product" (
    "content_workflow_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "content" JSONB,
    "date_completed" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "completed_by" TEXT,

    CONSTRAINT "content_workflow_product_pk" PRIMARY KEY ("content_workflow_id","product_id")
);

-- CreateTable
CREATE TABLE "custom_attribute" (
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" JSONB,
    "date_added" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "data_type" INTEGER,
    "original_lookup" JSONB,

    CONSTRAINT "custom_attribute_pk" PRIMARY KEY ("organization_id","name")
);

-- CreateTable
CREATE TABLE "external_link" (
    "external_link_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT,
    "url" TEXT,
    "title" TEXT,
    "title_vector" JSONB,
    "last_retrieved" TIMESTAMP(6),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "external_link_source_id" TEXT,
    "priority" BOOLEAN,
    "extracted_values" JSONB,
    "friendly_title" TEXT,
    "fetch_failed" BOOLEAN,

    CONSTRAINT "external_link_pk" PRIMARY KEY ("external_link_id")
);

-- CreateTable
CREATE TABLE "external_link_source" (
    "external_link_source_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT,
    "url" TEXT,
    "match_expression" TEXT,
    "last_retrieved" TIMESTAMP(6),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "link_type" TEXT,
    "title_expression" TEXT,
    "value_expressions" JSONB,
    "settings" JSONB,

    CONSTRAINT "external_link_source_pk" PRIMARY KEY ("external_link_source_id")
);

-- CreateTable
CREATE TABLE "facet" (
    "facet_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT,
    "display_name" TEXT,
    "facet_type" TEXT,
    "value_source" TEXT,
    "facet_settings" JSONB,
    "display_order" INTEGER,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "display_group" TEXT,
    "excluded_values" JSONB,
    "active" BOOLEAN DEFAULT false,
    "display_threshold" DECIMAL,
    "filter_group" TEXT,
    "filter_group_order" INTEGER,

    CONSTRAINT "facet_pk" PRIMARY KEY ("facet_id")
);

-- CreateTable
CREATE TABLE "family_group" (
    "family_ids" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "review_count" INTEGER,
    "analyzed_review_count" INTEGER,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_modified" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "family_group_pk" PRIMARY KEY ("family_ids","organization_id")
);

-- CreateTable
CREATE TABLE "feature" (
    "feature_id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "organization_id" TEXT,
    "feature" VARCHAR(150),
    "is_active" BOOLEAN,
    "awaiting_approval" BOOLEAN,
    "ignore" BOOLEAN,
    "customized" BOOLEAN,
    "is_adjective" BOOLEAN,
    "sentiment" INTEGER,
    "no_match_expressions" VARCHAR(250),
    "total_instances" INTEGER,
    "transferred_to" INTEGER,
    "sample_opinions" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "translations" JSONB
);

-- CreateTable
CREATE TABLE "feature_expression" (
    "feature_expression_id" SERIAL NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "expression" VARCHAR(150),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "feature_expression_pk" PRIMARY KEY ("feature_expression_id")
);

-- CreateTable
CREATE TABLE "feature_filter" (
    "expression" VARCHAR(50)
);

-- CreateTable
CREATE TABLE "feature_tag" (
    "feature_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "date_added" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "grammar_sample" (
    "sample_id" TEXT NOT NULL,
    "original_text" TEXT,
    "edited_text" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_edited" TIMESTAMP(6),
    "listing_id" TEXT,

    CONSTRAINT "grammar_sample_pk" PRIMARY KEY ("sample_id")
);

-- CreateTable
CREATE TABLE "keyword" (
    "keyword" TEXT NOT NULL,
    "metadata" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "monthly_volume" INTEGER,
    "seed_keyword" TEXT,
    "valid" BOOLEAN,
    "parsed_query" JSONB,
    "lemma" TEXT,
    "source" TEXT,
    "added_by" TEXT,
    "keyword_hash" TEXT,
    "is_primary" BOOLEAN,
    "primary_keyword" TEXT,
    "variants" JSONB,
    "geo_volumes" JSONB,
    "locations" JSONB,

    CONSTRAINT "keyword_pk" PRIMARY KEY ("keyword")
);

-- CreateTable
CREATE TABLE "keyword_seed" (
    "keyword" TEXT NOT NULL,
    "date_checked" TIMESTAMP(6),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "organization_ids" JSONB DEFAULT '[]',
    "suppress" BOOLEAN DEFAULT false,
    "extracted" BOOLEAN DEFAULT false,
    "exact_match" BOOLEAN DEFAULT false,

    CONSTRAINT "keyword_seed_pk" PRIMARY KEY ("keyword")
);

-- CreateTable
CREATE TABLE "keyword_suggestion" (
    "keyword" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "original_search_results" JSONB,
    "current_search_results" JSONB,
    "original_quality_metrics" JSONB,
    "current_quality_metrics" JSONB,
    "quality_score" INTEGER,
    "source" TEXT,
    "status" INTEGER,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "last_checked" TIMESTAMP(6),
    "monthly_volume" INTEGER,
    "date_modified" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "added_by" TEXT,
    "labels" JSONB,
    "variants" JSONB,
    "serp_domains" JSONB,
    "last_serp_check" TIMESTAMP(6),
    "raw_serps" JSONB,
    "result_key" TEXT,
    "relevance_score" INTEGER,

    CONSTRAINT "organization_keywords_pk" PRIMARY KEY ("keyword","organization_id")
);

-- CreateTable
CREATE TABLE "listing" (
    "listing_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT,
    "product_id" TEXT,
    "url" TEXT,
    "source_id" TEXT,
    "last_checked" TIMESTAMP(6),
    "last_results" JSONB,
    "previously_checked" TIMESTAMP(6),
    "previous_results" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "external_id" TEXT,
    "current_listing_data" JSONB,
    "is_active" BOOLEAN DEFAULT true,
    "parameters" JSONB,
    "last_success" TIMESTAMP(6),
    "failure_count" INTEGER DEFAULT 0,
    "last_error" TEXT,
    "marketplace_id" TEXT,

    CONSTRAINT "listing_pk" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listing_analysis" (
    "listing_analysis_id" TEXT NOT NULL,
    "url" TEXT,
    "progress" JSONB,
    "listing_data" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "analysis" JSONB,
    "score" INTEGER,
    "organization_id" TEXT,
    "listing_id" TEXT,

    CONSTRAINT "listing_analysis_pk" PRIMARY KEY ("listing_analysis_id")
);

-- CreateTable
CREATE TABLE "listing_rule" (
    "listing_rule_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT,
    "rule_type" TEXT,
    "module_name" TEXT,
    "warning_threshold" DECIMAL,
    "error_threshold" DECIMAL,
    "warning_penalty" DECIMAL,
    "error_penalty" DECIMAL,
    "organization_settings" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "sources" JSONB,

    CONSTRAINT "listing_rule_pk" PRIMARY KEY ("listing_rule_id")
);

-- CreateTable
CREATE TABLE "location_page" (
    "organization_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_content" JSONB,
    "date_added" TIMESTAMP(6),
    "last_updated" TIMESTAMP(6),
    "last_had_data" TIMESTAMP(6),
    "status" INTEGER,
    "search_results" JSONB,

    CONSTRAINT "location_page_pk" PRIMARY KEY ("organization_id","location_id","page_id")
);

-- CreateTable
CREATE TABLE "marketplace" (
    "marketplace_id" TEXT NOT NULL,
    "name" TEXT,
    "site_url" TEXT,
    "crawl_settings" JSONB,
    "last_listing_fetch" TIMESTAMP(6),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "fetcher" TEXT,

    CONSTRAINT "marketplace_pk" PRIMARY KEY ("marketplace_id")
);

-- CreateTable
CREATE TABLE "organization" (
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "directory" VARCHAR(50),
    "last_import" TIMESTAMP(6),
    "staging_search" VARCHAR(50),
    "live_search" VARCHAR(50),
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "active" BOOLEAN,
    "settings" JSONB,
    "legacy_id" TEXT,
    "allowed_domain" TEXT,
    "identity_provider" VARCHAR(50),
    "marketplace_ids" JSONB,
    "config" JSONB DEFAULT '{}',
    "public_id" TEXT,

    CONSTRAINT "organization_pk" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "organization_geo" (
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_updated" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "location_id" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,

    CONSTRAINT "organization_geo_pk" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "page" (
    "page_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT,
    "header_content" TEXT,
    "footer_content" TEXT,
    "results" JSONB,
    "status" INTEGER,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "keyword" TEXT,
    "search_params" JSONB,
    "date_modified" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "last_updated" TIMESTAMP(6),
    "date_published" TIMESTAMP(6),
    "monthly_volume" INTEGER,
    "slug" TEXT NOT NULL,
    "quality_score" INTEGER,
    "quality_metrics" JSONB,
    "content_settings" JSONB,
    "content" JSONB,
    "author_id" TEXT,
    "content_template_id" TEXT,
    "query" JSONB,
    "date_unpublished" TIMESTAMP(0),
    "redirect_url" TEXT,
    "related_pages" JSONB,
    "page_data" JSONB,
    "last_editor_id" TEXT,
    "content_flags" JSONB,
    "labels" JSONB,
    "translations" JSONB,
    "original_content" JSONB,
    "original_content_settings" JSONB,
    "page_data_v2" JSONB,
    "page_data_bak" JSONB,
    "content_bak" JSONB,
    "result_signature" JSONB,
    "last_signature_update" TIMESTAMP(6),
    "label_context" JSONB,
    "weekly_metrics" JSONB,
    "page_settings" JSONB,
    "total_impressions" INTEGER,
    "title_vector" JSONB,
    "schema" TEXT,
    "locations" JSONB,
    "page_paths" JSONB,
    "last_serp_check" TIMESTAMP(6),
    "serp_summary" JSONB,
    "result_key" TEXT,

    CONSTRAINT "page_pk" PRIMARY KEY ("page_id")
);

-- CreateTable
CREATE TABLE "page_metrics" (
    "page_id" TEXT,
    "date" VARCHAR(10) NOT NULL,
    "clicks" INTEGER,
    "impressions" INTEGER,
    "ctr" DECIMAL,
    "position" DECIMAL,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "week_num" INTEGER,
    "queries" JSONB DEFAULT '[]',
    "slug" TEXT,
    "organization_id" TEXT
);

-- CreateTable
CREATE TABLE "product" (
    "sku" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT,
    "image_url" TEXT,
    "description" TEXT,
    "details" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "url" TEXT,
    "category_id" TEXT,
    "content" JSONB,
    "family_ids" JSONB,
    "review_analysis" JSONB,
    "date_analyzed" TIMESTAMP(6),
    "model" TEXT,
    "page_content" JSONB,
    "content_vector" JSONB,
    "base_name" TEXT,
    "keywords" TEXT,
    "is_active" BOOLEAN,
    "embeddings_date" TIMESTAMP(0),
    "custom_attributes" JSONB,
    "features" JSONB,
    "last_imported" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "description_length" int4 null GENERATED ALWAYS AS (length(btrim(COALESCE(description, ''::text)))) STORED,
    "listing_scores" JSONB,
    "original_image_url" TEXT,
    "product_type" TEXT,
    "product_type_date" TIMESTAMP(6),
    "translations" JSONB,
    "extracted_queries" JSONB,
    "model_keywords" JSONB,

    CONSTRAINT "product_pk" PRIMARY KEY ("sku","organization_id")
);

-- CreateTable
CREATE TABLE "product_family_related_page" (
    "family_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "related_pages" JSONB,
    "date_updated" TIMESTAMP(6),

    CONSTRAINT "product_family_related_pages_pk" PRIMARY KEY ("family_id","organization_id")
);

-- CreateTable
CREATE TABLE "product_related_page" (
    "sku" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "related_pages" JSONB,
    "date_updated" TIMESTAMP(6),

    CONSTRAINT "product_related_page_pk" PRIMARY KEY ("sku","organization_id")
);

-- CreateTable
CREATE TABLE "query_embedding" (
    "query" TEXT NOT NULL,
    "embeddings" JSONB,

    CONSTRAINT "query_embedding_pk" PRIMARY KEY ("query")
);

-- CreateTable
CREATE TABLE "review" (
    "review_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "review_data" JSONB,
    "review_analysis" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "date_analyzed" TIMESTAMP(6),
    "annotations" JSONB,
    "date_annotated" TIMESTAMP(6),
    "annotated_by" TEXT,

    CONSTRAINT "review_pk" PRIMARY KEY ("review_id","organization_id")
);

-- CreateTable
CREATE TABLE "rule_expression" (
    "rule_expression_id" INTEGER NOT NULL,
    "expression" VARCHAR(50),
    "type" VARCHAR(50),
    "is_regex" BOOLEAN,
    "date_added" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "search_filter" (
    "filter_pattern" TEXT NOT NULL,
    "filter_field" TEXT,
    "comparison" INTEGER,
    "value_hint" TEXT,
    "name" TEXT,
    "data_type" INTEGER,
    "attribute_name" TEXT
);

-- CreateTable
CREATE TABLE "synonym" (
    "synonym" VARCHAR(50),
    "synonym_of" VARCHAR(50)
);

-- CreateTable
CREATE TABLE "tag" (
    "tag_id" INTEGER NOT NULL,
    "tag" VARCHAR(50),
    "date_added" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "translation" (
    "client" VARCHAR(120),
    "language" VARCHAR(5),
    "status" VARCHAR(20),
    "process_ts" TIMESTAMP(6),
    "sentiment_last_run" TIMESTAMPTZ(6)
);

-- CreateTable
CREATE TABLE "unmapped_category" (
    "organization_id" INTEGER NOT NULL,
    "name" VARCHAR(50),
    "pending_categories" INTEGER,
    "date_added" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "usage" (
    "usage_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content_type" TEXT,
    "context" TEXT,
    "sku" TEXT,
    "settings" JSONB,
    "output" JSONB,
    "words" INTEGER,
    "date_added" TIMESTAMP(0) DEFAULT timezone('utc'::text, now()),
    "completion_text" TEXT,

    CONSTRAINT "usage_pk" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "page_serp" (
    "page_serp_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "page_id" TEXT,
    "serp_data" JSONB,
    "date_added" TIMESTAMP(6) DEFAULT timezone('utc'::text, now()),
    "organization_id" TEXT,
    "fetch_date" TEXT,

    CONSTRAINT "page_serp_pk" PRIMARY KEY ("page_serp_id")
);

-- CreateIndex
CREATE INDEX "account_action_organization_id_idx" ON "account_action"("organization_id");

-- CreateIndex
CREATE INDEX "account_organization_account_id_idx" ON "account_organization"("account_id");

-- CreateIndex
CREATE INDEX "account_organization_organization_id_idx" ON "account_organization"("organization_id");

-- CreateIndex
CREATE INDEX "annotation_topic_organization_id_annotation_type_id_idx" ON "annotation_topic"("organization_id", "annotation_type_id");

-- CreateIndex
CREATE INDEX "annotation_topic_organization_id_idx" ON "annotation_topic"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "annotation_topic_annotation_type_id_organization_id_topic_idx" ON "annotation_topic"("annotation_type_id", "organization_id", "topic");

-- CreateIndex
CREATE INDEX "category_organization_id_idx" ON "category"("organization_id");

-- CreateIndex
CREATE INDEX "concepts_lemma_idx" ON "concept"("lemma");

-- CreateIndex
CREATE INDEX "conceptexpressions_conceptid_idx" ON "concept_expression"("concept_id");

-- CreateIndex
CREATE INDEX "conceptexpressions_lemma_idx" ON "concept_expression"("lemma");

-- CreateIndex
CREATE INDEX "content_label_alert_account_id_idx" ON "content_label_alert"("account_id");

-- CreateIndex
CREATE INDEX "content_label_alert_subscription_id_idx" ON "content_label_alert"("subscription_id");

-- CreateIndex
CREATE INDEX "content_label_subscription_account_id_idx" ON "content_label_subscription"("account_id");

-- CreateIndex
CREATE INDEX "content_template_content_template_id_name_idx" ON "content_template"("content_template_id", "name");

-- CreateIndex
CREATE INDEX "content_workflow_item_content_workflow_id_completed_by_idx" ON "content_workflow_item"("content_workflow_id", "completed_by");

-- CreateIndex
CREATE INDEX "content_workflow_item_content_workflow_id_idx" ON "content_workflow_item"("content_workflow_id");

-- CreateIndex
CREATE INDEX "external_link_organization_id_idx" ON "external_link"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_link_external_link_source_id_url_idx" ON "external_link"("external_link_source_id", "url");

-- CreateIndex
CREATE INDEX "facet_organization_id_idx" ON "facet"("organization_id");

-- CreateIndex
CREATE INDEX "feature_awaiting_approval_is_active_ignore_idx" ON "feature"("awaiting_approval", "is_active", "ignore");

-- CreateIndex
CREATE UNIQUE INDEX "feature_expression_feature_id_idx" ON "feature_expression"("feature_id", "expression");

-- CreateIndex
CREATE UNIQUE INDEX "grammar_sample_original_text_idx" ON "grammar_sample"("original_text");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_un" ON "keyword"("lemma");

-- CreateIndex
CREATE INDEX "keyword_keyword_hash_idx" ON "keyword"("keyword_hash");

-- CreateIndex
CREATE INDEX "keyword_keyword_hash_is_primary_idx" ON "keyword"("keyword_hash", "is_primary");

-- CreateIndex
CREATE INDEX "keyword_keyword_locations_idx" ON "keyword"("keyword", "locations");

-- CreateIndex
CREATE INDEX "keyword_suggestion_organization_id_result_key_idx" ON "keyword_suggestion"("organization_id", "result_key");

-- CreateIndex
CREATE INDEX "organization_keywords_keyword_idx" ON "keyword_suggestion"("keyword");

-- CreateIndex
CREATE INDEX "organization_keywords_organization_id_idx" ON "keyword_suggestion"("organization_id", "status");

-- CreateIndex
CREATE INDEX "listing_marketplace_id_idx" ON "listing"("marketplace_id");

-- CreateIndex
CREATE INDEX "listing_organization_id_idx" ON "listing"("organization_id");

-- CreateIndex
CREATE INDEX "listing_organization_id_is_active_last_checked_idx" ON "listing"("organization_id", "is_active", "last_checked");

-- CreateIndex
CREATE INDEX "listing_organization_id_product_id_idx" ON "listing"("organization_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_url_idx" ON "listing"("url", "marketplace_id");

-- CreateIndex
CREATE INDEX "location_page_organization_id_idx" ON "location_page"("organization_id");

-- CreateIndex
CREATE INDEX "page_content_template_id_organization_id_idx" ON "page"("content_template_id", "organization_id");

-- CreateIndex
CREATE INDEX "page_date_published_idx" ON "page"("date_published");

-- CreateIndex
CREATE INDEX "page_organization_id_result_key_idx" ON "page"("organization_id", "result_key");

-- CreateIndex
CREATE INDEX "page_organization_id_status_idx" ON "page"("organization_id", "status");

-- CreateIndex
CREATE INDEX "page_content_template_id_idx" ON "page"("content_template_id");

-- CreateIndex
CREATE INDEX "page_content_template_id_org_id_status_idx" ON "page"("content_template_id", "organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "page_organization_id_idx" ON "page"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "page_metrics_organization_id_idx" ON "page_metrics"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "page_metrics_page_id_idx" ON "page_metrics"("page_id");

-- CreateIndex
CREATE INDEX "product_organization_id_category_id_idx" ON "product"("organization_id", "category_id");

-- CreateIndex
CREATE INDEX "product_organization_id_description_length_idx" ON "product"("organization_id", "description_length");

-- CreateIndex
CREATE INDEX "product_organization_id_idx" ON "product"("organization_id");

-- CreateIndex
CREATE INDEX "product_organization_id_is_active_idx" ON "product"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "product_organization_id_name_idx" ON "product"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_organization_id_is_active_sku_idx" ON "product"("organization_id", "is_active", "sku");

-- CreateIndex
CREATE INDEX "product_family_related_page_organization_id_idx" ON "product_family_related_page"("organization_id");

-- CreateIndex
CREATE INDEX "product_related_page_organization_id_idx" ON "product_related_page"("organization_id");

-- CreateIndex
CREATE INDEX "page_serp_organization_id_idx" ON "page_serp"("organization_id");

-- CreateIndex
CREATE INDEX "page_serp_page_id_idx" ON "page_serp"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_serp_page_id_fetch_date_idx" ON "page_serp"("page_id", "fetch_date");
