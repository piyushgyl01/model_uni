import type {
  PublishedProgramBundle,
  ResourceVersionId,
} from "../../app/domain/catalog";
import {
  assertValidPublishedProgramBundle,
} from "../../app/domain/validation";

const PUBLISHED_AT = "2026-07-29T00:00:00Z" as const;
const PROGRAM_ID = "prg_practical_spreadsheets";
const PROGRAM_VERSION_ID = "prv_practical_spreadsheets_2026_1";
const COURSE_ID = "crs_practical_spreadsheets";
const COURSE_VERSION_ID = "crv_practical_spreadsheets_2026_1";

const resourceSeeds = [
  {
    id: "res_spreadsheets_excel_learning",
    versionId: "rsv_spreadsheets_excel_learning_2026_1",
    slug: "excel-help-and-learning",
    title: "Excel help & learning",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/en-us/office/excel-video-training-9bc05390-e94c-46af-a5b3-d7c22f6990bb",
    kind: "course" as const,
    note: "Free official Excel learning hub. Some product capabilities depend on the Excel edition and platform.",
  },
  {
    id: "res_spreadsheets_formulas",
    versionId: "rsv_spreadsheets_formulas_2026_1",
    slug: "overview-of-formulas-in-excel",
    title: "Overview of formulas in Excel",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/en-us/excel/get-started/overview-of-formulas-in-excel",
    kind: "article" as const,
    note: "Official reference for formula structure, operators, references, constants, and functions.",
  },
  {
    id: "res_spreadsheets_validation",
    versionId: "rsv_spreadsheets_validation_2026_1",
    slug: "apply-data-validation-to-cells",
    title: "Apply data validation to cells",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/en-us/excel/get-started/apply-data-validation-to-cells",
    kind: "article" as const,
    note: "Official instructions for validation rules, input messages, and error alerts.",
  },
  {
    id: "res_spreadsheets_xlookup",
    versionId: "rsv_spreadsheets_xlookup_2026_1",
    slug: "xlookup-function",
    title: "XLOOKUP function",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929",
    kind: "article" as const,
    note: "Official syntax and examples for exact, approximate, reverse, and wildcard lookups.",
  },
  {
    id: "res_spreadsheets_pivottable",
    versionId: "rsv_spreadsheets_pivottable_2026_1",
    slug: "create-a-pivottable",
    title: "Create a PivotTable to analyze worksheet data",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/en-us/excel/get-started/create-a-pivottable-to-analyze-worksheet-data",
    kind: "article" as const,
    note: "Official workflow for preparing tabular data and building a PivotTable.",
  },
  {
    id: "res_spreadsheets_charts",
    versionId: "rsv_spreadsheets_charts_2026_1",
    slug: "create-a-chart-from-start-to-finish",
    title: "Create a chart from start to finish",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/en-US/Excel/get-started/create-a-chart-from-start-to-finish",
    kind: "article" as const,
    note: "Official chart-selection, formatting, labeling, and presentation guidance.",
  },
  {
    id: "res_spreadsheets_power_query",
    versionId: "rsv_spreadsheets_power_query_2026_1",
    slug: "about-power-query-in-excel",
    title: "About Power Query in Excel",
    provider: "Microsoft Support",
    url: "https://support.microsoft.com/en-us/excel/about-power-query-in-excel",
    kind: "article" as const,
    note: "Official import and transformation overview. Feature availability varies by Excel platform and license.",
  },
  {
    id: "res_spreadsheets_google_sheets",
    versionId: "rsv_spreadsheets_google_sheets_2026_1",
    slug: "google-sheets-training-and-help",
    title: "Google Sheets training and help",
    provider: "Google Workspace Learning Center",
    url: "https://support.google.com/a/users/answer/9282959?hl=en",
    kind: "course" as const,
    note: "Free browser-based alternative covering formulas, charts, pivots, cleaning, and collaboration. Creating files requires a Google account.",
  },
  {
    id: "res_spreadsheets_libreoffice_calc",
    versionId: "rsv_spreadsheets_libreoffice_calc_2026_1",
    slug: "libreoffice-calc-guides",
    title: "LibreOffice Calc Guides",
    provider: "LibreOffice Documentation",
    url: "https://documentation.libreoffice.org/en/english-documentation/calc/",
    kind: "textbook" as const,
    note: "Free/open desktop alternative with browser-readable and downloadable Calc guides.",
  },
] as const;

