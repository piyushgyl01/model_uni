import type {
  AccessOfferId,
  AssessmentId,
  AssessmentVersionId,
  BundleId,
  CalendarId,
  CalendarMilestoneId,
  CalendarPeriodId,
  CompetencyId,
  CompetencyMappingId,
  ConcentrationId,
  CourseId,
  CourseVersionId,
  FreshnessRecordId,
  LearningUnitId,
  ProgramId,
  ProgramVersionId,
  ProvenanceEvidenceId,
  RequirementGroupId,
  RequirementOptionId,
  ResourceId,
  ResourceVersionId,
  RightsRecordId,
  ScheduleId,
  SchedulePlacementId,
} from "../../app/domain/catalog";

type ComputerScienceCourseIdentity = {
  readonly courseId: CourseId;
  readonly courseVersionId: CourseVersionId;
  readonly learningUnitIds: Readonly<Record<string, LearningUnitId>>;
  readonly assessmentIds: Readonly<Record<"applied" | "final", AssessmentId>>;
  readonly assessmentVersionIds: Readonly<
    Record<"applied" | "final", AssessmentVersionId>
  >;
  readonly resourceId: ResourceId;
  readonly resourceVersionId: ResourceVersionId;
  readonly accessOfferId: AccessOfferId;
  readonly rightsRecordId: RightsRecordId;
  readonly freshnessRecordId: FreshnessRecordId;
  readonly provenanceEvidenceId: ProvenanceEvidenceId;
  readonly requirementOptionId: RequirementOptionId;
  readonly schedulePlacementId: SchedulePlacementId;
  readonly competencyMappingIds: Readonly<Record<string, CompetencyMappingId>>;
  readonly finalAssessmentMappingId: CompetencyMappingId;
};

type ComputerScienceIdentityManifest = {
  readonly bundleId: BundleId;
  readonly programId: ProgramId;
  readonly programVersionId: ProgramVersionId;
  readonly programProvenanceEvidenceId: ProvenanceEvidenceId;
  readonly requirementGroupIds: Readonly<Record<string, RequirementGroupId>>;
  readonly concentrationIds: Readonly<Record<string, ConcentrationId>>;
  readonly competencyIds: Readonly<Record<string, CompetencyId>>;
  readonly programCompetencyMappingIds: Readonly<
    Record<string, CompetencyMappingId>
  >;
  readonly calendar: {
    readonly id: CalendarId;
    readonly scheduleId: ScheduleId;
    readonly periodIds: Readonly<Record<string, CalendarPeriodId>>;
    readonly milestoneIds: Readonly<Record<string, CalendarMilestoneId>>;
  };
  readonly courses: Readonly<Record<string, ComputerScienceCourseIdentity>>;
};

/**
 * Opaque public identities for the immutable Computer Science publication.
 *
 * Descriptive object keys are editorial lookup keys only. Every public ID is a
 * type-prefixed UUIDv7 literal assigned exactly once in this manifest; content
 * builders must reference these values and never synthesize an identity.
 */
