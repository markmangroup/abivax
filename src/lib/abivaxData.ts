import { readFileSync } from "fs";
import path from "path";
import { z } from "zod";

// --- Schemas ---

const SpineStateSchema = z.object({
  identity: z.string(),
  campaign: z.string(),
  quarterLeverage: z.array(z.string()),
  personalRisks: z.array(z.string()),
  oneLineStandard: z.string(),
});

// --- Entity System (Unified Knowledge Base) ---

export const EntityTypeEnum = z.enum([
  "person",
  "system",
  "meeting",
  "decision",
  "concept",
  "milestone",
  "organization",
]);

export type EntityType = z.infer<typeof EntityTypeEnum>;

const EntityMentionSchema = z.object({
  noteId: z.string(),
  date: z.string(),
  context: z.string().optional(),
});

const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EntityTypeEnum,
  aliases: z.array(z.string()).default([]),
  description: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).default({}),
  links: z.array(z.string()).default([]),
  notes: z.string().optional(),
  mentions: z.array(EntityMentionSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const EntitiesDataSchema = z.object({
  entities: z.array(EntitySchema),
});

export type EntityMention = z.infer<typeof EntityMentionSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type EntitiesData = z.infer<typeof EntitiesDataSchema>;

const NoteSummarySchema = z.object({
  truthsNow: z.array(z.string()).optional().default([]),
  decisions: z.array(z.string()).optional().default([]),
  risks: z.array(z.string()).optional().default([]),
  openQuestions: z.array(z.string()).optional().default([]),
  nextConstraints: z.array(z.string()).optional().default([]),
  entityMentions: z.array(z.string()).optional().default([]),
  entityUpdateQueue: z.array(z.string()).optional().default([]),
});

const NoteSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  title: z.string().optional(),
  rawText: z.string(),
  summary: NoteSummarySchema.optional().default({
    truthsNow: [],
    decisions: [],
    risks: [],
    openQuestions: [],
    nextConstraints: [],
    entityMentions: [],
    entityUpdateQueue: [],
  }),
});

const NotesDataSchema = z.object({
  notes: z.array(NoteSchema),
});

const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  entity: z.string(),
  needThem: z.string(),
  notes: z.string(),
});

const PeopleDataSchema = z.object({
  people: z.array(PersonSchema),
});

const MilestoneSchema = z.object({
  id: z.string(),
  date: z.string().nullable(),
  label: z.string(),
  scope: z.string(),
  status: z.string(),
  notes: z.string(),
});

const TimelineDataSchema = z.object({
  milestones: z.array(MilestoneSchema),
});

const BudgetDataSchema = z.object({
  sapOffer: z.object({
    total5yr: z.number(),
    currency: z.string(),
    aacv: z.number(),
    validUntil: z.string(),
    terms: z.array(z.string()),
    modules: z.array(z.string()),
  }),
  keyNumbers: z.array(
    z.object({ label: z.string(), value: z.string() })
  ),
});

const MeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  organizer: z.string(),
  attendees: z.string(),
  purpose: z.string(),
  prep: z.array(z.string()),
  link: z.string().optional(),
});

const MeetingsDataSchema = z.object({
  meetings: z.array(MeetingSchema),
});

const EntityProfileSchema = z.object({
  entityId: z.string(),
  generatedAt: z.string(),
  focusHints: z.array(z.string()).default([]),
  noteIds: z.array(z.string()).default([]),
  signalsNow: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  openLoops: z.array(z.string()).default([]),
  lastTouchedAt: z.string().nullable().default(null),
});

const EntityProfilesDataSchema = z.object({
  profiles: z.array(EntityProfileSchema),
});

const CompanyIntelItemSchema = z.object({
  id: z.string(),
  summary: z.string(),
  confidence: z.string(),
  sourceStatus: z.string(),
  date: z.string().nullable().optional().default(null),
  evidenceLine: z.string().optional().default(""),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      })
    )
    .optional()
    .default([]),
  implication: z.string().optional().default(""),
  verificationAction: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).default([]),
});

const CompanyIntelSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(CompanyIntelItemSchema).default([]),
});

const CompanyIntelSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  owner: z.string(),
  nextStep: z.string(),
});