const resourceVersion = (id: string) => id as ResourceVersionId;

const competencies = [
  {
    id: "cmp_spreadsheets_data_hygiene",
    canonicalSlug: "spreadsheet-data-hygiene",
    title: "Structure trustworthy spreadsheet data",
    description:
      "Design tidy tables, typed fields, validation rules, and documented assumptions that resist silent errors.",
    domain: "Spreadsheet Modeling",
  },
  {
    id: "cmp_spreadsheets_formulas",
    canonicalSlug: "spreadsheet-formulas-and-lookups",
    title: "Build auditable formulas and lookups",
    description:
      "Use references, functions, lookups, error handling, and reconciliation checks without hiding logic.",
    domain: "Spreadsheet Modeling",
  },
  {
    id: "cmp_spreadsheets_analysis",
    canonicalSlug: "spreadsheet-analysis",
    title: "Summarize and interrogate data",
    description:
      "Use pivots, filters, aggregations, and scenario calculations to answer concrete questions.",
    domain: "Data Analysis",
  },
  {
    id: "cmp_spreadsheets_communication",
    canonicalSlug: "spreadsheet-visual-communication",
    title: "Communicate decisions with charts",
    description:
      "Choose honest visual encodings and build decision-ready charts and dashboards.",
    domain: "Data Communication",
  },
  {
    id: "cmp_spreadsheets_reproducibility",
    canonicalSlug: "spreadsheet-reproducibility",
    title: "Deliver a reproducible decision workbook",
    description:
      "Import, clean, refresh, document, test, and defend a workbook another person can safely reuse.",
    domain: "Professional Practice",
  },
] as const;

