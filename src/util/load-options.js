import {
  getLabels,
  getProductLabels,
  getContentTemplates,
  getSkus,
  getAnnotationTopics,
  getIdeaWorkflowsByUser,
  getPageWorkflowsByUser,
} from './api';

export const loadLabelsOptions = (inputValue) =>
  getLabels(inputValue).then((res) => {
    return res.labels.map((l) => {
      return { value: l, label: l };
    });
  });

export const loadProductLabelsOptions = (inputValue) =>
  getProductLabels(inputValue).then((res) => {
    return res.labels.map((l) => {
      return { value: l, label: l };
    });
  });

export const loadContentTemplateOptions = (inputValue) =>
  getContentTemplates(inputValue).then((res) => {
    return res.contentTemplates.map((ct) => {
      return { value: ct.contentTemplateId, label: ct.name };
    });
  });

export const loadSkusOptions = (inputValue) =>
  getSkus(inputValue).then((res) =>
    res.products.map((p) => {
      return { value: p.sku, label: p.sku };
    }),
  );

export const loadAnnotationTopicOptions = (inputValue, at) =>
  getAnnotationTopics(inputValue, at).then((res) => {
    return res.topics.map((t) => {
      return { value: t.annotationTopicId, label: t.topic || t.displayName };
    });
  });

export const loadIdeaWorkflowOptions = (inputValue) =>
  getIdeaWorkflowsByUser(inputValue).then((res) =>
    res.workflows.map((w) => ({ value: w.workflowId, label: w.name })),
  );

export const loadPageWorkflowOptions = (inputValue) =>
  getPageWorkflowsByUser(inputValue).then((res) =>
    res.workflows.map((w) => ({ value: w.workflowId, label: w.name })),
  );