const CompanyIntelDataSchema = z.object({
  asOf: z.string(),
  sections: z.array(CompanyIntelSectionSchema).default([]),
  sourceBacklog: z.array(CompanyIntelSourceSchema).default([]),
  erpTriggers: z
    .array(
      z.object({
        triggerEvent: z.string(),
        whyItMattersToERP: z.string(),
        owner: z.string(),
        dueWindow: z.string(),
      })
    )
    .optional()
    .default([]),
  leadershipQuestions: z.array(z.string()).optional().default([]),
  verificationBacklog: z.array(z.string()).optional().default([]),
});

const CompanyIntelDigestHeadlineSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  summary: z.string().default(""),
  category: z.string().default("general"),
  confidence: z.string().default("reported"),
  sourceType: z.string().default("internal-curated"),
  sourceTitle: z.string().default(""),
  sourceUrl: z.string().default(""),
  impact: z.string().default(""),
  status: z.string().default("new"),
});

const CompanyIntelDigestSourceStatusSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.string(),
  mode: z.string().default("manual"),
  lastCheckedAt: z.string().nullable().optional().default(null),
  notes: z.string().default(""),
});

const CompanyIntelDigestDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  asOf: z.string().default(""),
  freshness: z.object({
    intelAsOf: z.string().default(""),
    daysSinceIntelSnapshot: z.number().default(0),
    stale: z.boolean().default(false),
    staleReason: z.string().default(""),
  }),
  summary: z.object({
    newCount: z.number().default(0),
    highPriorityCount: z.number().default(0),
    sourceFeedsActive: z.number().default(0),
    sourceFeedsPlanned: z.number().default(0),
  }),
  headlines: z.array(CompanyIntelDigestHeadlineSchema).default([]),
  sourceStatus: z.array(CompanyIntelDigestSourceStatusSchema).default([]),
  todo: z.array(z.string()).default([]),
});

const CompanyIntelReviewQueueItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceUrl: z.string().default(""),
  title: z.string(),
  date: z.string().default(""),
  detectedAt: z.string(),
  status: z.string().default("pending-review"),
  queueType: z.string().default("company-intel-review"),
  categoryHint: z.string().default("general-company-update"),
  priority: z.string().default("medium"),
  reviewHint: z.string().default(""),
  reviewedAt: z.string().nullable().optional().default(null),
  reviewOutcome: z.string().default(""),
  notes: z.string().default(""),
});

const CompanyIntelReviewQueueDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  summary: z.object({
    pendingReview: z.number().default(0),
    reviewed: z.number().default(0),
    highPriorityPending: z.number().default(0),
  }),
  items: z.array(CompanyIntelReviewQueueItemSchema).default([]),
});

const CompanyIntelAgentBacklogItemSchema = z.object({
  id: z.string(),
  priority: z.string().default("medium"),
  title: z.string(),
  why: z.string().default(""),
  nextStep: z.string().default(""),
  owner: z.string().default("Codex"),
});

const CompanyIntelAgentBacklogDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  summary: z.object({
    openTodos: z.number().default(0),
    highPriority: z.number().default(0),
    mediumPriority: z.number().default(0),
  }),
  todos: z.array(CompanyIntelAgentBacklogItemSchema).default([]),
});

const SystemRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  businessOwner: z.string(),
  systemOwner: z.string(),
  adminOwner: z.string(),
  backupOwner: z.string(),
  accessModel: z.string(),
  usage: z.string(),
  notes: z.string(),
});

const SystemsDataSchema = z.object({
  systems: z.array(SystemRecordSchema),
});

const IntegrationRecordSchema = z.object({
  id: z.string(),
  sourceSystem: z.string(),
  targetSystem: z.string(),
  feedType: z.string(),
  frequency: z.string(),
  owner: z.string(),
  monitoring: z.string(),
  failureProcess: z.string(),
  status: z.string(),
  notes: z.string(),
});

const IntegrationsDataSchema = z.object({
  integrations: z.array(IntegrationRecordSchema),
});

const AccessRequestSchema = z.object({
  id: z.string(),
  person: z.string(),
  system: z.string(),
  requestedRole: z.string(),
  status: z.string(),
  owner: z.string(),
  requestedAt: z.string(),
  nextStep: z.string(),
});

const AccessRequestsDataSchema = z.object({
  requests: z.array(AccessRequestSchema),
});

const PresentationArtifactSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  status: z.string(),
  source: z.string(),
  link: z.string().optional().default(""),
  owner: z.string(),
  notes: z.string(),
});

const PresentationSlideSchema = z.object({
  id: z.string(),
  section: z.string(),
  title: z.string(),
  status: z.string(),
  owner: z.string(),
  evidenceStatus: z.string(),
  notes: z.string(),
  visual: z.string().optional().default(""),
  content: z.array(z.string()).optional().default([]),
});