export const computerScienceIdentities = {
  "bundleId": "bnd_019fab2b-c400-7b9d-97af-bf35dad278eb",
  "programId": "prg_019fab2b-c401-7277-90e3-350c6848e164",
  "programVersionId": "prv_019fab2b-c402-7cc7-b8a3-68801ab53820",
  "programProvenanceEvidenceId": "prvdc_019fab2b-c403-73c1-9cea-c71f42d574ca",
  "requirementGroupIds": {
    "term-1": "req_019fab2b-c404-7a39-a0d0-9531b74f50e8",
    "term-2": "req_019fab2b-c405-7312-a7d9-f572086bc6a2",
    "term-3": "req_019fab2b-c406-708d-af43-876bd4300a88",
    "term-4": "req_019fab2b-c407-7202-a14f-3887dbd0753f",
    "term-5": "req_019fab2b-c408-7a01-aa2a-f423cea02173",
    "term-6": "req_019fab2b-c409-7544-9bfd-81b1f6e924c9",
    "concentration": "req_019fab2b-c40a-7678-9821-d4cd6824c9ba"
  },
  "concentrationIds": {
    "intelligent-systems": "con_019fab2b-c40b-71ef-b3f1-ddec39366c85",
    "scalable-secure-systems": "con_019fab2b-c40c-7176-b0ac-1c8e0e14b535",
    "interactive-applications": "con_019fab2b-c40d-7fb5-97d2-4a11041afb35"
  },
  "competencyIds": {
    "programming": "cmp_019fab2b-c40e-7cd5-a315-82f4d72af42b",
    "algorithms": "cmp_019fab2b-c40f-7352-8025-d73f0fe07534",
    "mathematics": "cmp_019fab2b-c410-7910-a43c-7a537fa38c24",
    "systems": "cmp_019fab2b-c411-746c-a17f-7ef2e0a2d150",
    "data": "cmp_019fab2b-c412-77e7-853f-902c96dde3cc",
    "networks": "cmp_019fab2b-c413-795f-ad1a-986864e5c331",
    "software": "cmp_019fab2b-c414-7aa7-ba41-00cb129dfc97",
    "security": "cmp_019fab2b-c415-7876-b1f2-2a1b1f376fff",
    "ai-data": "cmp_019fab2b-c416-7884-a423-1d13e1243e4b",
    "human-centered": "cmp_019fab2b-c417-7d7c-a713-c6ecfa559015",
    "ethics": "cmp_019fab2b-c418-70bb-853c-3817cfc12248",
    "professional": "cmp_019fab2b-c419-778a-8ddf-156aa8d992b9",
    "research": "cmp_019fab2b-c41a-7024-8e7b-8c3b0a9b3fcd",
    "capstone": "cmp_019fab2b-c41b-73e8-9c48-2fd3eba6f522",
    "theory": "cmp_019fab2b-c41c-775a-807c-b46c1c275d33",
    "graphics": "cmp_019fab2b-c41d-75e7-a647-df63a1ab86db"
  },
  "programCompetencyMappingIds": {
    "programming": "cpm_019fab2b-c41e-798c-aee7-5a959d3a4147",
    "algorithms": "cpm_019fab2b-c41f-71d9-a669-1b5916ec91f4",
    "mathematics": "cpm_019fab2b-c420-78ea-8461-7856fe29ef90",
    "systems": "cpm_019fab2b-c421-7dfa-aae6-52f15da9c009",
    "data": "cpm_019fab2b-c422-71d8-a4e7-e00705251f4e",
    "networks": "cpm_019fab2b-c423-7996-906f-1e04d31955c5",
    "software": "cpm_019fab2b-c424-7aec-9621-5a7b18a5a581",
    "security": "cpm_019fab2b-c425-78e2-b46f-1ae1f8f6244d",
    "ai-data": "cpm_019fab2b-c426-7269-b78b-05007c0a2b2b",
    "human-centered": "cpm_019fab2b-c427-7255-8470-d70d09114094",
    "ethics": "cpm_019fab2b-c428-7237-a7c6-6339d1c59cf8",
    "professional": "cpm_019fab2b-c429-754d-b67d-4658105ab85f",
    "research": "cpm_019fab2b-c42a-723d-9a5c-6e4b619d921b",
    "capstone": "cpm_019fab2b-c42b-7fff-971a-ace58c46b9b6",
    "theory": "cpm_019fab2b-c42c-7db5-9e14-e444e2d208e1",
    "graphics": "cpm_019fab2b-c42d-7777-8e75-72ae59c55de2"
  },
  "calendar": {
    "id": "cal_019fab2b-c42e-7dfc-b7e4-6c38ac423103",
    "scheduleId": "sch_019fab2b-c42f-7432-b8d9-7055def890f3",
    "periodIds": {
      "term-1": "per_019fab2b-c430-759a-a859-4613a8df0dd4",
      "term-2": "per_019fab2b-c431-7976-ad34-e06983b26654",
      "term-3": "per_019fab2b-c432-75b2-b5c9-63cf92488f9b",
      "term-4": "per_019fab2b-c433-7e99-bd3d-fb7970ad2ff2",
      "term-5": "per_019fab2b-c434-746f-b438-623323de32ab",
      "term-6": "per_019fab2b-c435-7434-ae06-c5370a8dab5f"
    },
    "milestoneIds": {
      "term-1-midpoint": "mil_019fab2b-c436-7107-b186-bc8888741ab5",
      "term-1-final": "mil_019fab2b-c437-746c-b542-5f993c3c6dc7",
      "term-2-midpoint": "mil_019fab2b-c438-7713-8226-d371012ee6ce",
      "term-2-final": "mil_019fab2b-c439-7ab2-b8b7-4083463b2f5e",
      "term-3-midpoint": "mil_019fab2b-c43a-7b57-ae2c-a3ae4c4e5f61",
      "term-3-final": "mil_019fab2b-c43b-7738-8ef5-96344a387315",
      "term-4-midpoint": "mil_019fab2b-c43c-7c0f-a34e-89fda57eeffc",
      "term-4-final": "mil_019fab2b-c43d-7e02-adf6-56872099bb19",
      "term-5-midpoint": "mil_019fab2b-c43e-7fb4-899e-aedaa07ffdfb",
      "term-5-final": "mil_019fab2b-c43f-7a5c-beac-49b6f8bf7463",
      "term-6-midpoint": "mil_019fab2b-c440-7fda-994d-c3fdc5ffefd5",
      "term-6-final": "mil_019fab2b-c441-778c-8193-c2fd749c533b"
    }
  },
  "courses": {
    "programming-1": {
      "courseId": "crs_019fab2b-c442-72ff-bedc-74c51ec2c9bc",
      "courseVersionId": "crv_019fab2b-c443-7f18-a42e-2991433c6aa8",
      "learningUnitIds": {
        "functions-variables-and-expressions": "unt_019fab2b-c444-746f-8d31-1e0609488c43",
        "conditionals-and-boolean-reasoning": "unt_019fab2b-c445-7f08-850d-3795dee04b5d",
        "loops-invariants-and-iteration": "unt_019fab2b-c446-719e-b54d-17fa6fb14830",
        "exceptions-and-systematic-debugging": "unt_019fab2b-c447-7891-8c90-0e67ee4322d7",
        "libraries-apis-and-dependency-choices": "unt_019fab2b-c448-7610-8643-2c0548af1883",
        "unit-tests-and-test-design": "unt_019fab2b-c449-7ebf-b4bd-f964fc4d48ab",
        "files-regular-expressions-and-data-validation": "unt_019fab2b-c44a-7dbc-9eb5-ff31f7e722fc",
        "classes-composition-and-a-final-python-application": "unt_019fab2b-c44b-7751-ba91-2ffcfe0668ce"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c44c-7fce-9a1a-d7cf5f473100",
        "final": "asm_019fab2b-c44d-74fe-8d0f-883e655138f6"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c44e-76f0-9974-11b13de990c9",
        "final": "asv_019fab2b-c44f-7759-bdb1-15587c44919f"
      },
      "resourceId": "res_019fab2b-c450-7c69-9704-aec2cb511433",
      "resourceVersionId": "rsv_019fab2b-c451-754f-a988-b8ea1a94e6ae",
      "accessOfferId": "acc_019fab2b-c452-7091-8709-d9707624c922",
      "rightsRecordId": "rgt_019fab2b-c453-75cc-b761-4719d11ecfde",
      "freshnessRecordId": "frs_019fab2b-c454-782e-9362-1afb1d6e27a1",
      "provenanceEvidenceId": "prvdc_019fab2b-c455-7321-9918-1fe24082cc67",
      "requirementOptionId": "opt_019fab2b-c456-712c-8706-d827cd6f6ade",
      "schedulePlacementId": "plc_019fab2b-c457-7b4d-931a-7d0164a9f607",
      "competencyMappingIds": {
        "programming": "cpm_019fab2b-c458-77c7-a45b-b0049dd97ac1",
        "software": "cpm_019fab2b-c459-748f-a12a-2fec1c530092"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c45a-7030-ae0f-954bc7c736fd"
    },
    "discrete-mathematics": {
      "courseId": "crs_019fab2b-c45b-73e6-924f-2748c9ef71b0",
      "courseVersionId": "crv_019fab2b-c45c-73c0-82c7-1bf66d19cefd",
      "learningUnitIds": {
        "propositions-predicates-and-proof-structure": "unt_019fab2b-c45d-779b-943a-e4bbd938ba2a",
        "sets-functions-relations-and-induction": "unt_019fab2b-c45e-7e4b-b0f0-e35f885b3959",
        "strong-induction-and-recursive-definitions": "unt_019fab2b-c45f-79c5-9784-1a680641a278",
        "graphs-trees-and-graph-invariants": "unt_019fab2b-c460-755c-b5d5-da71d7183f73",
        "state-machines-and-invariants": "unt_019fab2b-c461-7297-86d2-81e0dc83e2b0",
        "number-theory-and-modular-arithmetic": "unt_019fab2b-c462-712c-9f2b-9f19de907ed2",
        "counting-recurrences-and-asymptotics": "unt_019fab2b-c463-7c4d-b33a-ecda1d02dc88",
        "discrete-probability-and-cumulative-proof-practice": "unt_019fab2b-c464-7109-bd1d-d21d9e5b53bd"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c465-7cc5-b091-966ec63258ec",
        "final": "asm_019fab2b-c466-7e1d-b9c7-0804ff862037"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c467-7791-8f43-97466ccbbd56",
        "final": "asv_019fab2b-c468-7099-a06f-8098fc64437d"
      },
      "resourceId": "res_019fab2b-c469-71df-bd2a-096d9fb5380d",
      "resourceVersionId": "rsv_019fab2b-c46a-7218-9b24-3190447f086a",
      "accessOfferId": "acc_019fab2b-c46b-7de8-83f1-fe4e6130641b",
      "rightsRecordId": "rgt_019fab2b-c46c-78dc-993f-1ef49c73274a",
      "freshnessRecordId": "frs_019fab2b-c46d-7101-bcce-875c108ec30d",
      "provenanceEvidenceId": "prvdc_019fab2b-c46e-763c-b4e7-6b6e4c8764d7",
      "requirementOptionId": "opt_019fab2b-c46f-7c18-a4cf-3fc4c6fbb538",
      "schedulePlacementId": "plc_019fab2b-c470-716d-87d7-8276b3d7bcea",
      "competencyMappingIds": {
        "mathematics": "cpm_019fab2b-c471-7f17-8ce4-9565f1144720",
        "algorithms": "cpm_019fab2b-c472-7703-bf19-5aac03815d10"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c473-7399-9737-f5b2ac79786d"
    },
    "calculus": {
      "courseId": "crs_019fab2b-c474-7810-854a-8d01d70a67db",
      "courseVersionId": "crv_019fab2b-c475-7aa5-969d-7aad32b56df6",
      "learningUnitIds": {
        "functions-limits-and-continuity": "unt_019fab2b-c476-7e2f-ba53-09904070a1c0",
        "derivatives-from-definitions-and-rules": "unt_019fab2b-c477-7520-9ca3-d4dedbef720a",
        "linearization-and-numerical-approximation": "unt_019fab2b-c478-7b5a-9f2a-a82dc861535c",
        "optimization-and-related-rates": "unt_019fab2b-c479-7368-a67d-703e3bf0bb6e",
        "definite-integrals-and-accumulation": "unt_019fab2b-c47a-7867-bcda-43a26cf87130",
        "the-fundamental-theorem-and-applications": "unt_019fab2b-c47b-72cd-b264-c16732a4a625",
        "integration-methods-and-differential-models": "unt_019fab2b-c47c-7c49-904c-bf4d62f8f95b",
        "taylor-series-error-and-cumulative-modeling": "unt_019fab2b-c47d-717a-b947-46e75f54b731"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c47e-7c3e-b044-46b85c9fea44",
        "final": "asm_019fab2b-c47f-7521-aa78-66d689b44701"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c480-7152-8682-3f03dadba77d",
        "final": "asv_019fab2b-c481-7e44-a4f7-729a46b80bbe"
      },
      "resourceId": "res_019fab2b-c482-7bb1-994c-0a98fc9431ee",
      "resourceVersionId": "rsv_019fab2b-c483-7f5c-abef-7c7a1e2956ba",
      "accessOfferId": "acc_019fab2b-c484-7e87-9ae3-33325bf2794d",
      "rightsRecordId": "rgt_019fab2b-c485-77c7-8c18-f60583ed72c4",
      "freshnessRecordId": "frs_019fab2b-c486-77d2-af55-072d36b2a34e",
      "provenanceEvidenceId": "prvdc_019fab2b-c487-77a3-8555-4594bebc556a",
      "requirementOptionId": "opt_019fab2b-c488-71e7-abfb-4b81a7cb5250",
      "schedulePlacementId": "plc_019fab2b-c489-7d75-97d0-c09e9e9e68ce",
      "competencyMappingIds": {
        "mathematics": "cpm_019fab2b-c48a-7d15-b7fe-848fbd7407b4"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c48b-7991-a04d-948dc33d6a95"
    },
    "systems-foundations": {
      "courseId": "crs_019fab2b-c48c-7647-aa90-6fde4bf77f19",
      "courseVersionId": "crv_019fab2b-c48d-7712-ba21-dc61ddfa3d78",
      "learningUnitIds": {
        "computational-thinking-and-c-toolchains": "unt_019fab2b-c48e-7d61-9a41-6c56f02ede79",
        "c-control-flow-functions-and-compilation": "unt_019fab2b-c48f-7ffa-b965-2da46b119109",
        "arrays-strings-and-data-representation": "unt_019fab2b-c490-7e14-b450-801c14735182",
        "algorithmic-costs-and-empirical-measurement": "unt_019fab2b-c491-733b-8242-aa62c5683343",
        "pointers-memory-layout-and-allocation": "unt_019fab2b-c492-7411-9fd0-a543695a4b48",
        "linked-structures-and-memory-safety": "unt_019fab2b-c493-7149-93fa-42f820769696",
        "sql-and-durable-data": "unt_019fab2b-c494-7a8a-9340-3a823476a0b5",
        "systems-integration-and-a-cumulative-c-build": "unt_019fab2b-c495-7d56-8b55-5d1d65a0ac1b"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c496-75f8-aa24-a5f2b1ae62e6",
        "final": "asm_019fab2b-c497-7354-8ad3-8653d7651cec"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c498-747f-a738-ba88eb1fca1c",
        "final": "asv_019fab2b-c499-7a0a-9074-6d13311e4711"
      },
      "resourceId": "res_019fab2b-c49a-72ba-ab75-91c33a2b26d8",
      "resourceVersionId": "rsv_019fab2b-c49b-75e2-9cf4-291e3b16220c",
      "accessOfferId": "acc_019fab2b-c49c-7041-a846-c57abfedd3fe",
      "rightsRecordId": "rgt_019fab2b-c49d-7543-99bc-35497bcae7f1",
      "freshnessRecordId": "frs_019fab2b-c49e-73e5-9633-ec9f1bd39398",
      "provenanceEvidenceId": "prvdc_019fab2b-c49f-712a-90a0-e8968f4627eb",
      "requirementOptionId": "opt_019fab2b-c4a0-7f9a-a218-00cdced269b5",
      "schedulePlacementId": "plc_019fab2b-c4a1-722f-a56a-c1d477140f28",
      "competencyMappingIds": {
        "programming": "cpm_019fab2b-c4a2-730e-b1a3-2b4986198ef1",
        "systems": "cpm_019fab2b-c4a3-763e-a5c2-7f2bc536b01f"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c4a4-719d-8a53-9d9939eb7e90"
    },
    "technical-communication": {
      "courseId": "crs_019fab2b-c4a5-7339-8ee9-a8eeea3a194c",
      "courseVersionId": "crv_019fab2b-c4a6-7726-995d-f627fe519501",
      "learningUnitIds": {
        "audience-purpose-and-scope": "unt_019fab2b-c4a7-7085-a503-007f33e08bd0",
        "terminology-active-voice-and-clear-sentences": "unt_019fab2b-c4a8-7c94-87c7-26059e9bd8d0",
        "paragraphs-lists-and-information-hierarchy": "unt_019fab2b-c4a9-7faf-ab45-b26bd4739c08",
        "procedures-examples-and-reproducible-instructions": "unt_019fab2b-c4aa-7687-b651-98ec7cd78ca2",
        "markdown-code-samples-and-document-tooling": "unt_019fab2b-c4ab-76b8-82df-c2219b02e5aa",
        "diagrams-tables-captions-and-accessibility": "unt_019fab2b-c4ac-7a2e-bc39-c98605492726",
        "source-evaluation-citation-and-uncertainty": "unt_019fab2b-c4ad-7a71-807a-e7d100eb1326",
        "peer-review-and-a-polished-technical-guide": "unt_019fab2b-c4ae-7c87-8414-a564b4fd1ab8"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4af-7a35-b862-61e8d709888c",
        "final": "asm_019fab2b-c4b0-7c93-a79a-f267382d0dc3"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c4b1-7356-94fb-fe1752c3aa20",
        "final": "asv_019fab2b-c4b2-7f1c-a47d-f318b0536627"
      },
      "resourceId": "res_019fab2b-c4b3-78be-b972-decf757cc45b",
      "resourceVersionId": "rsv_019fab2b-c4b4-7959-b12e-d3125ee9e95b",
      "accessOfferId": "acc_019fab2b-c4b5-7118-a196-45f185efe01b",
      "rightsRecordId": "rgt_019fab2b-c4b6-7270-a1cc-806b414c85c1",
      "freshnessRecordId": "frs_019fab2b-c4b7-787d-bf8d-e94fa1e70e2b",
      "provenanceEvidenceId": "prvdc_019fab2b-c4b8-74b8-81ec-5e8a33e0c07a",
      "requirementOptionId": "opt_019fab2b-c4b9-7e0f-b52e-0ce64d55eac9",
      "schedulePlacementId": "plc_019fab2b-c4ba-7a4e-9d3e-082c2a289b9b",
      "competencyMappingIds": {
        "professional": "cpm_019fab2b-c4bb-7f37-b79d-013437996137",
        "software": "cpm_019fab2b-c4bc-74ad-abab-6ddbd2a01a0d"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c4bd-77aa-b7d3-2b788fe069a1"
    },
    "data-structures": {
      "courseId": "crs_019fab2b-c4be-7272-b165-81cfe51a2eea",
      "courseVersionId": "crv_019fab2b-c4bf-7839-9360-5bac136c64fb",
      "learningUnitIds": {
        "interfaces-abstraction-and-asymptotic-cost": "unt_019fab2b-c4c0-7928-a328-81aa46dfc0e6",
        "arrays-linked-lists-stacks-and-queues": "unt_019fab2b-c4c1-7043-b10a-452c44f7767e",
        "testing-invariants-and-encapsulation": "unt_019fab2b-c4c2-70af-8183-b2df849fcec8",
        "hash-tables-and-collision-strategies": "unt_019fab2b-c4c3-74de-b1b5-5d363eeba2a4",
        "trees-traversals-and-search-trees": "unt_019fab2b-c4c4-7465-9f51-5c75a7b6f9b5",
        "priority-queues-heaps-and-disjoint-sets": "unt_019fab2b-c4c5-7a5c-b2be-38477cb0a061",
        "graphs-and-graph-representations": "unt_019fab2b-c4c6-7da5-b582-f1570daaf26b",
        "sorting-amortized-analysis-and-a-data-structure-library": "unt_019fab2b-c4c7-7c7c-b6a1-964e44e149e6"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4c8-7475-a13e-9660737ffa3b",
        "final": "asm_019fab2b-c4c9-7548-9bb6-f1d9e27ec982"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c4ca-7e5a-b90f-1682f4b89e32",
        "final": "asv_019fab2b-c4cb-7399-812c-80f869937064"
      },
      "resourceId": "res_019fab2b-c4cc-7207-8670-7974a6ce4b7c",
      "resourceVersionId": "rsv_019fab2b-c4cd-70b9-b9ff-ee1a8ad43fb1",
      "accessOfferId": "acc_019fab2b-c4ce-78ed-809e-db41114c9bbe",
      "rightsRecordId": "rgt_019fab2b-c4cf-70ba-ac21-b45d8eaa2464",
      "freshnessRecordId": "frs_019fab2b-c4d0-7904-9477-e45acbc4b408",
      "provenanceEvidenceId": "prvdc_019fab2b-c4d1-7c61-9485-46a1395cd783",
      "requirementOptionId": "opt_019fab2b-c4d2-7187-9f2d-afc2b9301a1c",
      "schedulePlacementId": "plc_019fab2b-c4d3-7be0-a598-bdef259fb52c",
      "competencyMappingIds": {
        "programming": "cpm_019fab2b-c4d4-77c2-b3b2-b384f734946f",
        "algorithms": "cpm_019fab2b-c4d5-72b2-9171-d0889437c60e"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c4d6-7f4f-a8e1-852ab795009b"
    },
    "computer-architecture": {
      "courseId": "crs_019fab2b-c4d7-795d-9d11-a7bee38bfa12",
      "courseVersionId": "crv_019fab2b-c4d8-7295-8844-3dfa832240e8",
      "learningUnitIds": {
        "boolean-functions-and-elementary-logic-gates": "unt_019fab2b-c4d9-7d9e-aa4e-cbbbb37e9844",
        "adders-alus-and-combinational-chips": "unt_019fab2b-c4da-7c84-92ae-b69a449095ff",
        "registers-memory-and-sequential-logic": "unt_019fab2b-c4db-7438-80f6-f3fd0881f536",
        "machine-language-and-instruction-set-design": "unt_019fab2b-c4dc-7253-86cb-896a61794552",
        "cpu-and-computer-integration": "unt_019fab2b-c4dd-7200-8eb5-8e9ee458d48b",
        "assembler-design-and-implementation": "unt_019fab2b-c4de-73c8-a8c4-af20565dbff6",
        "virtual-machines-parsing-and-code-generation": "unt_019fab2b-c4df-799c-8342-877401d1a32e",
        "operating-system-services-and-full-stack-demonstration": "unt_019fab2b-c4e0-7192-8009-22bb88e27f29"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4e1-782a-8bf9-8a0519c64437",
        "final": "asm_019fab2b-c4e2-7d49-83e9-5109b953311e"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c4e3-74f0-b40d-2ec7007c35a0",
        "final": "asv_019fab2b-c4e4-707e-862b-36b6f4cd7c5f"
      },
      "resourceId": "res_019fab2b-c4e5-77f1-9db1-dfa6a38690a9",
      "resourceVersionId": "rsv_019fab2b-c4e6-78fe-acae-5c19591ef1df",
      "accessOfferId": "acc_019fab2b-c4e7-77aa-b6fe-c4f46152c9da",
      "rightsRecordId": "rgt_019fab2b-c4e8-7eef-813e-3f729df2841b",
      "freshnessRecordId": "frs_019fab2b-c4e9-7357-b188-b32a828ff005",
      "provenanceEvidenceId": "prvdc_019fab2b-c4ea-7c69-9132-e971ce9f99a1",
      "requirementOptionId": "opt_019fab2b-c4eb-7955-a323-1ca5b9e0b84a",
      "schedulePlacementId": "plc_019fab2b-c4ec-7ab6-ad8f-d40676419f4b",
      "competencyMappingIds": {
        "systems": "cpm_019fab2b-c4ed-7f2c-9f03-4fa50d58dd97"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c4ee-7fa7-a266-2326d61f628a"
    },
    "linear-algebra": {
      "courseId": "crs_019fab2b-c4ef-74cb-a6b1-ca34680b5b26",
      "courseVersionId": "crv_019fab2b-c4f0-782f-9f2c-cd87245780df",
      "learningUnitIds": {
        "linear-systems-and-elimination": "unt_019fab2b-c4f1-7b7c-8105-31d782fe72b6",
        "matrix-operations-inverses-and-factorization": "unt_019fab2b-c4f2-79e0-92c8-1da9d22b9379",
        "vector-spaces-subspaces-and-basis": "unt_019fab2b-c4f3-7809-99ee-3be3ecd42526",
        "orthogonality-and-least-squares": "unt_019fab2b-c4f4-7a7e-a9a4-2609b858bfde",
        "determinants-and-volume": "unt_019fab2b-c4f5-7620-952a-02acd069aba9",
        "eigenvalues-and-eigenvectors": "unt_019fab2b-c4f6-73b0-9206-5d155ab2c555",
        "singular-values-and-low-rank-approximation": "unt_019fab2b-c4f7-79f9-a15f-afd9cc7f37b5",
        "numerical-linear-algebra-in-a-computing-application": "unt_019fab2b-c4f8-7454-8972-e6add25038d0"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4f9-7504-bf7c-4a23443fbb3e",
        "final": "asm_019fab2b-c4fa-7583-85a4-1223460e94cc"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c4fb-78fd-aca7-bf45b6aa94fe",
        "final": "asv_019fab2b-c4fc-7c9b-b057-7adde98e9466"
      },
      "resourceId": "res_019fab2b-c4fd-7634-9b56-89bffd22466d",
      "resourceVersionId": "rsv_019fab2b-c4fe-7883-b588-2f2bb668906c",
      "accessOfferId": "acc_019fab2b-c4ff-79eb-b0e2-499089e75abd",
      "rightsRecordId": "rgt_019fab2b-c500-7a73-a818-a4ac4a1156c9",
      "freshnessRecordId": "frs_019fab2b-c501-7634-b190-21f926ced1fe",
      "provenanceEvidenceId": "prvdc_019fab2b-c502-7596-974c-e51098cccf05",
      "requirementOptionId": "opt_019fab2b-c503-76c4-9e69-0079e7589b70",
      "schedulePlacementId": "plc_019fab2b-c504-7cfa-b496-87edf61e9d01",
      "competencyMappingIds": {
        "mathematics": "cpm_019fab2b-c505-74b8-9fed-1d0a1e79e493",
        "ai-data": "cpm_019fab2b-c506-7d28-8879-4989ae768e43"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c507-76ff-9b1e-a3e5aa153a48"
    },
    "probability": {
      "courseId": "crs_019fab2b-c508-7e77-a932-c251d06e112f",
      "courseVersionId": "crv_019fab2b-c509-7853-8f75-7dc1ec0ed58d",
      "learningUnitIds": {
        "counting-and-probability-spaces": "unt_019fab2b-c50a-722d-8e85-800cfb2cc401",
        "conditional-probability-and-bayes-rule": "unt_019fab2b-c50b-7fa5-a374-bde7de136bc7",
        "independence-and-probabilistic-reasoning": "unt_019fab2b-c50c-7fbb-b9ad-f4599dba2bd4",
        "discrete-random-variables-and-expectation": "unt_019fab2b-c50d-7a8d-90a9-4d4a8568fb22",
        "continuous-distributions-and-transformations": "unt_019fab2b-c50e-79fc-a816-251db18205a7",
        "joint-distributions-covariance-and-conditioning": "unt_019fab2b-c50f-7bf1-80c5-796a2ec66f87",
        "law-of-large-numbers-and-central-limit-behavior": "unt_019fab2b-c510-73bd-8ad0-bbfdc40f50db",
        "simulation-estimation-and-a-cumulative-probability-model": "unt_019fab2b-c511-7efe-8fe4-f77fd926ce66"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c512-72c5-9225-153c595a83f1",
        "final": "asm_019fab2b-c513-796f-8ec1-00974c2ad8a6"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c514-79e0-b531-e7cfaa85818e",
        "final": "asv_019fab2b-c515-76d7-978d-c41472627341"
      },
      "resourceId": "res_019fab2b-c516-73b4-931a-3e2f5f7a9a50",
      "resourceVersionId": "rsv_019fab2b-c517-73b1-afa7-c5585ac1b28e",
      "accessOfferId": "acc_019fab2b-c518-742a-aa3c-2f878e713315",
      "rightsRecordId": "rgt_019fab2b-c519-7c37-a6f8-e598da6c1907",
      "freshnessRecordId": "frs_019fab2b-c51a-7dbd-ba3c-108751a8df67",
      "provenanceEvidenceId": "prvdc_019fab2b-c51b-78d1-9ff0-66dad4161ae5",
      "requirementOptionId": "opt_019fab2b-c51c-7653-a875-55ec3106f240",
      "schedulePlacementId": "plc_019fab2b-c51d-7012-bc92-3d440062053a",
      "competencyMappingIds": {
        "mathematics": "cpm_019fab2b-c51e-77d0-bd0e-526a94c2c384",
        "ai-data": "cpm_019fab2b-c51f-7b5b-8b9a-792af8cdabac"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c520-701c-8ab8-9499543d4dec"
    },
    "web-engineering": {
      "courseId": "crs_019fab2b-c521-7440-bc63-ab96a2b29eaa",
      "courseVersionId": "crv_019fab2b-c522-782c-bd54-ea681786a299",
      "learningUnitIds": {
        "web-standards-semantic-html-and-document-structure": "unt_019fab2b-c523-7413-b07e-12ba15a4769b",
        "css-layout-responsive-design-and-maintainability": "unt_019fab2b-c524-70b8-bf24-6f118100026c",
        "javascript-the-dom-and-event-driven-behavior": "unt_019fab2b-c525-78ae-a8ce-8d59ee427435",
        "forms-validation-accessibility-and-inclusive-interaction": "unt_019fab2b-c526-7bef-b392-f2fa77b83cd2",
        "http-fetch-apis-and-asynchronous-control-flow": "unt_019fab2b-c527-78c2-9790-16b2fec71cf4",
        "client-state-components-and-architecture": "unt_019fab2b-c528-779b-b459-789447dec584",
        "testing-security-basics-and-performance": "unt_019fab2b-c529-7e42-9f6f-df25e4d5f686",
        "deployment-observability-and-a-production-ready-application": "unt_019fab2b-c52a-783a-bb99-accb4cbb93bf"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c52b-76a7-89f0-bab68b27ede5",
        "final": "asm_019fab2b-c52c-7b2a-9ae7-2b4b6010a030"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c52d-7849-b79b-33ffb99005a5",
        "final": "asv_019fab2b-c52e-73e1-bac4-79845cb36586"
      },
      "resourceId": "res_019fab2b-c52f-773a-8708-3f479fbaa630",
      "resourceVersionId": "rsv_019fab2b-c530-763a-98be-6ddda73c67e4",
      "accessOfferId": "acc_019fab2b-c531-7472-a7dd-ae8c3116e817",
      "rightsRecordId": "rgt_019fab2b-c532-7f12-80d4-8b033d95ccea",
      "freshnessRecordId": "frs_019fab2b-c533-7a20-97e1-45d48f45d113",
      "provenanceEvidenceId": "prvdc_019fab2b-c534-7a1e-a58b-d04fa5aa28e3",
      "requirementOptionId": "opt_019fab2b-c535-762d-9249-0dd580ace2f9",
      "schedulePlacementId": "plc_019fab2b-c536-7d20-9c72-f64a9684423f",
      "competencyMappingIds": {
        "software": "cpm_019fab2b-c537-726f-9d6f-8de7e6d98353",
        "human-centered": "cpm_019fab2b-c538-7322-87f0-5efd237f1a98"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c539-7076-9244-b6add2255568"
    },
    "algorithms": {
      "courseId": "crs_019fab2b-c53a-7039-a729-40d905ed4fb1",
      "courseVersionId": "crv_019fab2b-c53b-7cc0-aaec-dc5cd7d08bf3",
      "learningUnitIds": {
        "computational-models-and-asymptotic-analysis": "unt_019fab2b-c53c-72a3-a5a1-9a74ab282aa2",
        "recurrences-divide-and-conquer-and-sorting": "unt_019fab2b-c53d-7b89-b7b6-3d5d66db3213",
        "hashing-and-randomized-algorithms": "unt_019fab2b-c53e-74f9-be6b-aaedfc781b57",
        "binary-search-trees-and-augmentation": "unt_019fab2b-c53f-7051-b301-6556dbf2c090",
        "breadth-first-and-depth-first-graph-search": "unt_019fab2b-c540-7318-bccb-0fd71b93dfb2",
        "shortest-paths-and-weighted-graphs": "unt_019fab2b-c541-777f-b185-ae7863cec5d9",
        "dynamic-programming-and-greedy-design": "unt_019fab2b-c542-724e-ac3a-4dfb45da2156",
        "complexity-evidence-and-a-cumulative-algorithm-portfolio": "unt_019fab2b-c543-7f83-a16f-c1a3064071e9"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c544-7e1f-a656-22f82bbfc417",
        "final": "asm_019fab2b-c545-702a-8b51-dc5278747b1b"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c546-749e-95af-713ed81d6d31",
        "final": "asv_019fab2b-c547-7819-8d41-9243ffcabda1"
      },
      "resourceId": "res_019fab2b-c548-75d0-af81-d4a71119e567",
      "resourceVersionId": "rsv_019fab2b-c549-7686-8955-8b7de436eca4",
      "accessOfferId": "acc_019fab2b-c54a-7d22-b0e3-d6f7f1161ba4",
      "rightsRecordId": "rgt_019fab2b-c54b-7a09-88de-47978d53aa08",
      "freshnessRecordId": "frs_019fab2b-c54c-7b1d-91f2-16084b1cf6b4",
      "provenanceEvidenceId": "prvdc_019fab2b-c54d-7561-a3ae-5c26bde95aa2",
      "requirementOptionId": "opt_019fab2b-c54e-76d9-88e7-62c9dbe70f5c",
      "schedulePlacementId": "plc_019fab2b-c54f-7249-a927-a1c7fca05686",
      "competencyMappingIds": {
        "algorithms": "cpm_019fab2b-c550-73e6-9bf9-ae56e43c1e2b",
        "mathematics": "cpm_019fab2b-c551-77ce-aa17-09c5fa449e49"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c552-7249-aec4-b53252197786"
    },
    "operating-systems": {
      "courseId": "crs_019fab2b-c553-7065-a127-30f3f4b4778a",
      "courseVersionId": "crv_019fab2b-c554-7420-a790-10939214a9a6",
      "learningUnitIds": {
        "processes-system-calls-and-direct-execution": "unt_019fab2b-c555-7e76-8268-b9cd03625413",
        "cpu-scheduling-and-measurable-policy-tradeoffs": "unt_019fab2b-c556-7c44-9b1b-6a3d8f60a5ca",
        "address-spaces-and-memory-apis": "unt_019fab2b-c557-7093-b8ec-2ba2d67eb14f",
        "paging-translation-and-virtual-memory": "unt_019fab2b-c558-764d-9f8d-2617d549862b",
        "threads-locks-condition-variables-and-semaphores": "unt_019fab2b-c559-7115-8999-3a05d1a85691",
        "concurrency-bugs-and-event-driven-systems": "unt_019fab2b-c55a-7b3d-928f-4b26ef9ecae7",
        "storage-devices-files-and-file-system-implementation": "unt_019fab2b-c55b-71ad-943c-404e762487fc",
        "persistence-integrity-protection-and-a-systems-lab": "unt_019fab2b-c55c-78a2-98b2-73e7feb5b119"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c55d-778d-aced-c91dc5632836",
        "final": "asm_019fab2b-c55e-783c-8f23-094d24c0731f"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c55f-747c-9f16-b6e5e3b34171",
        "final": "asv_019fab2b-c560-7689-911c-6f04c6ec9ac0"
      },
      "resourceId": "res_019fab2b-c561-7f4f-a217-4b2c64b0dec5",
      "resourceVersionId": "rsv_019fab2b-c562-771e-8b2d-669cec5aca68",
      "accessOfferId": "acc_019fab2b-c563-79ea-94dd-8e6b64847708",
      "rightsRecordId": "rgt_019fab2b-c564-7174-badf-ec7d6d1a429f",
      "freshnessRecordId": "frs_019fab2b-c565-77c6-be2d-3aaaf9c75193",
      "provenanceEvidenceId": "prvdc_019fab2b-c566-7f83-ae2b-8c215f870e48",
      "requirementOptionId": "opt_019fab2b-c567-7e6f-a899-0993c79b29d8",
      "schedulePlacementId": "plc_019fab2b-c568-7af7-9f2f-810c5239c064",
      "competencyMappingIds": {
        "systems": "cpm_019fab2b-c569-7d85-a6de-66af54a7baf2",
        "security": "cpm_019fab2b-c56a-742d-b0cd-409c6fac5f8a"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c56b-73e8-80f1-6de886ea6252"
    },
    "database-systems": {
      "courseId": "crs_019fab2b-c56c-71fc-ac7c-13007b3b8fff",
      "courseVersionId": "crv_019fab2b-c56d-7fca-a639-e3b0d11049c7",
      "learningUnitIds": {
        "data-models-relational-algebra-and-sql": "unt_019fab2b-c56e-7d9b-8784-0ccb3cd08cca",
        "schema-design-dependencies-and-normalization": "unt_019fab2b-c56f-7cf1-83ed-e9f408f5b45a",
        "storage-models-pages-and-buffer-pools": "unt_019fab2b-c570-7724-be0e-26df4da00e96",
        "indexes-trees-hashing-and-filters": "unt_019fab2b-c571-7ad6-8152-7ad933d51505",
        "query-execution-joins-sorting-and-aggregation": "unt_019fab2b-c572-7d16-bc76-72517486cac5",
        "query-planning-and-optimization": "unt_019fab2b-c573-773a-ae62-c3c5aac72f80",
        "transactions-and-concurrency-control": "unt_019fab2b-c574-7f52-9ac2-e08626b51512",
        "logging-recovery-and-a-database-implementation-review": "unt_019fab2b-c575-7651-99f1-09b6533259f8"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c576-7e33-bece-95adbd0948de",
        "final": "asm_019fab2b-c577-7f59-9724-83838f812526"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c578-7b2e-898f-b3cfc42c954b",
        "final": "asv_019fab2b-c579-712e-a745-9ee40c4bef24"
      },
      "resourceId": "res_019fab2b-c57a-7de1-ba70-05fcf53d9cad",
      "resourceVersionId": "rsv_019fab2b-c57b-7483-ba27-1288b19c59a9",
      "accessOfferId": "acc_019fab2b-c57c-746c-9e9b-bae2eee3b428",
      "rightsRecordId": "rgt_019fab2b-c57d-79c6-ab25-77c92ce51cec",
      "freshnessRecordId": "frs_019fab2b-c57e-73a1-a9ba-c1904f36589e",
      "provenanceEvidenceId": "prvdc_019fab2b-c57f-7356-afb6-5c1438b18702",
      "requirementOptionId": "opt_019fab2b-c580-76e1-8268-5fe79f8194b1",
      "schedulePlacementId": "plc_019fab2b-c581-73a9-b83d-fa6a8affee56",
      "competencyMappingIds": {
        "data": "cpm_019fab2b-c582-7a40-b0d0-70f4b787bfe2",
        "systems": "cpm_019fab2b-c583-7a43-9f00-91d6b114b532"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c584-7a19-a58d-b9e78da5299d"
    },
    "software-engineering": {
      "courseId": "crs_019fab2b-c585-70f0-9e8d-a58d3c812779",
      "courseVersionId": "crv_019fab2b-c586-7db2-9dc0-877d29e6e7d7",
      "learningUnitIds": {
        "software-engineering-over-time-and-scale": "unt_019fab2b-c587-7215-bf56-4c7f5d3e3c59",
        "team-culture-knowledge-sharing-and-ownership": "unt_019fab2b-c588-7cdb-b6b2-d61932046cf4",
        "style-readability-and-documentation": "unt_019fab2b-c589-79ae-8fd1-38338bd2a253",
        "testing-strategy-and-test-maintainability": "unt_019fab2b-c58a-72d5-90bb-f3f81c83a3f5",
        "dependency-management-apis-and-compatibility": "unt_019fab2b-c58b-7762-8559-4720bf5a8505",
        "version-control-code-review-and-change-management": "unt_019fab2b-c58c-7f3f-8490-2f096c32266d",
        "build-systems-continuous-integration-and-release": "unt_019fab2b-c58d-7f18-8dad-5440e9b4ba1c",
        "technical-debt-sustainability-and-a-maintained-team-system": "unt_019fab2b-c58e-70ac-914e-7e7f173843c5"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c58f-7f12-92e1-57ea27c1a733",
        "final": "asm_019fab2b-c590-73d2-9cc8-dabc34dd3f7d"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c591-71e8-a78e-247f3c1d8266",
        "final": "asv_019fab2b-c592-7498-967a-c21225027009"
      },
      "resourceId": "res_019fab2b-c593-7304-a707-ac55da0c3402",
      "resourceVersionId": "rsv_019fab2b-c594-7532-9109-3670a1305554",
      "accessOfferId": "acc_019fab2b-c595-754e-b1a4-2d34b7cf8dc3",
      "rightsRecordId": "rgt_019fab2b-c596-7b1d-b4fe-2161e7690aba",
      "freshnessRecordId": "frs_019fab2b-c597-76ad-bbcd-90d842791511",
      "provenanceEvidenceId": "prvdc_019fab2b-c598-73e2-a649-f5d192347cfe",
      "requirementOptionId": "opt_019fab2b-c599-78dc-9c22-20c541f6ef21",
      "schedulePlacementId": "plc_019fab2b-c59a-7bda-a758-e16956af1566",
      "competencyMappingIds": {
        "software": "cpm_019fab2b-c59b-7cc0-a584-2d7fa5140cff",
        "professional": "cpm_019fab2b-c59c-7f0f-b7bc-a475ce1f2e7f"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c59d-7658-af07-140cf4f9a667"
    },
    "computer-networks": {
      "courseId": "crs_019fab2b-c59e-7165-8905-451e48f0aade",
      "courseVersionId": "crv_019fab2b-c59f-7717-a3fc-fcc309e94a1f",
      "learningUnitIds": {
        "network-architecture-layering-and-packet-switching": "unt_019fab2b-c5a0-7cb4-be7b-3e446d8640e0",
        "application-protocols-naming-and-http": "unt_019fab2b-c5a1-7694-a210-f8de514e0e1e",
        "sockets-streams-and-network-programming": "unt_019fab2b-c5a2-7afd-af2d-895be2095a25",
        "reliable-byte-streams-and-retransmission": "unt_019fab2b-c5a3-7f3d-8bd1-f204501f642c",
        "ip-forwarding-addressing-and-routing": "unt_019fab2b-c5a4-7afb-84ac-be8153428ae0",
        "congestion-control-and-shared-capacity": "unt_019fab2b-c5a5-72d9-a0c1-816166134d51",
        "link-layers-local-networks-and-measurement": "unt_019fab2b-c5a6-7b6a-9dd5-115f0bf70136",
        "network-security-operations-and-a-transport-implementation": "unt_019fab2b-c5a7-7e52-9b53-c4d21da9b75e"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5a8-7002-be48-72d87dba301d",
        "final": "asm_019fab2b-c5a9-7e6b-a8f1-4f7ee5db1382"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c5aa-7647-b32d-8feb37c9d2ec",
        "final": "asv_019fab2b-c5ab-7389-bb81-fe5e32c3d675"
      },
      "resourceId": "res_019fab2b-c5ac-78c3-864d-96f58afac728",
      "resourceVersionId": "rsv_019fab2b-c5ad-7aab-b768-cb7ee930129e",
      "accessOfferId": "acc_019fab2b-c5ae-7f03-822b-372f1c24b0f2",
      "rightsRecordId": "rgt_019fab2b-c5af-7ca6-80c2-8bc74133bc15",
      "freshnessRecordId": "frs_019fab2b-c5b0-779a-9978-d7568a4811e7",
      "provenanceEvidenceId": "prvdc_019fab2b-c5b1-74a8-8610-4e7a75bb0576",
      "requirementOptionId": "opt_019fab2b-c5b2-7456-911c-da6ef6e4ca05",
      "schedulePlacementId": "plc_019fab2b-c5b3-7c05-a2b9-0524994f3f03",
      "competencyMappingIds": {
        "networks": "cpm_019fab2b-c5b4-72a9-a224-a79bc6042353",
        "systems": "cpm_019fab2b-c5b5-7652-91d9-66050f4e9f46"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c5b6-7f78-8d1e-64aee1b766a4"
    },
    "theory-of-computation": {
      "courseId": "crs_019fab2b-c5b7-718d-8e74-a564a52ac97d",
      "courseVersionId": "crv_019fab2b-c5b8-718b-b71e-8ef7ddee038a",
      "learningUnitIds": {
        "finite-automata-and-regular-languages": "unt_019fab2b-c5b9-799a-9383-cd99e740a1eb",
        "regular-expressions-closure-and-pumping-arguments": "unt_019fab2b-c5ba-7f9a-9892-93914ef2e297",
        "context-free-grammars-and-pushdown-automata": "unt_019fab2b-c5bb-7d66-89d7-4336de1a41e3",
        "turing-machines-and-recognizable-languages": "unt_019fab2b-c5bc-79ed-a559-2e7f97aa6b46",
        "decidability-and-undecidability": "unt_019fab2b-c5bd-7aa3-9e84-fde291ec41ac",
        "mapping-reductions-and-proof-technique": "unt_019fab2b-c5be-707b-ae7a-ade07356f936",
        "time-complexity-p-and-np": "unt_019fab2b-c5bf-7bfd-bf80-1b85019fbe20",
        "np-completeness-and-cumulative-theory-proofs": "unt_019fab2b-c5c0-7656-82dd-485703f66b3b"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5c1-7e75-a1fe-1eb18a5d632f",
        "final": "asm_019fab2b-c5c2-727f-bad9-a22d0b7cf173"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c5c3-7f8c-b75d-a04ad777b523",
        "final": "asv_019fab2b-c5c4-70b8-bb8d-46ca368a49cc"
      },
      "resourceId": "res_019fab2b-c5c5-7b6d-8659-61306df6234d",
      "resourceVersionId": "rsv_019fab2b-c5c6-7e8c-960f-fce20a6227f0",
      "accessOfferId": "acc_019fab2b-c5c7-70ce-8093-2affda1023e5",
      "rightsRecordId": "rgt_019fab2b-c5c8-7592-8b2e-70ac35dee039",
      "freshnessRecordId": "frs_019fab2b-c5c9-7226-bdd3-75ac9de30c46",
      "provenanceEvidenceId": "prvdc_019fab2b-c5ca-76e9-8ce3-33602e8fbc42",
      "requirementOptionId": "opt_019fab2b-c5cb-7c7d-94ed-dae68a10c289",
      "schedulePlacementId": "plc_019fab2b-c5cc-702b-8633-9302148bbc1e",
      "competencyMappingIds": {
        "theory": "cpm_019fab2b-c5cd-75b1-a23c-252aaaa18748",
        "mathematics": "cpm_019fab2b-c5ce-72e0-af33-9e206245f6e4"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c5cf-79eb-92e3-14a19ff424f0"
    },
    "programming-languages": {
      "courseId": "crs_019fab2b-c5d0-762f-bc5d-fa8dedd83206",
      "courseVersionId": "crv_019fab2b-c5d1-7858-bbb2-2710aae96665",
      "learningUnitIds": {
        "syntax-abstract-syntax-trees-and-evaluation": "unt_019fab2b-c5d2-7549-a605-67a6dcf67b1d",
        "substitution-environments-and-scope": "unt_019fab2b-c5d3-71d9-93ef-ad7421c36130",
        "functions-closures-and-recursion": "unt_019fab2b-c5d4-7d15-9e0c-338eaf44478c",
        "state-mutation-and-stores": "unt_019fab2b-c5d5-7ef8-9ea8-a215670afa31",
        "data-abstraction-and-object-models": "unt_019fab2b-c5d6-7d59-99f4-7796e038339a",
        "static-types-type-checking-and-inference": "unt_019fab2b-c5d7-7524-ae61-a0eb988d9903",
        "memory-management-and-language-implementation": "unt_019fab2b-c5d8-7560-b2c1-c7bfa239b4e1",
        "language-design-comparison-and-an-interpreter-portfolio": "unt_019fab2b-c5d9-7cab-b3ee-22b04597e8b0"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5da-79b0-98a2-42337ed04628",
        "final": "asm_019fab2b-c5db-7b04-bbd0-6d1672d1c12a"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c5dc-71a7-8a8f-5e86421fd6e5",
        "final": "asv_019fab2b-c5dd-76b6-acaa-41d032ba6c1e"
      },
      "resourceId": "res_019fab2b-c5de-7f9a-98c4-d2d089c9100e",
      "resourceVersionId": "rsv_019fab2b-c5df-7378-8539-ac90de426557",
      "accessOfferId": "acc_019fab2b-c5e0-71e3-8466-acb91467b44c",
      "rightsRecordId": "rgt_019fab2b-c5e1-78a4-ac27-e67be9e1954f",
      "freshnessRecordId": "frs_019fab2b-c5e2-7ff8-b8cd-826cae530100",
      "provenanceEvidenceId": "prvdc_019fab2b-c5e3-7d14-a1e7-20dcda6e51c7",
      "requirementOptionId": "opt_019fab2b-c5e4-70bb-b816-78f7f61e62cc",
      "schedulePlacementId": "plc_019fab2b-c5e5-7fb9-9fad-f86a7020c9ac",
      "competencyMappingIds": {
        "programming": "cpm_019fab2b-c5e6-7481-9001-306b58a70ddc",
        "theory": "cpm_019fab2b-c5e7-776d-b68b-d83474ccd391"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c5e8-7f3b-9227-75e3c58bc3e3"
    },
    "compilers": {
      "courseId": "crs_019fab2b-c5e9-752e-abbd-f18a4b52cdfa",
      "courseVersionId": "crv_019fab2b-c5ea-7f9b-ab16-b79ffe3ae502",
      "learningUnitIds": {
        "language-design-tokens-and-scanning": "unt_019fab2b-c5eb-7c7b-be4b-ccc09dd5a09d",
        "recursive-descent-parsing-and-syntax-trees": "unt_019fab2b-c5ec-7918-a19c-218a8f47e145",
        "expression-evaluation-and-runtime-errors": "unt_019fab2b-c5ed-7df2-bb5a-d7de2d659ddb",
        "statements-control-flow-functions-and-closures": "unt_019fab2b-c5ee-7c13-b590-f60111aa51b0",
        "name-resolution-classes-and-inheritance": "unt_019fab2b-c5ef-7b79-8e4d-599182110516",
        "bytecode-representation-and-virtual-machine-execution": "unt_019fab2b-c5f0-77ff-a30e-f41c30999c0d",
        "values-memory-hash-tables-and-garbage-collection": "unt_019fab2b-c5f1-7303-8e10-b4bf2873e797",
        "optimization-diagnostics-and-a-complete-language-implementation": "unt_019fab2b-c5f2-7d9f-851a-b86f6bb104f3"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5f3-7e6a-9c0c-a965019661e4",
        "final": "asm_019fab2b-c5f4-7614-8ecc-ee826e4d788d"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c5f5-77cd-898c-38ce02c928d0",
        "final": "asv_019fab2b-c5f6-7958-8cb3-75cc7ecbc28d"
      },
      "resourceId": "res_019fab2b-c5f7-7478-bbe2-135b90f29949",
      "resourceVersionId": "rsv_019fab2b-c5f8-7d8f-8514-1641ec32eb4a",
      "accessOfferId": "acc_019fab2b-c5f9-7eab-bf6d-b940e0622e42",
      "rightsRecordId": "rgt_019fab2b-c5fa-7e70-94a5-512546d62c9a",
      "freshnessRecordId": "frs_019fab2b-c5fb-7083-a177-f1ccba24d8b5",
      "provenanceEvidenceId": "prvdc_019fab2b-c5fc-7771-8f74-09d1f721df7b",
      "requirementOptionId": "opt_019fab2b-c5fd-7338-b778-95d3a00abb59",
      "schedulePlacementId": "plc_019fab2b-c5fe-74d6-a302-4d5e4f912d85",
      "competencyMappingIds": {
        "programming": "cpm_019fab2b-c5ff-7701-b45f-9044bc509ef0",
        "systems": "cpm_019fab2b-c600-7f8b-a553-479446fb2d41",
        "theory": "cpm_019fab2b-c601-79ab-8321-4d83a995f5ca"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c602-7fce-a5b1-129f0db0a552"
    },
    "computer-security": {
      "courseId": "crs_019fab2b-c603-72a5-b33e-11fae6aee495",
      "courseVersionId": "crv_019fab2b-c604-7ee7-8af8-099c5f24fae0",
      "learningUnitIds": {
        "security-goals-threat-models-and-attack-surfaces": "unt_019fab2b-c605-7960-b76c-64a102e50bb8",
        "authentication-sessions-and-access-control": "unt_019fab2b-c606-7ade-86c6-9febee9273f5",
        "injection-and-server-side-input-handling": "unt_019fab2b-c607-7085-81c8-df728651ed02",
        "cross-site-scripting-and-browser-trust-boundaries": "unt_019fab2b-c608-7e1d-8727-6d2818c493ff",
        "request-forgery-cross-origin-policy-and-clickjacking": "unt_019fab2b-c609-7625-9b16-bd0fbcdddb53",
        "file-path-command-and-server-side-request-vulnerabilities": "unt_019fab2b-c60a-736b-ae66-a371c217ca3b",
        "business-logic-race-conditions-and-api-security": "unt_019fab2b-c60b-7d30-8912-43c4e771e53e",
        "testing-methodology-remediation-and-an-ethical-security-report": "unt_019fab2b-c60c-704e-a520-babf5011b1e8"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c60d-7a4a-b66d-508f8f95329e",
        "final": "asm_019fab2b-c60e-7556-9fe3-41f4aa2e4512"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c60f-7097-9dba-e4e208c345f2",
        "final": "asv_019fab2b-c610-72c2-b051-0900718b082e"
      },
      "resourceId": "res_019fab2b-c611-73fd-9ca4-9a6edde4ef20",
      "resourceVersionId": "rsv_019fab2b-c612-7198-b0e1-95fe528c3697",
      "accessOfferId": "acc_019fab2b-c613-7dcc-a5ee-bce3eff1aca2",
      "rightsRecordId": "rgt_019fab2b-c614-7ea4-b308-b906b96012bc",
      "freshnessRecordId": "frs_019fab2b-c615-77df-960c-f45bce257602",
      "provenanceEvidenceId": "prvdc_019fab2b-c616-7e27-833a-7ea747b7e1a4",
      "requirementOptionId": "opt_019fab2b-c617-712c-a91d-410ce07b9b02",
      "schedulePlacementId": "plc_019fab2b-c618-7f3f-8a15-a9b1d8014da5",
      "competencyMappingIds": {
        "security": "cpm_019fab2b-c619-72aa-9766-f9bcb06e1979",
        "systems": "cpm_019fab2b-c61a-7a66-94cb-1ec4a1669ffc"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c61b-7b35-a8ea-d95ecf7cfa60"
    },
    "human-computer-interaction": {
      "courseId": "crs_019fab2b-c61c-7789-b0a0-bc411cff6e88",
      "courseVersionId": "crv_019fab2b-c61d-7ae4-8f9c-f7c44fa7a91e",
      "learningUnitIds": {
        "human-centered-design-and-ethical-research": "unt_019fab2b-c61e-79c3-a41f-0d3fad1900f7",
        "interviews-observation-and-task-analysis": "unt_019fab2b-c61f-79b7-bd1d-b43470bba5e2",
        "personas-scenarios-requirements-and-design-goals": "unt_019fab2b-c620-72c5-b533-90f835bc92fa",
        "sketching-storyboards-and-design-alternatives": "unt_019fab2b-c621-7f05-b666-f4d95b204b21",
        "low-fidelity-prototypes-and-heuristic-evaluation": "unt_019fab2b-c622-7f6f-9c7f-735e5878411e",
        "interactive-prototypes-and-accessibility": "unt_019fab2b-c623-7593-a2c8-a5488a270e18",
        "usability-studies-measures-and-analysis": "unt_019fab2b-c624-7edc-8065-b744f8f3d04d",
        "iteration-design-rationale-and-a-tested-product-prototype": "unt_019fab2b-c625-7ba8-ba6f-b0d03699287e"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c626-7aa4-8747-c6f6a378b820",
        "final": "asm_019fab2b-c627-790a-b4a9-eb0d44d3e4cc"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c628-7262-be21-0fa280a27531",
        "final": "asv_019fab2b-c629-7e28-bac6-549a98a902f3"
      },
      "resourceId": "res_019fab2b-c62a-7394-8cb3-8aa9accdf00d",
      "resourceVersionId": "rsv_019fab2b-c62b-70b0-9649-2c43fd4acdc3",
      "accessOfferId": "acc_019fab2b-c62c-7300-84fa-14b5d517a16a",
      "rightsRecordId": "rgt_019fab2b-c62d-7f82-92df-85268f4ca7a7",
      "freshnessRecordId": "frs_019fab2b-c62e-77d5-bbca-ad146a1981ea",
      "provenanceEvidenceId": "prvdc_019fab2b-c62f-7cce-a3e7-90166ae80a51",
      "requirementOptionId": "opt_019fab2b-c630-7253-b311-467a5267d9c1",
      "schedulePlacementId": "plc_019fab2b-c631-70e9-ba77-0729444f5118",
      "competencyMappingIds": {
        "human-centered": "cpm_019fab2b-c632-7414-9450-a3e39ea1cb1c",
        "professional": "cpm_019fab2b-c633-7679-89bf-831e060a3adb"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c634-7015-87d5-d5bbedd3c461"
    },
    "artificial-intelligence": {
      "courseId": "crs_019fab2b-c635-7c60-8a3a-616611953bb3",
      "courseVersionId": "crv_019fab2b-c636-7a47-bf45-19e4f638662f",
      "learningUnitIds": {
        "agents-state-spaces-and-uninformed-search": "unt_019fab2b-c637-7373-b872-ac5a563cbca5",
        "heuristics-a-star-and-search-quality": "unt_019fab2b-c638-7a6d-9a98-33212816d112",
        "games-minimax-and-adversarial-search": "unt_019fab2b-c639-7c76-9a80-9859bd9ea717",
        "constraint-satisfaction-problems": "unt_019fab2b-c63a-789f-b7a2-6f36c2f45081",
        "probability-bayes-nets-and-inference": "unt_019fab2b-c63b-7b87-80ae-cda0d6bf5b2f",
        "markov-models-and-decision-processes": "unt_019fab2b-c63c-76b4-8074-b8daf4b3e2ac",
        "reinforcement-learning-and-value-estimation": "unt_019fab2b-c63d-7180-bcde-df68562c37c8",
        "machine-learning-overview-and-an-intelligent-agent-project": "unt_019fab2b-c63e-78c0-8b76-080feae9138e"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c63f-7d8e-ac04-60506080043c",
        "final": "asm_019fab2b-c640-7de6-92b0-c4c83a815ed7"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c641-7f8a-b792-31fde210359d",
        "final": "asv_019fab2b-c642-7702-9783-3ea5eeebd839"
      },
      "resourceId": "res_019fab2b-c643-76b9-ba76-f118f6d248ce",
      "resourceVersionId": "rsv_019fab2b-c644-700e-9db0-b706e99f09ee",
      "accessOfferId": "acc_019fab2b-c645-72f1-9295-fbf17c9861fd",
      "rightsRecordId": "rgt_019fab2b-c646-7708-ade5-7451351413dd",
      "freshnessRecordId": "frs_019fab2b-c647-736f-83fa-fd60fe0e5dc8",
      "provenanceEvidenceId": "prvdc_019fab2b-c648-752b-b3c5-89b4f310075f",
      "requirementOptionId": "opt_019fab2b-c649-7f2e-b1ad-e966816b59be",
      "schedulePlacementId": "plc_019fab2b-c64a-7530-ba10-6607208c7719",
      "competencyMappingIds": {
        "ai-data": "cpm_019fab2b-c64b-7e03-8835-d1245c412ff7",
        "algorithms": "cpm_019fab2b-c64c-754a-b186-4de41add14b5"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c64d-73f2-b911-56790a382f77"
    },
    "machine-learning": {
      "courseId": "crs_019fab2b-c64e-7c1a-8125-cf04c32b2ec7",
      "courseVersionId": "crv_019fab2b-c64f-72de-89ae-1052c0390c8c",
      "learningUnitIds": {
        "problem-framing-data-splits-and-baselines": "unt_019fab2b-c650-739d-a159-a3799321f3c6",
        "linear-regression-loss-and-gradient-descent": "unt_019fab2b-c651-7fec-82f6-1c07f59ef273",
        "logistic-regression-classification-and-metrics": "unt_019fab2b-c652-72bd-a427-00cc6cd83bca",
        "numerical-and-categorical-feature-engineering": "unt_019fab2b-c653-7356-8072-66ec9ffaa8b6",
        "generalization-overfitting-and-regularization": "unt_019fab2b-c654-7695-86a5-eb75a5914f3b",
        "neural-networks-and-representation-learning": "unt_019fab2b-c655-7269-9516-2409a263a67f",
        "production-ml-systems-and-monitoring": "unt_019fab2b-c656-7c1d-ac9c-af62e267b6da",
        "fairness-error-analysis-and-a-reproducible-model-card": "unt_019fab2b-c657-78bd-802a-f78fbfca58d6"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c658-75d3-a638-fb83b8f2c5f1",
        "final": "asm_019fab2b-c659-74e9-97e6-74256fb513e5"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c65a-7436-874b-2635a5480d29",
        "final": "asv_019fab2b-c65b-7278-81a9-fb42b8eaedab"
      },
      "resourceId": "res_019fab2b-c65c-7a84-8626-fb02840fd48d",
      "resourceVersionId": "rsv_019fab2b-c65d-78b3-80cb-b6be6b0b3af1",
      "accessOfferId": "acc_019fab2b-c65e-770f-82c7-c5118ac28ef1",
      "rightsRecordId": "rgt_019fab2b-c65f-7828-8f28-f71083d931a1",
      "freshnessRecordId": "frs_019fab2b-c660-7453-8abe-1066b70c1d3f",
      "provenanceEvidenceId": "prvdc_019fab2b-c661-7c36-8d1b-8027d8d84225",
      "requirementOptionId": "opt_019fab2b-c662-7a3f-bfd0-e4c93cc426b6",
      "schedulePlacementId": "plc_019fab2b-c663-7830-8b61-8f2c7c82c769",
      "competencyMappingIds": {
        "ai-data": "cpm_019fab2b-c664-73bc-9ae2-a68cd8d7d684",
        "mathematics": "cpm_019fab2b-c665-7d0b-adb4-6180e4f529c6",
        "professional": "cpm_019fab2b-c666-7fd1-bc13-e8edf661612e"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c667-7995-b0e9-2dd4568c1510"
    },
    "distributed-systems": {
      "courseId": "crs_019fab2b-c668-7b6a-8096-ed4ce2cb8c10",
      "courseVersionId": "crv_019fab2b-c669-7bd2-bfb7-5eb81cae8aa3",
      "learningUnitIds": {
        "distributed-system-models-and-remote-procedure-calls": "unt_019fab2b-c66a-7c65-88b9-32865763e06c",
        "time-ordering-concurrency-and-failure": "unt_019fab2b-c66b-77c0-9c6a-9db9ec5d663e",
        "primary-backup-replication-and-state-machines": "unt_019fab2b-c66c-77f0-b592-39f7d7ca6760",
        "consensus-and-the-raft-protocol": "unt_019fab2b-c66d-74fd-88f9-885e87c374cd",
        "fault-tolerant-key-value-services": "unt_019fab2b-c66e-7a13-a28b-2fc29baa815a",
        "sharding-reconfiguration-and-transactions": "unt_019fab2b-c66f-78e3-8b27-a15d090d66bb",
        "consistency-models-and-distributed-storage": "unt_019fab2b-c670-76ed-98ce-60cb9fd3cca9",
        "measurement-testing-under-failure-and-a-replicated-service": "unt_019fab2b-c671-7a0d-8a91-25153c02b679"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c672-77f4-9737-2493d90a1497",
        "final": "asm_019fab2b-c673-7b04-a428-fad7065170a1"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c674-7eaa-9161-6e6fb3ea0098",
        "final": "asv_019fab2b-c675-7d2e-a889-ed10d84c77a3"
      },
      "resourceId": "res_019fab2b-c676-7039-b471-3e8584522bfb",
      "resourceVersionId": "rsv_019fab2b-c677-737a-b508-94046f3377cc",
      "accessOfferId": "acc_019fab2b-c678-7cd8-8ab6-993e7c68fa5d",
      "rightsRecordId": "rgt_019fab2b-c679-7667-8631-deb2f7757b23",
      "freshnessRecordId": "frs_019fab2b-c67a-7b8b-bb20-0641afb16506",
      "provenanceEvidenceId": "prvdc_019fab2b-c67b-723d-bbb1-d8e12686394e",
      "requirementOptionId": "opt_019fab2b-c67c-7f73-9f98-6ca52fc12591",
      "schedulePlacementId": "plc_019fab2b-c67d-76b9-99db-4a1a5df9ed56",
      "competencyMappingIds": {
        "networks": "cpm_019fab2b-c67e-78eb-b696-5dfe578ec31f",
        "systems": "cpm_019fab2b-c67f-72b3-b217-dc4e1d2d523e",
        "data": "cpm_019fab2b-c680-79de-8b4a-466337665d72"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c681-7312-a5d6-5fb7bd918b01"
    },
    "computing-ethics": {
      "courseId": "crs_019fab2b-c682-7506-9b52-ecc3009e2ee2",
      "courseVersionId": "crv_019fab2b-c683-7e84-9f97-36af282c5216",
      "learningUnitIds": {
        "sociotechnical-systems-and-ethical-argument": "unt_019fab2b-c684-7fae-89dd-ea26d143a20e",
        "benefit-harm-non-maleficence-and-uncertainty": "unt_019fab2b-c685-7e98-9282-b4b440491e63",
        "responsibility-accountability-and-governance": "unt_019fab2b-c686-7665-9746-036173b8c680",
        "transparency-explanation-and-contestability": "unt_019fab2b-c687-7020-a72f-c93cf7b6fae7",
        "privacy-autonomy-and-human-rights": "unt_019fab2b-c688-7177-a50e-b43c9eb64851",
        "fairness-discrimination-and-measurement": "unt_019fab2b-c689-79ea-9b87-d7183ee5ee21",
        "professional-duties-and-responsible-development": "unt_019fab2b-c68a-7c70-8afd-109acb9b2ab0",
        "case-synthesis-safeguards-and-a-public-ethics-review": "unt_019fab2b-c68b-7fb3-b0b9-e6ed9cfaeec9"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c68c-7f3e-8248-493b73a666ff",
        "final": "asm_019fab2b-c68d-7e8f-8085-8cac620e25cf"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c68e-750d-8478-7e6ac859034e",
        "final": "asv_019fab2b-c68f-75a4-9113-785d4eaf7426"
      },
      "resourceId": "res_019fab2b-c690-73d7-a9e3-4eeca5ce86a4",
      "resourceVersionId": "rsv_019fab2b-c691-7efd-bcd2-e3123bf6464b",
      "accessOfferId": "acc_019fab2b-c692-73ff-a4c3-9db8d0a3a4a5",
      "rightsRecordId": "rgt_019fab2b-c693-73e7-a35e-5ac7d5e8535b",
      "freshnessRecordId": "frs_019fab2b-c694-73bc-8489-88c080779891",
      "provenanceEvidenceId": "prvdc_019fab2b-c695-7ed2-a206-6bc9efcf4814",
      "requirementOptionId": "opt_019fab2b-c696-7282-986a-f6ac00c3bd3a",
      "schedulePlacementId": "plc_019fab2b-c697-76de-a844-790c83a1800d",
      "competencyMappingIds": {
        "ethics": "cpm_019fab2b-c698-721f-8e7a-ee74fe02425a",
        "professional": "cpm_019fab2b-c699-7e6f-92d6-0ffe3bd69e22"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c69a-7dc4-af24-007f0c29c27f"
    },
    "capstone-1": {
      "courseId": "crs_019fab2b-c69b-7f2c-b447-ddb76d9db25d",
      "courseVersionId": "crv_019fab2b-c69c-7992-b89f-b1c817d7f8e0",
      "learningUnitIds": {
        "problem-discovery-stakeholders-and-evidence": "unt_019fab2b-c69d-7cc4-bcd3-0aaeaa71f784",
        "scope-success-criteria-constraints-and-non-goals": "unt_019fab2b-c69e-7376-86b8-38621f247bc4",
        "command-line-and-development-environment-reproducibility": "unt_019fab2b-c69f-769c-8b97-9fd2ab002d4f",
        "version-control-collaboration-and-project-planning": "unt_019fab2b-c6a0-78c9-931c-6a941a92f918",
        "architecture-options-and-risk-spikes": "unt_019fab2b-c6a1-7fcb-a54d-20fea6256b46",
        "debugging-profiling-and-prototype-measurement": "unt_019fab2b-c6a2-7361-95f7-9deff8bc17d4",
        "security-ethics-accessibility-and-failure-planning": "unt_019fab2b-c6a3-744a-819f-75543c3f13fd",
        "proposal-prototype-schedule-and-oral-defense": "unt_019fab2b-c6a4-79fa-b94e-dcfd5e9755c2"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6a5-760e-b579-132c07ed064a",
        "final": "asm_019fab2b-c6a6-7c66-b69a-abedf4602102"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c6a7-7a12-8a63-4946405b42ad",
        "final": "asv_019fab2b-c6a8-734b-b00c-947acb71b958"
      },
      "resourceId": "res_019fab2b-c6a9-71e2-b400-7cb8dfff8ee5",
      "resourceVersionId": "rsv_019fab2b-c6aa-7af2-b44d-a594313aecc3",
      "accessOfferId": "acc_019fab2b-c6ab-7a5e-932d-3acaaf1bd545",
      "rightsRecordId": "rgt_019fab2b-c6ac-718d-a37f-e076a143993a",
      "freshnessRecordId": "frs_019fab2b-c6ad-7b34-96fa-9cb3c92d567a",
      "provenanceEvidenceId": "prvdc_019fab2b-c6ae-76bf-8c71-1fbf9ed723bb",
      "requirementOptionId": "opt_019fab2b-c6af-72e0-a77e-b45287f395b1",
      "schedulePlacementId": "plc_019fab2b-c6b0-766a-8fd5-1b93ca50670e",
      "competencyMappingIds": {
        "capstone": "cpm_019fab2b-c6b1-7b1c-b4d8-40ceda60e1fb",
        "software": "cpm_019fab2b-c6b2-79a5-9721-8282088e77ec",
        "professional": "cpm_019fab2b-c6b3-756c-a89f-9d156645a9dc"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c6b4-7949-9974-a230e21a2519"
    },
    "data-science": {
      "courseId": "crs_019fab2b-c6b5-7e2a-a460-ea3b3f188410",
      "courseVersionId": "crv_019fab2b-c6b6-7c7e-8bc3-b91542689fa3",
      "learningUnitIds": {
        "data-generating-processes-tables-and-reproducibility": "unt_019fab2b-c6b7-76fe-8266-8b71de3f910f",
        "cleaning-transformation-and-exploratory-visualization": "unt_019fab2b-c6b8-7940-85f2-a51235ed5a5c",
        "sampling-empirical-distributions-and-simulation": "unt_019fab2b-c6b9-7c00-8b17-3f2c55b814ed",
        "estimation-confidence-intervals-and-uncertainty": "unt_019fab2b-c6ba-7efa-b1b3-6a13cab1910a",
        "hypothesis-testing-and-error": "unt_019fab2b-c6bb-7cb1-aa6a-1b74e3b9c454",
        "association-correlation-and-linear-prediction": "unt_019fab2b-c6bc-7a46-b996-991a4e7492b7",
        "classification-evaluation-and-fairness": "unt_019fab2b-c6bd-76ae-a674-c21c9d6752f3",
        "end-to-end-investigation-and-an-evidence-aware-report": "unt_019fab2b-c6be-754a-86a5-974311d9a51e"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6bf-74d8-a86c-4e2041aaece2",
        "final": "asm_019fab2b-c6c0-7b7e-b932-c779cc242723"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c6c1-794d-8316-fae5f26b44a4",
        "final": "asv_019fab2b-c6c2-72c8-93ed-124b252c0357"
      },
      "resourceId": "res_019fab2b-c6c3-78f4-af43-d602b397e2db",
      "resourceVersionId": "rsv_019fab2b-c6c4-7eb4-bf41-83263e62b607",
      "accessOfferId": "acc_019fab2b-c6c5-78dd-897e-78a3cc64d961",
      "rightsRecordId": "rgt_019fab2b-c6c6-70ad-b30e-d4a9e3d20c63",
      "freshnessRecordId": "frs_019fab2b-c6c7-7f7e-9235-79f72b2e5ffc",
      "provenanceEvidenceId": "prvdc_019fab2b-c6c8-7181-ba11-f0186a9e2e31",
      "requirementOptionId": "opt_019fab2b-c6c9-720e-b76a-343a6d048ebd",
      "schedulePlacementId": "plc_019fab2b-c6ca-7421-bc33-937f199fd5e8",
      "competencyMappingIds": {
        "ai-data": "cpm_019fab2b-c6cb-7a80-b116-8d561318bb00",
        "data": "cpm_019fab2b-c6cc-73bf-b3c7-4968d4dace13",
        "professional": "cpm_019fab2b-c6cd-791f-bc55-98a90f17fe6b"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c6ce-76af-b7e3-9d0bfe528f04"
    },
    "research-methods": {
      "courseId": "crs_019fab2b-c6cf-7c6e-99e3-4d83a4a58b24",
      "courseVersionId": "crv_019fab2b-c6d0-7547-97d6-8393bd431936",
      "learningUnitIds": {
        "research-questions-claims-contribution-types-and-paper-reading": "unt_019fab2b-c6d1-7f22-bddb-ea1f7e4e7f47",
        "potential-outcomes-counterfactuals-and-estimands": "unt_019fab2b-c6d2-7fcb-9ae3-d3d88335e997",
        "randomized-experiments-power-and-common-validity-threats": "unt_019fab2b-c6d3-7c43-8505-ef13d3f202e6",
        "causal-diagrams-confounding-and-identification-assumptions": "unt_019fab2b-c6d4-7a3f-bc52-34af6d7a263f",
        "regression-diagnostics-and-responsible-interpretation": "unt_019fab2b-c6d5-7d2a-a627-7135ab51eda2",
        "benchmarks-as-measurement-instruments": "unt_019fab2b-c6d6-767e-946a-00579b64f0fb",
        "quasi-experiments-reproducibility-and-research-ethics": "unt_019fab2b-c6d7-7b09-8c4b-c83f6309d58c",
        "literature-synthesis-analysis-plans-and-a-defensible-proposal": "unt_019fab2b-c6d8-7f90-9f3c-6cd8d56b4d0b"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6d9-7a06-bbf1-36ec6cff43ba",
        "final": "asm_019fab2b-c6da-7b26-9138-d88b262a5ff9"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c6db-704f-8677-94f981a9f94e",
        "final": "asv_019fab2b-c6dc-767e-a9d3-cb100afa9a74"
      },
      "resourceId": "res_019fab2b-c6dd-7060-94f4-b8bc0107fa1e",
      "resourceVersionId": "rsv_019fab2b-c6de-79e7-afd2-09db04f46860",
      "accessOfferId": "acc_019fab2b-c6df-71d3-8562-5069be37136e",
      "rightsRecordId": "rgt_019fab2b-c6e0-7902-84bb-be13dc2c27fd",
      "freshnessRecordId": "frs_019fab2b-c6e1-721f-bebf-4b5c07753043",
      "provenanceEvidenceId": "prvdc_019fab2b-c6e2-7131-b424-713cebac95fc",
      "requirementOptionId": "opt_019fab2b-c6e3-7902-94c0-98221f6b83e4",
      "schedulePlacementId": "plc_019fab2b-c6e4-7b7a-bade-6da8ce45ec18",
      "competencyMappingIds": {
        "research": "cpm_019fab2b-c6e5-71ce-b8cd-80c362423675",
        "professional": "cpm_019fab2b-c6e6-7f75-b3ed-0d82bcc65567",
        "mathematics": "cpm_019fab2b-c6e7-72db-9dc3-05280093e1c1"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c6e8-7979-a248-6858dae76790"
    },
    "capstone-2": {
      "courseId": "crs_019fab2b-c6e9-7dd6-aa30-267f79e2b4fa",
      "courseVersionId": "crv_019fab2b-c6ea-7d5e-b3c6-7c1d06b686eb",
      "learningUnitIds": {
        "reconfirming-requirements-risks-and-evaluation-plan": "unt_019fab2b-c6eb-7547-b1e5-a28f00d1d42b",
        "vertical-slice-implementation-and-continuous-integration": "unt_019fab2b-c6ec-7e1b-8c69-a89ad449661c",
        "design-review-and-evidence-driven-reprioritization": "unt_019fab2b-c6ed-7ef3-b28b-18b248f711a9",
        "testing-security-review-and-accessibility-review": "unt_019fab2b-c6ee-7510-88e5-aadfe974cee9",
        "performance-reliability-and-failure-testing": "unt_019fab2b-c6ef-71a9-a874-e89f2758bfad",
        "user-or-system-evaluation-and-analysis": "unt_019fab2b-c6f0-7089-b6cf-5d2f85473c02",
        "documentation-release-reproducibility-and-handoff": "unt_019fab2b-c6f1-7405-aa11-ec8315138b7e",
        "final-artifact-portfolio-retrospective-and-public-defense": "unt_019fab2b-c6f2-78c6-92cf-717ae922d9ed"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6f3-7ca1-addb-dddb524da3b2",
        "final": "asm_019fab2b-c6f4-7367-96d8-9d8a479c823c"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c6f5-7452-a4b8-4ba69085c3a3",
        "final": "asv_019fab2b-c6f6-7f5e-9abd-3e80f9767ce5"
      },
      "resourceId": "res_019fab2b-c6f7-7cfc-a7bd-cdd37c7bf7dd",
      "resourceVersionId": "rsv_019fab2b-c6f8-72b8-a916-f07ec04a7eb3",
      "accessOfferId": "acc_019fab2b-c6f9-78d8-98b8-bcfa59e4d3ef",
      "rightsRecordId": "rgt_019fab2b-c6fa-7c99-bb4a-71db1ca13215",
      "freshnessRecordId": "frs_019fab2b-c6fb-78e1-8f6d-6063b1c5a85e",
      "provenanceEvidenceId": "prvdc_019fab2b-c6fc-77e5-a542-abe68020c414",
      "requirementOptionId": "opt_019fab2b-c6fd-730c-a5f2-8e380fabfd86",
      "schedulePlacementId": "plc_019fab2b-c6fe-78a9-9295-1795e7edf054",
      "competencyMappingIds": {
        "capstone": "cpm_019fab2b-c6ff-7f91-bb47-43415f1d451f",
        "software": "cpm_019fab2b-c700-7c06-86f1-53272c1e45ae",
        "research": "cpm_019fab2b-c701-7d8c-aa74-5d65fd1aaa4f",
        "professional": "cpm_019fab2b-c702-7c32-ac92-47262c24ec2e"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c703-7811-8e84-98befd14fcfe"
    },
    "computer-graphics": {
      "courseId": "crs_019fab2b-c704-70b8-9bff-e18fdd1f8301",
      "courseVersionId": "crv_019fab2b-c705-724e-852a-452737314e1c",
      "learningUnitIds": {
        "images-as-data-rasterization-and-sampling": "unt_019fab2b-c706-71d9-97ec-6448e46302e7",
        "transforms-coordinate-systems-and-texture-mapping": "unt_019fab2b-c707-757c-a2b3-9fecbde0c79c",
        "geometry-processing-and-half-edge-meshes": "unt_019fab2b-c708-7ed3-bb6c-d62f4bf8f5d0",
        "curves-surfaces-and-mesh-editing": "unt_019fab2b-c709-7fcd-a106-45fe45c79e2d",
        "ray-generation-intersections-and-acceleration": "unt_019fab2b-c70a-7761-a57e-33a33c4a7762",
        "lighting-materials-and-global-illumination": "unt_019fab2b-c70b-7f83-bc3a-f2f2887bf625",
        "animation-numerical-integration-and-simulation": "unt_019fab2b-c70c-7e54-8db1-fb498457ec30",
        "rendering-system-evaluation-and-a-graphics-project": "unt_019fab2b-c70d-72e5-9e58-c199c04c8899"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c70e-7aeb-a960-6048a2e29078",
        "final": "asm_019fab2b-c70f-7abf-b863-fd7964413255"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c710-76da-a99b-b546e02cc7f4",
        "final": "asv_019fab2b-c711-71e1-bb24-f35918765ace"
      },
      "resourceId": "res_019fab2b-c712-7ae4-9aee-b52ac70c9f14",
      "resourceVersionId": "rsv_019fab2b-c713-72eb-a148-98c0db5e6345",
      "accessOfferId": "acc_019fab2b-c714-792c-8fb5-94505f1c8670",
      "rightsRecordId": "rgt_019fab2b-c715-7574-9db7-e07a36822f11",
      "freshnessRecordId": "frs_019fab2b-c716-70fd-834a-91ebb1207a45",
      "provenanceEvidenceId": "prvdc_019fab2b-c717-7a4f-8e1e-35a05d3f85b3",
      "requirementOptionId": "opt_019fab2b-c718-7b38-ad33-95ebfa07dbdb",
      "schedulePlacementId": "plc_019fab2b-c719-70b2-8bfd-f688fc8d5841",
      "competencyMappingIds": {
        "graphics": "cpm_019fab2b-c71a-794d-93e6-119ad9719045",
        "programming": "cpm_019fab2b-c71b-7f0f-9c95-2e667d1d9b42",
        "mathematics": "cpm_019fab2b-c71c-7581-bad4-bc316ffd3742"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c71d-7f98-b7bb-bf627e54ed26"
    },
    "computer-vision": {
      "courseId": "crs_019fab2b-c71e-7f89-b92a-8bf225d96f37",
      "courseVersionId": "crv_019fab2b-c71f-7256-b3aa-2a52a045528b",
      "learningUnitIds": {
        "image-classification-and-data-driven-recognition": "unt_019fab2b-c720-73be-b724-d0750eb1b864",
        "linear-classifiers-loss-functions-and-optimization": "unt_019fab2b-c721-7c4b-b496-3b42d685ec88",
        "neural-networks-and-backpropagation": "unt_019fab2b-c722-7f7b-a870-43ba0d180bf6",
        "convolutional-architectures-and-training": "unt_019fab2b-c723-7032-80e0-3ebab5b42a79",
        "regularization-transfer-learning-and-augmentation": "unt_019fab2b-c724-70ab-aec9-ecbebe0f4c52",
        "detection-segmentation-and-localization": "unt_019fab2b-c725-7095-8fbd-ceef73fc3bd4",
        "visualization-interpretation-bias-and-robustness": "unt_019fab2b-c726-7ee6-9701-447f5c469257",
        "reproducible-vision-experiment-and-model-report": "unt_019fab2b-c727-7591-b116-757e71a7fbea"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c728-7c24-8337-16a86d39b173",
        "final": "asm_019fab2b-c729-7f06-9d1d-7310a1eadeb0"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c72a-7bf9-ab3c-738f0fc7b0d0",
        "final": "asv_019fab2b-c72b-731b-9a03-449e2e3d3c35"
      },
      "resourceId": "res_019fab2b-c72c-7ae1-93da-253ce52d02d6",
      "resourceVersionId": "rsv_019fab2b-c72d-7be1-992a-c36f1bd67a24",
      "accessOfferId": "acc_019fab2b-c72e-7c04-97d7-2f343d834755",
      "rightsRecordId": "rgt_019fab2b-c72f-758d-ac6b-1c8f29dcee8d",
      "freshnessRecordId": "frs_019fab2b-c730-7c99-b457-59e108cead7d",
      "provenanceEvidenceId": "prvdc_019fab2b-c731-78dd-8444-ab91e170d23b",
      "requirementOptionId": "opt_019fab2b-c732-75e2-9cae-75ad00a38272",
      "schedulePlacementId": "plc_019fab2b-c733-70b8-89cd-54daf979d81a",
      "competencyMappingIds": {
        "ai-data": "cpm_019fab2b-c734-720f-82a2-acebae82f04e",
        "graphics": "cpm_019fab2b-c735-7505-ba90-83f90188d06e"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c736-7167-a001-17d07a41024f"
    },
    "natural-language-processing": {
      "courseId": "crs_019fab2b-c737-7e1d-9f06-097886bbaa36",
      "courseVersionId": "crv_019fab2b-c738-7af8-8f8d-faa9b9e2ca3b",
      "learningUnitIds": {
        "language-structure-tokenization-and-distributional-meaning": "unt_019fab2b-c739-7a31-9332-ffb14527107e",
        "word-vectors-and-representation-geometry": "unt_019fab2b-c73a-7dab-9f31-f0219d526397",
        "neural-sequence-models-and-recurrent-networks": "unt_019fab2b-c73b-71da-a401-65afda663fff",
        "attention-and-encoder-decoder-models": "unt_019fab2b-c73c-79af-93db-db8fe5d612b1",
        "transformers-and-pretrained-language-models": "unt_019fab2b-c73d-7b74-90ed-d23fb350a791",
        "question-answering-generation-and-retrieval": "unt_019fab2b-c73e-79d5-a8da-3e4e712fb436",
        "evaluation-hallucination-bias-and-safety": "unt_019fab2b-c73f-717c-bd87-82ed433e96d4",
        "reproducible-nlp-system-and-model-documentation": "unt_019fab2b-c740-7d13-8c9a-a6eba5425d33"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c741-7ce0-9e14-0ddf004f6504",
        "final": "asm_019fab2b-c742-7c6c-901e-f7f6175c9749"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c743-735c-83e2-7415fa5a393f",
        "final": "asv_019fab2b-c744-7329-b637-e6ceb9d0cc53"
      },
      "resourceId": "res_019fab2b-c745-72a1-ab62-fac44b3f4448",
      "resourceVersionId": "rsv_019fab2b-c746-742b-85b1-76e968064440",
      "accessOfferId": "acc_019fab2b-c747-7342-bc76-98288488ac83",
      "rightsRecordId": "rgt_019fab2b-c748-763c-8ee4-6d16e1c1b89f",
      "freshnessRecordId": "frs_019fab2b-c749-7eff-8ffa-7a68ed51f2c6",
      "provenanceEvidenceId": "prvdc_019fab2b-c74a-74ee-975c-8641759bdb30",
      "requirementOptionId": "opt_019fab2b-c74b-7723-a69e-d8adf895ba08",
      "schedulePlacementId": "plc_019fab2b-c74c-7087-b950-2aa23b8b6866",
      "competencyMappingIds": {
        "ai-data": "cpm_019fab2b-c74d-772e-b6a6-63ca3353d549",
        "professional": "cpm_019fab2b-c74e-7a4e-9a48-37a8ed991973"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c74f-7652-b4d6-75e440a313b2"
    },
    "parallel-computing": {
      "courseId": "crs_019fab2b-c750-79ad-ba54-8668903ec859",
      "courseVersionId": "crv_019fab2b-c751-7062-b30a-86a2d246c2af",
      "learningUnitIds": {
        "parallel-machines-cost-models-and-limits-to-speedup": "unt_019fab2b-c752-70bd-8aa7-7fb65821d26b",
        "shared-memory-programming-and-synchronization": "unt_019fab2b-c753-7cb6-b60c-86e7bd451282",
        "data-locality-caches-and-memory-performance": "unt_019fab2b-c754-74ca-9ae1-73eeed7a4752",
        "distributed-memory-programming-and-message-passing": "unt_019fab2b-c755-7360-a1e1-d813b91e87f8",
        "decomposition-load-balance-and-communication": "unt_019fab2b-c756-7165-9268-7ff876b123ee",
        "parallel-numerical-and-graph-kernels": "unt_019fab2b-c757-7188-8924-564c4b797e66",
        "performance-measurement-profiling-and-scaling": "unt_019fab2b-c758-7eb7-ba41-74b138e64f47",
        "optimized-parallel-application-and-benchmark-report": "unt_019fab2b-c759-7d96-99aa-eb6b66b3e596"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c75a-707a-b128-428c8e0b3c7d",
        "final": "asm_019fab2b-c75b-79a0-9392-3580343e662a"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c75c-73e5-9f67-3065ee9f5790",
        "final": "asv_019fab2b-c75d-7972-a4f3-eea11bad9cba"
      },
      "resourceId": "res_019fab2b-c75e-79cb-8f09-cda61502cd1a",
      "resourceVersionId": "rsv_019fab2b-c75f-7dd2-942c-3e075ea9c5e9",
      "accessOfferId": "acc_019fab2b-c760-7b9f-9357-2ad2d7f61604",
      "rightsRecordId": "rgt_019fab2b-c761-70b1-aa76-5e93ebfc738c",
      "freshnessRecordId": "frs_019fab2b-c762-7d4b-8a3a-03f8c5c02743",
      "provenanceEvidenceId": "prvdc_019fab2b-c763-7648-963b-4d0343350bfb",
      "requirementOptionId": "opt_019fab2b-c764-714d-a05a-b8f53aaf489c",
      "schedulePlacementId": "plc_019fab2b-c765-7ace-a45c-9fb49a155a7b",
      "competencyMappingIds": {
        "systems": "cpm_019fab2b-c766-7385-88ac-55c1a464b456",
        "algorithms": "cpm_019fab2b-c767-77e8-b254-7a1d0ae70348"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c768-7c88-bffd-5f672dc41004"
    },
    "android-development": {
      "courseId": "crs_019fab2b-c769-7a2e-b55f-7443fae87ba8",
      "courseVersionId": "crv_019fab2b-c76a-76e2-aa77-9d32d1df1e06",
      "learningUnitIds": {
        "kotlin-fundamentals-and-android-project-structure": "unt_019fab2b-c76b-7841-a5a9-02d74fc6d41b",
        "compose-ui-layouts-and-theming": "unt_019fab2b-c76c-77d9-8b46-a195a886ce89",
        "state-events-and-lifecycle-aware-design": "unt_019fab2b-c76d-7136-91d3-c9dd6363449c",
        "navigation-and-adaptive-interfaces": "unt_019fab2b-c76e-7138-899e-896dbf5ec8e8",
        "architecture-view-models-and-data-layers": "unt_019fab2b-c76f-78ac-880a-7814dcd03213",
        "persistence-networking-and-offline-behavior": "unt_019fab2b-c770-72b5-aeb6-dc443e206902",
        "accessibility-testing-and-performance": "unt_019fab2b-c771-7600-ac7a-349c9c57dc53",
        "release-preparation-and-a-complete-android-application": "unt_019fab2b-c772-7d00-8a26-2b97396a6c94"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c773-7d4e-b287-db6bfa2e4498",
        "final": "asm_019fab2b-c774-7cfd-9912-e86f1ad6e487"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c775-70c2-831a-13b2ccfa7b12",
        "final": "asv_019fab2b-c776-7e63-8c74-49f4eced2b12"
      },
      "resourceId": "res_019fab2b-c777-7c7b-bb51-361c67aa9208",
      "resourceVersionId": "rsv_019fab2b-c778-7449-941f-b18365c48429",
      "accessOfferId": "acc_019fab2b-c779-778c-b7bb-0f5675d7e07c",
      "rightsRecordId": "rgt_019fab2b-c77a-73f0-b349-eb5cdc970608",
      "freshnessRecordId": "frs_019fab2b-c77b-77c1-9182-4b8c925ae817",
      "provenanceEvidenceId": "prvdc_019fab2b-c77c-73c5-a720-dfdbe5e5345d",
      "requirementOptionId": "opt_019fab2b-c77d-784b-80dc-5361f2f99bc0",
      "schedulePlacementId": "plc_019fab2b-c77e-7a42-8f4d-7a7b0b84f7a3",
      "competencyMappingIds": {
        "software": "cpm_019fab2b-c77f-721b-b1f1-5d8b662e301b",
        "human-centered": "cpm_019fab2b-c780-737b-928a-b13ecc9b39d0"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c781-7372-a851-93ef608fb316"
    },
    "applied-cryptography": {
      "courseId": "crs_019fab2b-c782-7de7-a4aa-d6d09b307afd",
      "courseVersionId": "crv_019fab2b-c783-7d87-9be3-8d46b98ef6d7",
      "learningUnitIds": {
        "security-definitions-adversaries-and-threat-models": "unt_019fab2b-c784-756d-b5df-20db22fbbfb9",
        "one-time-pads-stream-ciphers-and-pseudorandomness": "unt_019fab2b-c785-7ac2-a499-3ca1878c2af4",
        "block-ciphers-and-modes-of-operation": "unt_019fab2b-c786-7f5b-96f6-b0293e9650dc",
        "message-authentication-and-authenticated-encryption": "unt_019fab2b-c787-78f5-8c54-f35aa3d10bb6",
        "hash-functions-and-password-storage": "unt_019fab2b-c788-7dce-b129-94d982b85f0a",
        "public-key-encryption-and-number-theoretic-foundations": "unt_019fab2b-c789-7c8a-a77e-45961b07d193",
        "key-exchange-digital-signatures-and-certificates": "unt_019fab2b-c78a-7bd1-afd1-1db7af597ca8",
        "protocol-composition-implementation-failures-and-a-security-analysis": "unt_019fab2b-c78b-73bb-8192-45750c9aa65f"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c78c-7f07-8b8b-cddcbe159adf",
        "final": "asm_019fab2b-c78d-7707-afde-287836607320"
      },
      "assessmentVersionIds": {
        "applied": "asv_019fab2b-c78e-70d3-ae68-54645128fddb",
        "final": "asv_019fab2b-c78f-79c9-bbbd-b39c437852a0"
      },
      "resourceId": "res_019fab2b-c790-7469-91f1-98cbfddcbe83",
      "resourceVersionId": "rsv_019fab2b-c791-78b0-ab27-856652461dac",
      "accessOfferId": "acc_019fab2b-c792-7e6d-9d2b-5b9ee84d0535",
      "rightsRecordId": "rgt_019fab2b-c793-79cd-85ce-96caf3cc38eb",
      "freshnessRecordId": "frs_019fab2b-c794-767a-96c0-55128fed20ae",
      "provenanceEvidenceId": "prvdc_019fab2b-c795-7fa4-af57-7ed33d52c1b7",
      "requirementOptionId": "opt_019fab2b-c796-7b11-b554-8dd5d2f75bfc",
      "schedulePlacementId": "plc_019fab2b-c797-7273-8a6b-53e0433fbef3",
      "competencyMappingIds": {
        "security": "cpm_019fab2b-c798-7918-86eb-ba90bd5d49b4",
        "mathematics": "cpm_019fab2b-c799-7943-95b2-158b98de923d"
      },
      "finalAssessmentMappingId": "cpm_019fab2b-c79a-7597-9eed-92dfb487fa35"
    }
  }
} as const satisfies ComputerScienceIdentityManifest;