const units = [
  {
    id: "unt_spreadsheets_01",
    order: 1,
    label: "Week 1",
    kind: "lesson" as const,
    kindLabel: "foundation",
    title: "Build a trustworthy table",
    topic: "Workbook anatomy, tidy tables, types, naming, source notes, and error traps",
    resourceLocator: "Get started · data and formatting",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_excel_learning_2026_1"),
      resourceVersion("rsv_spreadsheets_google_sheets_2026_1"),
      resourceVersion("rsv_spreadsheets_libreoffice_calc_2026_1"),
    ],
    activity:
      "Turn a deliberately messy sales or household dataset into one tidy source table with typed columns, stable headers, and a source note.",
    evidence: "Clean workbook, data dictionary, and a ten-item error log",
    nominalHours: 5,
    competencyIds: ["cmp_spreadsheets_data_hygiene"],
  },
  {
    id: "unt_spreadsheets_02",
    order: 2,
    label: "Week 2",
    kind: "practice" as const,
    kindLabel: "formula lab",
    title: "Make formulas readable",
    topic: "Relative, absolute, and mixed references; arithmetic; functions; error handling",
    resourceLocator: "Formula overview",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_formulas_2026_1"),
    ],
    activity:
      "Build a small pricing and margin model, then audit it by tracing references and testing boundary values.",
    evidence: "Formula model, five boundary tests, and annotated audit notes",
    nominalHours: 5,
    competencyIds: ["cmp_spreadsheets_formulas"],
  },
  {
    id: "unt_spreadsheets_03",
    order: 3,
    label: "Week 3",
    kind: "lab" as const,
    kindLabel: "quality lab",
    title: "Prevent bad input",
    topic: "Validation, controlled categories, duplicates, missing values, and quality checks",
    resourceLocator: "Data validation guide",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_validation_2026_1"),
    ],
    activity:
      "Add validation and an exception report to a small operational tracker, then try to break it with malformed input.",
    evidence: "Validated tracker and before/after data-quality report",
    nominalHours: 5,
    competencyIds: ["cmp_spreadsheets_data_hygiene"],
  },
  {
    id: "unt_spreadsheets_04",
    order: 4,
    label: "Week 4",
    kind: "review" as const,
    kindLabel: "individual checkpoint",
    title: "Reconcile with lookups",
    topic: "XLOOKUP, matching keys, missing records, and reconciliation controls",
    resourceLocator: "XLOOKUP syntax and examples",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_xlookup_2026_1"),
    ],
    activity:
      "Join two unseen tables, explain every unmatched record, and prove that the resulting totals reconcile.",
    evidence: "Timed reconciliation workbook, exception table, and corrections memo",
    nominalHours: 5,
    competencyIds: [
      "cmp_spreadsheets_formulas",
      "cmp_spreadsheets_data_hygiene",
    ],
    assessmentKind: "project" as const,
  },
  {
    id: "unt_spreadsheets_05",
    order: 5,
    label: "Week 5",
    kind: "practice" as const,
    kindLabel: "analysis lab",
    title: "Ask questions with PivotTables",
    topic: "Dimensions, measures, aggregation, grouping, filters, and drill-down",
    resourceLocator: "Create a PivotTable",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_pivottable_2026_1"),
    ],
    activity:
      "Answer five management questions from one transaction table using pivots, then verify one answer with formulas.",
    evidence: "Pivot workbook and one-page findings brief",
    nominalHours: 5,
    competencyIds: ["cmp_spreadsheets_analysis"],
  },
  {
    id: "unt_spreadsheets_06",
    order: 6,
    label: "Week 6",
    kind: "project" as const,
    kindLabel: "communication studio",
    title: "Build an honest dashboard",
    topic: "Chart choice, comparison, trend, uncertainty, annotation, and visual hierarchy",
    resourceLocator: "Chart workflow",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_charts_2026_1"),
    ],
    activity:
      "Create a one-screen dashboard that answers three decisions without decorative or misleading charts.",
    evidence: "Dashboard, chart-choice rationale, and accessibility check",
    nominalHours: 5,
    competencyIds: [
      "cmp_spreadsheets_analysis",
      "cmp_spreadsheets_communication",
    ],
  },
  {
    id: "unt_spreadsheets_07",
    order: 7,
    label: "Week 7",
    kind: "lab" as const,
    kindLabel: "refresh lab",
    title: "Create a repeatable data pipeline",
    topic: "Import, clean, reshape, refresh, and document a repeatable transformation",
    resourceLocator: "Power Query overview · or equivalent import/clean workflow",
    resourceVersionIds: [
      resourceVersion("rsv_spreadsheets_power_query_2026_1"),
      resourceVersion("rsv_spreadsheets_google_sheets_2026_1"),
      resourceVersion("rsv_spreadsheets_libreoffice_calc_2026_1"),
    ],
    activity:
      "Import two raw files, document a repeatable cleaning sequence, refresh with changed input, and record platform differences.",
    evidence: "Refreshable workbook, transformation log, and platform caveat",
    nominalHours: 5,
    competencyIds: ["cmp_spreadsheets_reproducibility"],
  },
  {
    id: "unt_spreadsheets_08",
    order: 8,
    label: "Week 8",
    kind: "project" as const,
    kindLabel: "capstone defense",
    title: "Defend a decision workbook",
    topic: "Integrated data, model, checks, analysis, dashboard, documentation, and handoff",
    resourceLocator: "Use the relevant official guides from Weeks 1–7",
    resourceVersionIds: resourceSeeds.map((resource) =>
      resourceVersion(resource.versionId),
    ),
    activity:
      "Build a workbook for a real decision, run an adversarial audit, fix the failures, and defend the result to another person.",
    evidence:
      "Final workbook, README, test sheet, five-minute walkthrough, and audit response",
    nominalHours: 5,
    competencyIds: competencies.map((competency) => competency.id),
    assessmentKind: "portfolio" as const,
  },
] as const;

const programEvidenceId = "prvdc_spreadsheets_program_review";

const resourceEvidence = resourceSeeds.map((resource, index) => ({
  id: `prvdc_spreadsheets_resource_${String(index + 1).padStart(2, "0")}` as const,
  kind: "provider page" as const,
  sourceTitle: `${resource.provider}: ${resource.title}`,
  sourceUrl: resource.url,
  retrievedAt: PUBLISHED_AT,
  subjects: [
    { kind: "resourceVersion" as const, id: resourceVersion(resource.versionId) },
    {
      kind: "resourceAccess" as const,
      id: `acc_spreadsheets_${String(index + 1).padStart(2, "0")}` as const,
    },
    {
      kind: "resourceRights" as const,
      id: `rgt_spreadsheets_${String(index + 1).padStart(2, "0")}` as const,
    },
  ],
  note: resource.note,
}));