const PresentationGapSchema = z.object({
  id: z.string(),
  topic: z.string(),
  priority: z.string(),
  owner: z.string(),
  due: z.string(),
  status: z.string(),
  ask: z.string(),
});

const PresentationLogSchema = z.object({
  date: z.string(),
  author: z.string(),
  action: z.string(),
});

const PresentationSchema = z.object({
  id: z.string(),
  title: z.string(),
  audience: z.string(),
  meetingDate: z.string(),
  owner: z.string(),
  status: z.string(),
  objective: z.string(),
  narrative: z.array(z.string()).default([]),
  keyMessages: z.array(z.string()).default([]),
  dataRequests: z.array(PresentationGapSchema).default([]),
  artifacts: z.array(PresentationArtifactSchema).default([]),
  slidePlan: z.array(PresentationSlideSchema).default([]),
  actionLog: z.array(PresentationLogSchema).default([]),
  tags: z.array(z.string()).default([]),
  lastUpdated: z.string(),
});

const PresentationsDataSchema = z.object({
  presentations: z.array(PresentationSchema).default([]),
});

const SharePointArtifactSourceEmailSchema = z.object({
  received: z.string().nullable().optional().default(null),
  subject: z.string().optional().default(""),
  sender: z.string().optional().default(""),
  bodyPath: z.string().optional().default(""),
});

const SharePointArtifactSchema = z.object({
  id: z.string(),
  canonicalUrl: z.string(),
  rawUrls: z.array(z.string()).default([]),
  title: z.string(),
  host: z.string().optional().default(""),
  site: z.string().optional().default(""),
  itemType: z.string().optional().default("unknown"),
  extension: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
  folderPath: z.string().optional().default(""),
  phase: z.string().optional().default(""),
  sourceEmails: z.array(SharePointArtifactSourceEmailSchema).default([]),
  localPaths: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  firstSeenAt: z.string().nullable().optional().default(null),
  lastSeenAt: z.string().nullable().optional().default(null),
  status: z.string().default("link-only"),
});

const SharePointArtifactsDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  summary: z.object({
    artifactCount: z.number().default(0),
    localAttachmentMatches: z.number().default(0),
    sourceEmailsScanned: z.number().default(0),
    attachmentBodiesScanned: z.number().default(0),
  }),
  artifacts: z.array(SharePointArtifactSchema).default([]),
});

const SharePointArtifactContentFileEntrySchema = z.object({
  relPath: z.string(),
  fileName: z.string(),
  extension: z.string(),
  sizeBytes: z.number().nullable(),
  modifiedAt: z.string().nullable(),
  parser: z.string(),
  textStatus: z.string(),
  textChars: z.number().default(0),
  parsedTextPreview: z.string().default(""),
  parseError: z.string().default(""),
  extra: z.record(z.string(), z.unknown()).default({}),
});

const SharePointArtifactContentItemSchema = z.object({
  artifactId: z.string(),
  title: z.string(),
  canonicalUrl: z.string(),
  phase: z.string().default(""),
  itemType: z.string().default("unknown"),
  status: z.string().default("link-only"),
  fileEntries: z.array(SharePointArtifactContentFileEntrySchema).default([]),
  bestPreview: z.string().default(""),
});

const SharePointArtifactContentDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  summary: z.object({
    artifactsWithLocalFiles: z.number().default(0),
    artifactsWithParsedText: z.number().default(0),
    parseFailures: z.number().default(0),
  }),
  items: z.array(SharePointArtifactContentItemSchema).default([]),
});

const ErpPillarSchema = z.object({
  id: z.string(),
  shortLabel: z.string(),
  label: z.string(),
  description: z.string(),
  doneMeans: z.array(z.string()).default([]),
  subtopics: z.array(z.string()).default([]),
  executivePrompt: z.string().optional().default(""),
});

const ErpCrossCuttingSchema = z.object({
  id: z.string(),
  shortLabel: z.string(),
  label: z.string(),
  description: z.string(),
  subtopics: z.array(z.string()).default([]),
});

const ErpPillarsDataSchema = z.object({
  version: z.number(),
  updatedAt: z.string(),
  pillars: z.array(ErpPillarSchema).default([]),
  crossCutting: z.array(ErpCrossCuttingSchema).default([]),
});

