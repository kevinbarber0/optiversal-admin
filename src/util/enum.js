module.exports = {
  Role: {
    USER: 0,
    ADMIN: 4,
  },
  Status: {
    DISABLED: 0,
    ENABLED: 1,
  },
  PageStatus: {
    DRAFT: 0,
    PUBLISHED: 1,
    QUALITYISSUE: 2,
    DELETED: 3,
    UNPUBLISHED: 4,
  },
  PageStatusStrings: {
    0: 'Draft',
    1: 'Published',
    2: 'Quality Issue',
    3: 'Deleted',
    4: 'Unpublished',
  },
  SuggestionStatus: {
    SUGGESTED: 0,
    MANUAL: 1,
    PUBLISHED: 2,
    DELETED: 3,
    SAVED: 4,
    RECHECK: 7,
  },
  AccessLevel: {
    NONE: 0,
    READ: 1,
    EDIT: 2,
    OWN: 3,
    ADMIN: 4,
  },
  WorkflowStatus: {
    NONE: 0,
    DELETED: 1,
  },
  WorkflowItemAction: {
    APPROVE: 'approve',
    REJECT: 'reject',
  },
  WorkflowAutomationStatus: {
    IDLE: 'idle',
    RUNNING: 'running',
  },
  UserRole: {
    ManageProductCopy: 'manage product copy',
    ViewPages: 'view pages',
    EditPages: 'edit pages',
    PublishPages: 'publish pages',
    ManageSettings: 'manage settings',
    ManageUsers: 'manage users',
  },
  Frequency: {
    Immediate: 'immediate',
    Daily: 'daily',
    Weekly: 'weekly',
  },
  ListingAnalysisProcess: {
    URLValidation: 'Validating URL',
    RetrieveProductData: 'Retrieving Product Data',
    AnalyzeProductData: 'Analyzing Product Data',
    RetrieveProductReviews: 'Retrieving Product Reviews',
    AnalyzeProductReviews: 'Analyzing Product Reviews',
    RetrieveProductQAs: 'Retrieving Product Q&A',
    AnalyzeProductQAs: 'Analyzing Product Q&A',
    // CreateReport: 'Create Report',
  },
  ListingAnalysisProcessStatus: {
    NotStarted: 'Not Yet Started',
    InProgress: 'In Progress',
    Finished: 'Finished',
  },
  ListingAnalysisResult: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  UserAction: {
    UpdateUser: 'Update User Settings',
    CreatePage: 'Create New Page',
    UpdatePageContent: 'Update Page Content',
    AddPageLabel: 'Add Page Label',
    UpdatePageStatus: 'Update Page Status',
    CreateProductCopy: 'Create Product Copy',
    UpdateProductCopy: 'Update Product Copy',
    SetProducLabel: 'Set Product Label',
    TranslateProductCopy: 'Translate Product Copy',
    UpdateIdeaStatus: 'Update Idea Status',
    UpdateIdeaTag: 'Update Idea Tag',
    UpdateReviewAnnotations: 'Update Review Annotations',
    ChangeSettings: 'Change Settings',
  },
  WorkflowType: {
    Product: 'product',
    File: 'file',
    Idea: 'ideas',
    Page: 'pages',
  },
  Languages: {
    en: 'EN',
    fr: 'FR',
    es: 'ES',
    de: 'DE',
  },
  Placeholder: {
    Title: 'title',
    Location: 'location',
    City: 'city',
    State: 'state',
  },
  PresentationMode: {
    Default: 'default',
    Languages: 'language',
    Location: 'Location',
  },
  ReviewSource: {
    Title: 'reviewTitle',
    Text: 'reviewText',
  },
  FindPagesBy: {
    ResultKey: 'by_resultKey',
    Title: 'by_title',
  },
};