export const practicalSpreadsheetsProgram = assertValidPublishedProgramBundle({
  schemaVersion: 1,
  id: "bnd_practical_spreadsheets_2026_1",
  publishedAt: PUBLISHED_AT,
  program: {
    id: PROGRAM_ID,
    canonicalSlug: "practical-spreadsheets",
    title: "Practical Spreadsheets & Decision Modeling",
    shortTitle: "Practical Spreadsheets",
    school: "School of Work & Technology",
    discipline: "Productivity and Data",
    kind: "certificate pathway",
    lifecycle: "active",
  },
  programVersion: {
    id: PROGRAM_VERSION_ID,
    programId: PROGRAM_ID,
    version: "1.0.0",
    status: "published",
    publishedAt: PUBLISHED_AT,
    baseLocale: "en",
    title: "Practical Spreadsheets & Decision Modeling",
    summary:
      "An eight-week applied sprint from clean tables and formulas to a tested, refreshable decision workbook.",
    credentialLabel: "Short independent-study pathway",
    nominalDuration: "8 weeks · self-directed",
    recognitionNotice:
      "Independent study, not academic credit or a Microsoft, Google, or LibreOffice certification.",
    outcomes: [
      "Structure trustworthy data and prevent common spreadsheet failures.",
      "Build formulas, lookups, pivots, and charts that can be independently audited.",
      "Deliver and defend a refreshable decision workbook with documentation and tests.",
    ],
    workloadPolicy:
      "Eight ordered learning units at approximately five focused hours each. Learners may use Excel, Google Sheets, or LibreOffice Calc; feature differences are stated where relevant.",
    defaultScheduleId: "sch_spreadsheets_eight_week",
    requirements: [
      {
        id: "req_spreadsheets_complete_course",
        title: "Complete the applied course",
        description:
          "Finish all eight units, the reconciliation checkpoint, and the decision-workbook capstone.",
        order: 1,
        rule: {
          minSelections: 1,
          maxSelections: 1,
          minCredits: { value: 1, system: "Course Atlas completion unit" },
        },
        options: [
          {
            id: "opt_spreadsheets_course",
            courseVersionId: COURSE_VERSION_ID,
            credits: { value: 1, system: "Course Atlas completion unit" },
            recommendedPeriodId: "per_spreadsheets_sprint",
          },
        ],
      },
    ],
    concentrationIds: [],
    competencyIds: competencies.map((competency) => competency.id),
    provenanceEvidenceIds: [programEvidenceId],
  },
  courses: [
    {
      id: COURSE_ID,
      canonicalSlug: "practical-spreadsheets-and-decision-modeling",
      codes: [{ namespace: "Course Atlas", value: "SHEET101" }],
      discipline: "Productivity and Data",
      lifecycle: "active",
    },
  ],
  courseVersions: [
    {
      id: COURSE_VERSION_ID,
      courseId: COURSE_ID,
      version: "1.0.0",
      status: "published",
      publishedAt: PUBLISHED_AT,
      baseLocale: "en",
      title: "Practical Spreadsheets & Decision Modeling",
      summary:
        "A tool-flexible course in data hygiene, formulas, reconciliation, analysis, visualization, refresh, and defensible workbook design.",
      outcomes: [
        "Produce a tested workbook whose inputs, logic, calculations, outputs, and assumptions can be audited.",
      ],
      format: "short course",
      nominalHours: 40,
      setup: [
        "Choose Excel, Google Sheets, or LibreOffice Calc and create a dedicated practice folder.",
        "Download or create a small transaction dataset with dates, categories, quantities, and values.",
        "Keep an error log and a README sheet from the first unit.",
      ],
      firstAction:
        "Open the Week 1 learning unit and turn the messy practice data into a tidy source table.",
      prerequisites: [],
      resourceReferences: [
        {
          resourceVersionId: resourceVersion(
            "rsv_spreadsheets_excel_learning_2026_1",
          ),
          role: "primary",
          note: "Use when working in Excel.",
        },
        {
          resourceVersionId: resourceVersion(
            "rsv_spreadsheets_google_sheets_2026_1",
          ),
          role: "alternative",
          note: "Free browser-based route; creating a workbook requires an account.",
        },
        {
          resourceVersionId: resourceVersion(
            "rsv_spreadsheets_libreoffice_calc_2026_1",
          ),
          role: "alternative",
          note: "Free/open desktop route.",
        },
      ],
      rootUnitIds: units.map((unit) => unit.id),
      gradingPolicy: {
        passingPercentage: 60,
        contributions: [
          {
            assessmentVersionId: "asv_spreadsheets_reconciliation_2026_1",
            weight: 35,
          },
          {
            assessmentVersionId: "asv_spreadsheets_capstone_2026_1",
            weight: 65,
            requiredToPass: true,
          },
        ],
      },
      competencyIds: competencies.map((competency) => competency.id),
      provenanceEvidenceIds: [programEvidenceId],
    },
  ],
  learningUnits: units.map((unit) => ({
    ...unit,
    courseVersionId: COURSE_VERSION_ID,
  })),
  assessments: [
    {
      id: "asm_spreadsheets_reconciliation",
      courseId: COURSE_ID,
      canonicalSlug: "spreadsheet-reconciliation-checkpoint",
      kind: "project",
      lifecycle: "active",
    },
    {
      id: "asm_spreadsheets_capstone",
      courseId: COURSE_ID,
      canonicalSlug: "decision-workbook-capstone",
      kind: "portfolio",
      lifecycle: "active",
    },
  ],
  assessmentVersions: [
    {
      id: "asv_spreadsheets_reconciliation_2026_1",
      assessmentId: "asm_spreadsheets_reconciliation",
      courseVersionId: COURSE_VERSION_ID,
      unitId: "unt_spreadsheets_04",
      version: "1.0.0",
      status: "published",
      publishedAt: PUBLISHED_AT,
      title: "Reconciliation checkpoint",
      instructions: units[3].activity,
      submissionEvidence: [units[3].evidence],
      estimatedHours: 5,
      maximumScore: 100,
      resourceVersionIds: units[3].resourceVersionIds,
      competencyIds: units[3].competencyIds,
      provenanceEvidenceIds: [programEvidenceId],
    },
    {
      id: "asv_spreadsheets_capstone_2026_1",
      assessmentId: "asm_spreadsheets_capstone",
      courseVersionId: COURSE_VERSION_ID,
      unitId: "unt_spreadsheets_08",
      version: "1.0.0",
      status: "published",
      publishedAt: PUBLISHED_AT,
      title: "Decision-workbook capstone and defense",
      instructions: units[7].activity,
      submissionEvidence: [units[7].evidence],
      estimatedHours: 5,
      maximumScore: 100,
      resourceVersionIds: units[7].resourceVersionIds,
      competencyIds: units[7].competencyIds,
      provenanceEvidenceIds: [programEvidenceId],
    },
  ],
  competencies,
  competencyMappings: competencies.flatMap((competency, index) => [
    {
      id: `cpm_spreadsheets_course_${String(index + 1).padStart(2, "0")}` as const,
      competencyId: competency.id,
      subject: { kind: "courseVersion" as const, id: COURSE_VERSION_ID },
      relationship: "develops" as const,
      targetLevel: "applied" as const,
    },
    {
      id: `cpm_spreadsheets_capstone_${String(index + 1).padStart(2, "0")}` as const,
      competencyId: competency.id,
      subject: {
        kind: "assessmentVersion" as const,
        id: "asv_spreadsheets_capstone_2026_1",
      },
      relationship: "demonstrates" as const,
      targetLevel: "applied" as const,
    },
  ]),
  concentrations: [],
  resources: resourceSeeds.map((resource) => ({
    id: resource.id,
    canonicalSlug: resource.slug,
    provider: resource.provider,
    kind: resource.kind,
    lifecycle: "active",
  })),
  resourceVersions: resourceSeeds.map((resource, index) => ({
    id: resourceVersion(resource.versionId),
    resourceId: resource.id,
    version: "1.0.0",
    status: "published",
    publishedAt: PUBLISHED_AT,
    title: resource.title,
    canonicalUrl: resource.url,
    language: "en",
    authors: [],
    provenanceEvidenceIds: [resourceEvidence[index].id],
  })),
  accessOffers: resourceSeeds.map((resource, index) => ({
    id: `acc_spreadsheets_${String(index + 1).padStart(2, "0")}`,
    resourceVersionId: resourceVersion(resource.versionId),
    type: "free",
    region: "Provider availability may vary",
    loginRequired: resource.id === "res_spreadsheets_google_sheets",
    checkedAt: PUBLISHED_AT,
    note: resource.note,
  })),
  rights: resourceSeeds.map((resource, index) => ({
    id: `rgt_spreadsheets_${String(index + 1).padStart(2, "0")}`,
    resourceVersionId: resourceVersion(resource.versionId),
    status: "link only",
    mayMirror: false,
    mayAdapt: false,
    evidenceIds: [resourceEvidence[index].id],
    note:
      "Course Atlas links to the official provider page and does not copy the instructional material.",
  })),
  freshness: resourceSeeds.map((resource, index) => ({
    id: `frs_spreadsheets_${String(index + 1).padStart(2, "0")}`,
    resourceVersionId: resourceVersion(resource.versionId),
    status: "healthy",
    checkedAt: PUBLISHED_AT,
    httpStatus: 200,
    resolvedUrl: resource.url,
  })),
  provenance: [
    {
      id: programEvidenceId,
      kind: "editorial review",
      sourceTitle: "Official spreadsheet learning documentation review",
      sourceUrl:
        "https://support.microsoft.com/en-us/office/excel-video-training-9bc05390-e94c-46af-a5b3-d7c22f6990bb",
      retrievedAt: PUBLISHED_AT,
      subjects: [
        { kind: "programVersion", id: PROGRAM_VERSION_ID },
        ...competencies.map((competency) => ({
          kind: "competency" as const,
          id: competency.id,
        })),
        {
          kind: "courseVersion",
          id: COURSE_VERSION_ID,
        },
        {
          kind: "assessmentVersion",
          id: "asv_spreadsheets_reconciliation_2026_1",
        },
        {
          kind: "assessmentVersion",
          id: "asv_spreadsheets_capstone_2026_1",
        },
      ],
      note:
        "Course sequence authored from official, free-to-read provider documentation and reviewed for platform/feature caveats.",
    },
    ...resourceEvidence,
  ],
  calendars: [
    {
      id: "cal_spreadsheets_eight_week",
      title: "Eight-week applied sprint",
      structure: "weeks",
      periods: [
        {
          id: "per_spreadsheets_sprint",
          order: 1,
          label: "Eight-week sprint",
        },
      ],
      milestones: [
        {
          id: "mil_spreadsheets_reconciliation",
          label: "Reconciliation checkpoint",
          periodId: "per_spreadsheets_sprint",
          kind: "checkpoint",
        },
        {
          id: "mil_spreadsheets_capstone",
          label: "Decision-workbook defense",
          periodId: "per_spreadsheets_sprint",
          kind: "project",
        },
      ],
    },
  ],
  schedules: [
    {
      id: "sch_spreadsheets_eight_week",
      programVersionId: PROGRAM_VERSION_ID,
      calendarId: "cal_spreadsheets_eight_week",
      title: "Eight-week self-directed schedule",
      placements: [
        {
          id: "plc_spreadsheets_course",
          subject: { kind: "courseVersion", id: COURSE_VERSION_ID },
          order: 1,
          periodId: "per_spreadsheets_sprint",
        },
        ...units.map((unit, index) => ({
          id: `plc_spreadsheets_unit_${String(index + 1).padStart(2, "0")}` as const,
          subject: { kind: "learningUnit" as const, id: unit.id },
          order: index + 2,
          periodId: "per_spreadsheets_sprint" as const,
          note: unit.label,
        })),
      ],
    },
  ],
} satisfies PublishedProgramBundle);