const ErpPillarEvidenceRequestSchema = z.object({
  id: z.string(),
  sentDate: z.string().optional().default(""),
  source: z.string().optional().default("email"),
  sentTo: z.string(),
  topic: z.string(),
  status: z.string().default("awaiting-response"),
  why: z.string().default(""),
  nextMove: z.string().default(""),
  notes: z.string().optional().default(""),
});

const ErpPillarBaselineSchema = z.object({
  pillarId: z.string(),
  status: z.string().default("active"),
  evidenceStrength: z.string().default("weak"),
  ownerClarity: z.string().default("partial"),
  erpAddressableMapping: z.string().default("not-started"),
  whatDone: z.array(z.string()).default([]),
  openItems: z.array(z.string()).default([]),
  waitingOn: z.array(z.string()).default([]),
  nextMoves: z.array(z.string()).default([]),
  keyContacts: z.array(z.string()).default([]),
  evidenceRequests: z.array(ErpPillarEvidenceRequestSchema).default([]),
});

const ErpPillarBaselinesDataSchema = z.object({
  version: z.number().default(1),
  updatedAt: z.string(),
  baselines: z.array(ErpPillarBaselineSchema).default([]),
});

const ProcessFlowStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  owner: z.string().default(""),
  systems: z.array(z.string()).default([]),
  painPoints: z.array(z.string()).default([]),
  controlNotes: z.array(z.string()).default([]),
});

const ProcessFlowStateSchema = z.object({
  summary: z.string().default(""),
  steps: z.array(ProcessFlowStepSchema).default([]),
});

const ProcessFlowSchema = z.object({
  id: z.string(),
  title: z.string(),
  pillarId: z.string(),
  scope: z.string(),
  owner: z.string().default(""),
  status: z.string().default("scaffold"),
  audience: z.array(z.string()).default([]),
  currentState: ProcessFlowStateSchema,
  futureState: z.object({
    summary: z.string().default(""),
    targetChanges: z.array(z.string()).default([]),
    erpAddressableChanges: z.array(z.string()).default([]),
    nonErpChanges: z.array(z.string()).default([]),
  }),
  evidenceNeeded: z.array(z.string()).default([]),
  sourceArtifacts: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
  deckUseCases: z.array(z.string()).default([]),
  lastUpdated: z.string(),
});

const ProcessFlowsDataSchema = z.object({
  version: z.number().default(1),
  updatedAt: z.string(),
  flows: z.array(ProcessFlowSchema).default([]),
});

const CftiCountItemSchema = z.object({
  key: z.string(),
  count: z.number(),
});

const CftiTrackerSampleRowSchema = z.object({
  process: z.string().default(""),
  subProcess: z.string().default(""),
  controlId: z.string().default(""),
  controlTitle: z.string().default(""),
  gap: z.string().default(""),
  overallStatus: z.string().default(""),
  expectedValidationDate: z.string().default(""),
});

const CftiTrackerSummarySchema = z.object({
  rowCount: z.number().default(0),
  byProcess: z.array(CftiCountItemSchema).default([]),
  byGap: z.array(CftiCountItemSchema).default([]),
  byStatus: z.array(CftiCountItemSchema).default([]),
  sampleRows: z.array(CftiTrackerSampleRowSchema).default([]),
});

const CftiRcmSampleGapControlSchema = z.object({
  controlId: z.string().default(""),
  subProcess: z.string().default(""),
  controlTitle: z.string().default(""),
  system: z.string().default(""),
  automationType: z.string().default(""),
  remediationPlan: z.string().default(""),
});

const CftiRcmSummarySchema = z.object({
  kind: z.string().default(""),
  rowCount: z.number().default(0),
  gapControlCount: z.number().default(0),
  erpMentionControlCount: z.number().default(0),
  bySubProcess: z.array(CftiCountItemSchema).default([]),
  bySystem: z.array(CftiCountItemSchema).default([]),
  byAutomationType: z.array(CftiCountItemSchema).default([]),
  byFrequency: z.array(CftiCountItemSchema).default([]),
  sampleGapControls: z.array(CftiRcmSampleGapControlSchema).default([]),
});

const CftiWorkbookSectionSchema = z.object({
  fileName: z.string(),
  sheetName: z.string(),
  headerRowIndex: z.number().default(-1),
  headers: z.array(z.string()).default([]),
  summary: z.union([CftiTrackerSummarySchema, CftiRcmSummarySchema]),
});

const CftiControlsIntakeDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  status: z.string().default("missing"),
  sourceFolder: z.string().nullable().optional().default(null),
  summary: z.object({
    workbookCount: z.number().default(0),
    hasTracker: z.boolean().default(false),
    hasP2pRcm: z.boolean().default(false),
    hasFscpRcm: z.boolean().default(false),
  }).default({
    workbookCount: 0,
    hasTracker: false,
    hasP2pRcm: false,
    hasFscpRcm: false,
  }),
  tracker: CftiWorkbookSectionSchema.nullable().optional().default(null),
  p2pRcm: CftiWorkbookSectionSchema.nullable().optional().default(null),
  fscpRcm: CftiWorkbookSectionSchema.nullable().optional().default(null),
});

const CftiControlRegisterCountSchema = z.object({
  key: z.string(),
  count: z.number(),
});

const CftiControlRegisterRecordSchema = z.object({
  id: z.string(),
  controlId: z.string(),
  primaryPillar: z.string().default("controls-audit"),
  sourceDomains: z.array(z.string()).default([]),
  process: z.string().default(""),
  subProcess: z.string().default(""),
  controlTitle: z.string().default(""),
  controlSummary: z.string().default(""),
  risk: z.string().default(""),
  frequency: z.string().default(""),
  system: z.string().default(""),
  automationType: z.string().default(""),
  preventativeDetective: z.string().default(""),
  preparer: z.string().default(""),
  reviewer: z.string().default(""),
  keyNonKey: z.string().default(""),
  trackerGap: z.string().default(""),
  trackerOutOfScope: z.boolean().default(false),
  trackerOutOfScopeRationale: z.string().default(""),
  trackerStatus: z.string().default(""),
  expectedValidationDate: z.string().default(""),
  effectiveValidationDate: z.string().default(""),
  remediationPlan: z.string().default(""),
  erpSignal: z.boolean().default(false),
  gapType: z.string().default(""),
});

const CftiControlRegisterDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  status: z.string().default("missing"),
  sourceFolder: z.string().nullable().optional().default(null),
  summary: z.object({
    recordCount: z.number().default(0),
    trackerLinkedCount: z.number().default(0),
    rcmLinkedCount: z.number().default(0),
    byPrimaryPillar: z.array(CftiControlRegisterCountSchema).default([]),
    byTrackerGap: z.array(CftiControlRegisterCountSchema).default([]),
    byTrackerStatus: z.array(CftiControlRegisterCountSchema).default([]),
    erpSignalCount: z.number().default(0),
    outOfScopeCount: z.number().default(0),
    topSystems: z.array(CftiControlRegisterCountSchema).default([]),
    topAutomationTypes: z.array(CftiControlRegisterCountSchema).default([]),
  }).default({
    recordCount: 0,
    trackerLinkedCount: 0,
    rcmLinkedCount: 0,
    byPrimaryPillar: [],
    byTrackerGap: [],
    byTrackerStatus: [],
    erpSignalCount: 0,
    outOfScopeCount: 0,
    topSystems: [],
    topAutomationTypes: [],
  }),
  samples: z.object({
    p2pErpSignals: z.array(CftiControlRegisterRecordSchema).default([]),
    reportingGapSignals: z.array(CftiControlRegisterRecordSchema).default([]),
  }).default({
    p2pErpSignals: [],
    reportingGapSignals: [],
  }),
  records: z.array(CftiControlRegisterRecordSchema).default([]),
});

const ProcessFlowControlOverlaySummarySchema = z.object({
  mappedControlCount: z.number().default(0),
  erpSignalCount: z.number().default(0),
  trackerDesignCount: z.number().default(0),
  outOfScopeCount: z.number().default(0),
  byTrackerStatus: z.array(CftiControlRegisterCountSchema).default([]),
  byTrackerGap: z.array(CftiControlRegisterCountSchema).default([]),
  bySubProcess: z.array(CftiControlRegisterCountSchema).default([]),
});

const ProcessFlowControlOverlayStepSchema = z.object({
  stepId: z.string(),
  stepLabel: z.string(),
  ruleApplied: z.string().default("no"),
  summary: ProcessFlowControlOverlaySummarySchema,
  sampleControlIds: z.array(z.string()).default([]),
  sampleControls: z
    .array(
      z.object({
        id: z.string(),
        controlId: z.string(),
        controlTitle: z.string().default(""),
        process: z.string().default(""),
        subProcess: z.string().default(""),
        system: z.string().default(""),
        trackerGap: z.string().default(""),
        trackerStatus: z.string().default(""),
        erpSignal: z.boolean().default(false),
        trackerOutOfScope: z.boolean().default(false),
        expectedValidationDate: z.string().default(""),
      })
    )
    .default([]),
});

const ProcessFlowControlOverlayItemSchema = z.object({
  flowId: z.string(),
  flowTitle: z.string(),
  pillarId: z.string(),
  generatedFrom: z.string().default(""),
  summary: z.object({
    totalFlowPillarRecords: z.number().default(0),
    mappedAcrossSteps: z.number().default(0),
    uniqueMappedControls: z.number().default(0),
  }),
  stepOverlays: z.array(ProcessFlowControlOverlayStepSchema).default([]),
});

const ProcessFlowControlOverlaysDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  status: z.string().default("missing"),
  source: z
    .object({
      processFlowsUpdatedAt: z.string().default(""),
      cftiControlRegisterGeneratedAt: z.string().default(""),
    })
    .optional()
    .default({ processFlowsUpdatedAt: "", cftiControlRegisterGeneratedAt: "" }),
  overlays: z.array(ProcessFlowControlOverlayItemSchema).default([]),
});

const ProcessFlowDiagramNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  lane: z.string(),
  label: z.string(),
  subtitle: z.string().optional().default(""),
  stepIndex: z.number().optional(),
  systems: z.array(z.string()).optional().default([]),
  painPoints: z.array(z.string()).optional().default([]),
  metrics: z
    .object({
      erpSignals: z.number().default(0),
      trackerDesign: z.number().default(0),
      outOfScope: z.number().default(0),
    })
    .optional(),
  sampleControls: z
    .array(
      z.object({
        controlId: z.string(),
        title: z.string().default(""),
        trackerGap: z.string().default(""),
        trackerStatus: z.string().default(""),
        erpSignal: z.boolean().default(false),
      })
    )
    .optional()
    .default([]),
  targetChanges: z.array(z.string()).optional().default([]),
  erpAddressableChanges: z.array(z.string()).optional().default([]),
  nonErpChanges: z.array(z.string()).optional().default([]),
});

const ProcessFlowDiagramEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: z.string(),
  label: z.string().default(""),
});

const ProcessFlowDiagramPayloadSchema = z.object({
  flowId: z.string(),
  title: z.string(),
  pillarId: z.string(),
  scope: z.string().default(""),
  status: z.string().default(""),
  generatedAt: z.string(),
  lanes: z.array(z.object({ id: z.string(), label: z.string() })).default([]),
  nodes: z.array(ProcessFlowDiagramNodeSchema).default([]),
  edges: z.array(ProcessFlowDiagramEdgeSchema).default([]),
  source: z
    .object({
      processFlowLastUpdated: z.string().default(""),
      overlayGeneratedAt: z.string().default(""),
    })
    .optional()
    .default({ processFlowLastUpdated: "", overlayGeneratedAt: "" }),
});

const ProcessFlowDiagramPayloadsDataSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  status: z.string().default("missing"),
  payloads: z.array(ProcessFlowDiagramPayloadSchema).default([]),
});

export type SpineState = z.infer<typeof SpineStateSchema>;
export type NoteSummary = z.infer<typeof NoteSummarySchema>;
export type Note = z.infer<typeof NoteSchema>;
export type NotesData = z.infer<typeof NotesDataSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type PeopleData = z.infer<typeof PeopleDataSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type TimelineData = z.infer<typeof TimelineDataSchema>;
export type BudgetData = z.infer<typeof BudgetDataSchema>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type MeetingsData = z.infer<typeof MeetingsDataSchema>;
export type EntityProfile = z.infer<typeof EntityProfileSchema>;
export type EntityProfilesData = z.infer<typeof EntityProfilesDataSchema>;
export type CompanyIntelItem = z.infer<typeof CompanyIntelItemSchema>;
export type CompanyIntelSection = z.infer<typeof CompanyIntelSectionSchema>;
export type CompanyIntelSource = z.infer<typeof CompanyIntelSourceSchema>;
export type CompanyIntelData = z.infer<typeof CompanyIntelDataSchema>;
export type CompanyIntelDigestHeadline = z.infer<typeof CompanyIntelDigestHeadlineSchema>;
export type CompanyIntelDigestSourceStatus = z.infer<typeof CompanyIntelDigestSourceStatusSchema>;
export type CompanyIntelDigestData = z.infer<typeof CompanyIntelDigestDataSchema>;
export type CompanyIntelReviewQueueItem = z.infer<typeof CompanyIntelReviewQueueItemSchema>;
export type CompanyIntelReviewQueueData = z.infer<typeof CompanyIntelReviewQueueDataSchema>;
export type CompanyIntelAgentBacklogItem = z.infer<typeof CompanyIntelAgentBacklogItemSchema>;
export type CompanyIntelAgentBacklogData = z.infer<typeof CompanyIntelAgentBacklogDataSchema>;
export type SystemRecord = z.infer<typeof SystemRecordSchema>;
export type SystemsData = z.infer<typeof SystemsDataSchema>;
export type IntegrationRecord = z.infer<typeof IntegrationRecordSchema>;
export type IntegrationsData = z.infer<typeof IntegrationsDataSchema>;
export type AccessRequest = z.infer<typeof AccessRequestSchema>;
export type AccessRequestsData = z.infer<typeof AccessRequestsDataSchema>;
export type PresentationArtifact = z.infer<typeof PresentationArtifactSchema>;
export type PresentationSlide = z.infer<typeof PresentationSlideSchema>;
export type PresentationGap = z.infer<typeof PresentationGapSchema>;
export type PresentationLog = z.infer<typeof PresentationLogSchema>;
export type Presentation = z.infer<typeof PresentationSchema>;
export type PresentationsData = z.infer<typeof PresentationsDataSchema>;
export type SharePointArtifact = z.infer<typeof SharePointArtifactSchema>;
export type SharePointArtifactsData = z.infer<typeof SharePointArtifactsDataSchema>;
export type SharePointArtifactContentItem = z.infer<typeof SharePointArtifactContentItemSchema>;
export type SharePointArtifactContentData = z.infer<typeof SharePointArtifactContentDataSchema>;
export type ErpPillar = z.infer<typeof ErpPillarSchema>;
export type ErpCrossCutting = z.infer<typeof ErpCrossCuttingSchema>;
export type ErpPillarsData = z.infer<typeof ErpPillarsDataSchema>;
export type ErpPillarEvidenceRequest = z.infer<typeof ErpPillarEvidenceRequestSchema>;
export type ErpPillarBaseline = z.infer<typeof ErpPillarBaselineSchema>;
export type ErpPillarBaselinesData = z.infer<typeof ErpPillarBaselinesDataSchema>;
export type ProcessFlowStep = z.infer<typeof ProcessFlowStepSchema>;
export type ProcessFlow = z.infer<typeof ProcessFlowSchema>;
export type ProcessFlowsData = z.infer<typeof ProcessFlowsDataSchema>;
export type CftiControlsIntakeData = z.infer<typeof CftiControlsIntakeDataSchema>;
export type CftiControlRegisterData = z.infer<typeof CftiControlRegisterDataSchema>;
export type ProcessFlowControlOverlaysData = z.infer<typeof ProcessFlowControlOverlaysDataSchema>;
export type ProcessFlowDiagramPayloadsData = z.infer<typeof ProcessFlowDiagramPayloadsDataSchema>;

const DATA_DIR = path.join(process.cwd(), "data", "abivax");

function loadJsonFile<T>(filename: string, schema: z.ZodType<T>): T {
  const filePath = path.join(DATA_DIR, filename);
  const content = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(content) as unknown;
  return schema.parse(parsed);
}

function loadJsonFileSafe<T>(filename: string, schema: z.ZodType<T>, fallbackInput: unknown): T {
  try {
    return loadJsonFile(filename, schema);
  } catch {
    return schema.parse(fallbackInput);
  }
}

export function loadSpineState(): SpineState {
  return loadJsonFile("spine_state.json", SpineStateSchema);
}

export function loadNotes(): NotesData {
  return loadJsonFile("notes.json", NotesDataSchema);
}

export function loadPeople(): PeopleData {
  return loadJsonFile("people.json", PeopleDataSchema);
}

export function loadTimeline(): TimelineData {
  return loadJsonFile("timeline.json", TimelineDataSchema);
}

export function loadBudget(): BudgetData {
  return loadJsonFile("budget.json", BudgetDataSchema);
}

export function loadMeetings(): MeetingsData {
  return loadJsonFile("meetings.json", MeetingsDataSchema);
}

export function loadEntities(): EntitiesData {
  return loadJsonFile("entities.json", EntitiesDataSchema);
}

export function loadEntityProfiles(): EntityProfilesData {
  return loadJsonFile("entity_profiles.json", EntityProfilesDataSchema);
}

export function loadCompanyIntel(): CompanyIntelData {
  return loadJsonFile("company_intel.json", CompanyIntelDataSchema);
}

export function loadCompanyIntelDigest(): CompanyIntelDigestData {
  return loadJsonFileSafe("company_intel_daily_digest.json", CompanyIntelDigestDataSchema, {});
}

export function loadCompanyIntelReviewQueue(): CompanyIntelReviewQueueData {
  return loadJsonFileSafe("company_intel_review_queue.json", CompanyIntelReviewQueueDataSchema, {});
}

export function loadCompanyIntelAgentBacklog(): CompanyIntelAgentBacklogData {
  return loadJsonFileSafe("company_intel_agent_backlog.json", CompanyIntelAgentBacklogDataSchema, {});
}

export function loadSystems(): SystemsData {
  return loadJsonFile("systems.json", SystemsDataSchema);
}

export function loadIntegrations(): IntegrationsData {
  return loadJsonFile("integrations.json", IntegrationsDataSchema);
}

export function loadAccessRequests(): AccessRequestsData {
  return loadJsonFile("access_requests.json", AccessRequestsDataSchema);
}

export function loadPresentations(): PresentationsData {
  return loadJsonFile("presentations.json", PresentationsDataSchema);
}

export function loadSharePointArtifacts(): SharePointArtifactsData {
  return loadJsonFile("sharepoint_artifacts.json", SharePointArtifactsDataSchema);
}

export function loadSharePointArtifactContent(): SharePointArtifactContentData {
  return loadJsonFile("sharepoint_artifact_content.json", SharePointArtifactContentDataSchema);
}

export function loadErpPillars(): ErpPillarsData {
  return loadJsonFile("erp_pillars.json", ErpPillarsDataSchema);
}

export function loadErpPillarBaselines(): ErpPillarBaselinesData {
  return loadJsonFile("erp_pillar_baselines.json", ErpPillarBaselinesDataSchema);
}

export function loadProcessFlows(): ProcessFlowsData {
  return loadJsonFile("process_flows.json", ProcessFlowsDataSchema);
}

export function loadCftiControlsIntake(): CftiControlsIntakeData {
  return loadJsonFileSafe("cfti_controls_intake.json", CftiControlsIntakeDataSchema, {});
}

export function loadCftiControlRegister(): CftiControlRegisterData {
  return loadJsonFileSafe("cfti_control_register.json", CftiControlRegisterDataSchema, {});
}

export function loadProcessFlowControlOverlays(): ProcessFlowControlOverlaysData {
  return loadJsonFileSafe("process_flow_control_overlays.json", ProcessFlowControlOverlaysDataSchema, {});
}

export function loadProcessFlowDiagramPayloads(): ProcessFlowDiagramPayloadsData {
  return loadJsonFileSafe("process_flow_diagram_payloads.json", ProcessFlowDiagramPayloadsDataSchema, {});
}

export function getEntityBySlug(slug: string): Entity | undefined {
  const { entities } = loadEntities();
  return entities.find((e) => e.id === slug);
}

export function getEntitiesByType(type: EntityType): Entity[] {
  const { entities } = loadEntities();
  return entities.filter((e) => e.type === type);
}

export function getLinkedEntities(entityId: string): Entity[] {
  const { entities } = loadEntities();
  const entity = entities.find((e) => e.id === entityId);
  if (!entity) return [];
  return entities.filter((e) => entity.links.includes(e.id));
}

export function getBacklinks(entityId: string): Entity[] {
  const { entities } = loadEntities();
  return entities.filter((e) => e.links.includes(entityId));
}

export function searchEntities(query: string): Entity[] {
  const { entities } = loadEntities();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return entities
    .map((entity) => {
      let score = 0;
      const nameMatch = entity.name.toLowerCase().includes(q);
      const aliasMatch = entity.aliases.some((a) => a.toLowerCase().includes(q));
      const descMatch = entity.description?.toLowerCase().includes(q);
      const notesMatch = entity.notes?.toLowerCase().includes(q);
      const propsMatch = JSON.stringify(entity.properties).toLowerCase().includes(q);

      if (entity.name.toLowerCase() === q) score += 100;
      else if (nameMatch) score += 50;
      if (aliasMatch) score += 40;
      if (descMatch) score += 20;
      if (notesMatch) score += 10;
      if (propsMatch) score += 5;

      return { entity, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entity);
}

