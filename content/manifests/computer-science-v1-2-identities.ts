import { computerScienceV11Identities } from "./computer-science-v1-1-identities";

/**
 * Complete identity manifest for the immutable Computer Science 1.2 publication.
 *
 * Program, course, assessment, competency, calendar, period, milestone, and
 * unchanged resource identities are intentionally stable. Every versioned or
 * embedded entity whose payload changes in 1.2 receives a fresh, literal
 * type-prefixed UUIDv7 identity here.
 */
export const computerScienceV12Identities = {
  "bundleId": "bnd_01a00129-87d8-7e79-8c3b-1a7acfd5f1a7",
  "programId": "prg_019fab2b-c401-7277-90e3-350c6848e164",
  "programVersionId": "prv_01a00129-87d8-7332-8229-e55e8e2c6955",
  "programProvenanceEvidenceId": "prvdc_01a00129-87d8-7d76-9cea-d5efa5c406e0",
  "requirementGroupIds": {
    "term-1": "req_01a00129-87d8-769a-a692-bfb48f482d55",
    "term-2": "req_01a00129-87d9-7538-9f76-f162e0ab9b73",
    "term-3": "req_01a00129-87d9-748c-9cc0-9b068dc6c0d7",
    "term-4": "req_01a00129-87d9-72b2-98b5-28e7b6e86171",
    "term-5": "req_01a00129-87d9-7156-885b-ab0de757918b",
    "term-6": "req_01a00129-87d9-7e7f-8fbb-6328819e7b2f",
    "concentration": "req_01a00129-87d9-7a83-a980-2497bdbe1b53"
  },
  "concentrationIds": {
    "intelligent-systems": "con_01a00129-87d9-7c1f-a776-18ae15b54a51",
    "scalable-secure-systems": "con_01a00129-87d9-7541-98ac-f77a1f4a960d",
    "interactive-applications": "con_01a00129-87d9-7541-b6f0-24aa039470d0"
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
    "programming": "cpm_01a00129-87d9-7873-9614-5242dff9d8cb",
    "algorithms": "cpm_01a00129-87d9-7543-ab99-2274ed884318",
    "mathematics": "cpm_01a00129-87d9-7a93-a4b0-e13ed7fd18c5",
    "systems": "cpm_01a00129-87d9-7467-bac9-f09636af50a0",
    "data": "cpm_01a00129-87d9-787b-857a-73d31e38fe27",
    "networks": "cpm_01a00129-87d9-7833-a360-fc787cbe8adf",
    "software": "cpm_01a00129-87d9-703b-bb2b-52d2a2629755",
    "security": "cpm_01a00129-87d9-7b17-a5aa-b080966bf1e8",
    "ai-data": "cpm_01a00129-87d9-78b3-aeb2-3132ced589f1",
    "human-centered": "cpm_01a00129-87d9-741c-8165-1e93a021da30",
    "ethics": "cpm_01a00129-87d9-7664-b2e4-0666e1a73964",
    "professional": "cpm_01a00129-87d9-7da5-a3c2-31ce8171aea8",
    "research": "cpm_01a00129-87d9-781d-a008-c2d9c345282d",
    "capstone": "cpm_01a00129-87d9-7fc8-b96d-64c0dff3e1af",
    "theory": "cpm_01a00129-87d9-764a-ab57-da9e679fdf56",
    "graphics": "cpm_01a00129-87d9-758b-b575-50072f3d9f14"
  },
  "calendar": {
    "id": "cal_019fab2b-c42e-7dfc-b7e4-6c38ac423103",
    "scheduleId": "sch_01a00129-87d9-75e7-9fb0-1c419b4a8f44",
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
      "courseVersionId": "crv_01a00129-87d9-7143-9865-4f82e91f1332",
      "learningUnitIds": {
        "functions-variables-and-expressions": "unt_01a00129-87d9-7de3-8f38-7fa74c321ad5",
        "conditionals-and-boolean-reasoning": "unt_01a00129-87d9-72ba-ad7b-b1bea12727cf",
        "loops-invariants-and-iteration": "unt_01a00129-87d9-7555-9d0b-c20688b17ed8",
        "exceptions-and-systematic-debugging": "unt_01a00129-87d9-70b0-b007-7f5432342b92",
        "libraries-apis-and-dependency-choices": "unt_01a00129-87d9-7527-8cbd-88d4cacb962d",
        "unit-tests-and-test-design": "unt_01a00129-87d9-7768-9a42-e693569a267e",
        "files-regular-expressions-and-data-validation": "unt_01a00129-87d9-73bc-ac3e-d226388147e0",
        "classes-composition-and-a-final-python-application": "unt_01a00129-87d9-787d-a8bb-0fb77228638f"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c44c-7fce-9a1a-d7cf5f473100",
        "final": "asm_019fab2b-c44d-74fe-8d0f-883e655138f6"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-74b3-90d4-16dc55c585dc",
        "final": "asv_01a00129-87d9-7375-b2ef-a96607de875f"
      },
      "resourceId": "res_019fab2b-c450-7c69-9704-aec2cb511433",
      "resourceVersionId": "rsv_01a00129-87d9-7500-bea1-27acc5710e03",
      "accessOfferId": "acc_01a00129-87d9-7c83-9e97-bf972908a942",
      "rightsRecordId": "rgt_01a00129-87d9-7a48-a806-ca6ab61ee5fc",
      "freshnessRecordId": "frs_01a00129-87d9-75db-8850-dbe74f53dfbc",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-7627-bda6-c053e6cbefca",
      "requirementOptionId": "opt_01a00129-87d9-741b-941f-88af850e4b0f",
      "schedulePlacementId": "plc_01a00129-87d9-7a4c-b0ed-8137c8349218",
      "competencyMappingIds": {
        "programming": "cpm_01a00129-87d9-74d6-afc6-891eacf578ac",
        "software": "cpm_01a00129-87d9-7da0-b79f-dbef929f4e53"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-7eee-946b-e38d31b5f899"
    },
    "discrete-mathematics": {
      "courseId": "crs_019fab2b-c45b-73e6-924f-2748c9ef71b0",
      "courseVersionId": "crv_01a00129-87d9-778e-a9ad-eb9a95629bb6",
      "learningUnitIds": {
        "propositions-predicates-and-proof-structure": "unt_01a00129-87d9-7af7-85b4-48f6d980b368",
        "sets-functions-relations-and-induction": "unt_01a00129-87d9-7548-90e3-50377a970f4b",
        "strong-induction-and-recursive-definitions": "unt_01a00129-87d9-7b32-aa10-a3c626f11162",
        "graphs-trees-and-graph-invariants": "unt_01a00129-87d9-7705-8dc0-1ca760dd9a41",
        "state-machines-and-invariants": "unt_01a00129-87d9-72a6-a5e6-026a5e104ee4",
        "number-theory-and-modular-arithmetic": "unt_01a00129-87d9-7b7f-bbf8-72f10d012afd",
        "counting-recurrences-and-asymptotics": "unt_01a00129-87d9-7716-ab02-9a340a7bee90",
        "discrete-probability-and-cumulative-proof-practice": "unt_01a00129-87d9-7c03-bc63-3fea058ef990"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c465-7cc5-b091-966ec63258ec",
        "final": "asm_019fab2b-c466-7e1d-b9c7-0804ff862037"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-763b-9828-53653732ae7d",
        "final": "asv_01a00129-87d9-7bf2-8794-2cae8be18867"
      },
      "resourceId": "res_019fab2b-c469-71df-bd2a-096d9fb5380d",
      "resourceVersionId": "rsv_01a00129-87d9-77dc-a6b1-0c2c04e2d429",
      "accessOfferId": "acc_01a00129-87d9-741d-9eb6-7788710af0aa",
      "rightsRecordId": "rgt_01a00129-87d9-7f62-b22a-86237c9744b9",
      "freshnessRecordId": "frs_01a00129-87d9-742a-8ebc-f71869e8a02b",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-7bf7-a81a-575bbc1a5b78",
      "requirementOptionId": "opt_01a00129-87d9-71d1-80f6-aea5ab8283b4",
      "schedulePlacementId": "plc_01a00129-87d9-7310-b59a-3a84f9c523a5",
      "competencyMappingIds": {
        "mathematics": "cpm_01a00129-87d9-7b7d-b5a6-1b5d117796eb",
        "algorithms": "cpm_01a00129-87d9-78f2-8ae8-7c6f00ed5e64"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-717f-be8e-def3cdf4d020"
    },
    "calculus": {
      "courseId": "crs_019fab2b-c474-7810-854a-8d01d70a67db",
      "courseVersionId": "crv_01a00129-87d9-74d9-a464-c1283e80437a",
      "learningUnitIds": {
        "functions-limits-and-continuity": "unt_01a00129-87d9-7323-9cc6-cb6229a57e56",
        "derivatives-from-definitions-and-rules": "unt_01a00129-87d9-735c-8b6e-22c039b503d8",
        "linearization-and-numerical-approximation": "unt_01a00129-87d9-7810-96a0-38fed8829c67",
        "optimization-and-related-rates": "unt_01a00129-87d9-7ae5-8198-0ccf42ce1ac3",
        "definite-integrals-and-accumulation": "unt_01a00129-87d9-724d-bcd4-2c3e4789a713",
        "the-fundamental-theorem-and-applications": "unt_01a00129-87d9-710d-8a73-36c597a57c38",
        "integration-methods-and-differential-models": "unt_01a00129-87d9-7bfa-a238-bac81f6b09d5",
        "taylor-series-error-and-cumulative-modeling": "unt_01a00129-87d9-7568-8af7-cf8b3997ece4"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c47e-7c3e-b044-46b85c9fea44",
        "final": "asm_019fab2b-c47f-7521-aa78-66d689b44701"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-72ae-bda8-89fb87846959",
        "final": "asv_01a00129-87d9-775e-a12d-c19c97474123"
      },
      "resourceId": "res_019fab2b-c482-7bb1-994c-0a98fc9431ee",
      "resourceVersionId": "rsv_01a00129-87d9-74ca-a593-fbe4c878bd1d",
      "accessOfferId": "acc_01a00129-87d9-71a1-a0b4-1dbc422f8ad0",
      "rightsRecordId": "rgt_01a00129-87d9-7874-969a-0c0d6f0c8d58",
      "freshnessRecordId": "frs_01a00129-87d9-7d2b-af36-8b510649f0e3",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-7baa-b9f7-51d871ae14a2",
      "requirementOptionId": "opt_01a00129-87d9-7224-85c9-0e163c659daf",
      "schedulePlacementId": "plc_01a00129-87d9-75c6-b49e-b196f6976e59",
      "competencyMappingIds": {
        "mathematics": "cpm_01a00129-87d9-7cf1-8a17-f8d084838913"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-75a0-a3b0-feadf47ce660"
    },
    "systems-foundations": {
      "courseId": "crs_019fab2b-c48c-7647-aa90-6fde4bf77f19",
      "courseVersionId": "crv_01a00129-87d9-7fc6-8538-404c4f3b1aa1",
      "learningUnitIds": {
        "computational-thinking-and-c-toolchains": "unt_01a00129-87d9-7f3b-a526-7170848cc046",
        "c-control-flow-functions-and-compilation": "unt_01a00129-87d9-70c7-be4a-513d1ada4700",
        "arrays-strings-and-data-representation": "unt_01a00129-87d9-785a-8be6-be8d82433a89",
        "algorithmic-costs-and-empirical-measurement": "unt_01a00129-87d9-7931-9b0a-f73fec91a3f6",
        "pointers-memory-layout-and-allocation": "unt_01a00129-87d9-7ec7-9342-031a49751cc5",
        "linked-structures-and-memory-safety": "unt_01a00129-87d9-751c-a346-cb25c1bd082c",
        "sql-and-durable-data": "unt_01a00129-87d9-72c5-9d12-66ca15357155",
        "systems-integration-and-a-cumulative-c-build": "unt_01a00129-87d9-76da-91d3-cdd33c2a9055"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c496-75f8-aa24-a5f2b1ae62e6",
        "final": "asm_019fab2b-c497-7354-8ad3-8653d7651cec"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-71c5-a17a-2f36a79fc779",
        "final": "asv_01a00129-87d9-70a5-be93-3f8055566d16"
      },
      "resourceId": "res_019fab2b-c49a-72ba-ab75-91c33a2b26d8",
      "resourceVersionId": "rsv_01a00129-87d9-76e1-ac7b-5d9d1e290c4e",
      "accessOfferId": "acc_01a00129-87d9-7243-94cf-1215531aba1d",
      "rightsRecordId": "rgt_01a00129-87d9-7966-971c-091ce6722646",
      "freshnessRecordId": "frs_01a00129-87d9-78e9-8b47-1087192bd994",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-79b5-91bf-aaa3f0738fd2",
      "requirementOptionId": "opt_01a00129-87d9-789f-9e80-93deb8e328cb",
      "schedulePlacementId": "plc_01a00129-87d9-70bf-864d-964a5cb7206b",
      "competencyMappingIds": {
        "programming": "cpm_01a00129-87d9-77d1-b893-e41fa3ceff61",
        "systems": "cpm_01a00129-87d9-7e21-a66f-4a8ab591c870"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-7cd5-b8e8-9c67bbc59f12"
    },
    "technical-communication": {
      "courseId": "crs_019fab2b-c4a5-7339-8ee9-a8eeea3a194c",
      "courseVersionId": "crv_01a00129-87d9-7154-9e10-c4bc31ab0fe4",
      "learningUnitIds": {
        "audience-purpose-and-scope": "unt_01a00129-87d9-73d6-987b-b5d52709beeb",
        "terminology-active-voice-and-clear-sentences": "unt_01a00129-87d9-712f-be20-951956f824c3",
        "paragraphs-lists-and-information-hierarchy": "unt_01a00129-87d9-769e-a8e6-9e99e514ce46",
        "procedures-examples-and-reproducible-instructions": "unt_01a00129-87d9-7fa6-8be5-ba4fc5d9d188",
        "markdown-code-samples-and-document-tooling": "unt_01a00129-87d9-7cba-a011-7d63051b9914",
        "diagrams-tables-captions-and-accessibility": "unt_01a00129-87d9-76f9-96a1-7e7b5c862183",
        "source-evaluation-citation-and-uncertainty": "unt_01a00129-87d9-7b38-9ff6-2d8db9f694d1",
        "peer-review-and-a-polished-technical-guide": "unt_01a00129-87d9-7fe9-a73a-bba36033292b"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4af-7a35-b862-61e8d709888c",
        "final": "asm_019fab2b-c4b0-7c93-a79a-f267382d0dc3"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-749d-bec0-7eec62b183dc",
        "final": "asv_01a00129-87d9-7b70-bb53-b274686ef033"
      },
      "resourceId": "res_019fab2b-c4b3-78be-b972-decf757cc45b",
      "resourceVersionId": "rsv_01a00129-87d9-7820-8a8f-66ceffed5a57",
      "accessOfferId": "acc_01a00129-87d9-7f9c-b62f-980d415d0af7",
      "rightsRecordId": "rgt_01a00129-87d9-7433-b764-fa1f6e160c07",
      "freshnessRecordId": "frs_01a00129-87d9-76c0-b2b6-0fdddfc9fc21",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-7cd9-88d1-63803202ad5d",
      "requirementOptionId": "opt_01a00129-87d9-716a-a45c-b558b6c26afc",
      "schedulePlacementId": "plc_01a00129-87d9-7503-8127-a1a80504ac85",
      "competencyMappingIds": {
        "professional": "cpm_01a00129-87d9-774f-af25-bce8baf1e8da",
        "software": "cpm_01a00129-87d9-7ed7-959e-497e79bf06c0"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-7c63-ba3a-75f673482b55"
    },
    "data-structures": {
      "courseId": "crs_019fab2b-c4be-7272-b165-81cfe51a2eea",
      "courseVersionId": "crv_01a00129-87d9-73df-b44a-28e5e80f6701",
      "learningUnitIds": {
        "interfaces-abstraction-and-asymptotic-cost": "unt_01a00129-87d9-7b95-83e5-e9ab4f2196ad",
        "arrays-linked-lists-stacks-and-queues": "unt_01a00129-87d9-77ae-bf61-f63ec16a4570",
        "testing-invariants-and-encapsulation": "unt_01a00129-87d9-78de-9c35-dcec5c617904",
        "hash-tables-and-collision-strategies": "unt_01a00129-87d9-74f9-8b90-c228efab358c",
        "trees-traversals-and-search-trees": "unt_01a00129-87d9-7a34-baeb-c1a26368ba2b",
        "priority-queues-heaps-and-disjoint-sets": "unt_01a00129-87d9-76b8-a05c-e601da74d6a5",
        "graphs-and-graph-representations": "unt_01a00129-87d9-7447-a5e8-65606d0715b5",
        "sorting-amortized-analysis-and-a-data-structure-library": "unt_01a00129-87d9-790c-9bc3-474cc4f36b79"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4c8-7475-a13e-9660737ffa3b",
        "final": "asm_019fab2b-c4c9-7548-9bb6-f1d9e27ec982"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-764c-aaf8-395aeaab205d",
        "final": "asv_01a00129-87d9-71f9-97e0-e3c04c74dcbf"
      },
      "resourceId": "res_01a0012d-31b2-7f1d-b03c-e7cccbf126d0",
      "resourceVersionId": "rsv_01a00129-87d9-7c90-9f77-c16376cd9482",
      "accessOfferId": "acc_01a00129-87d9-70d7-b96a-11abab0416ef",
      "rightsRecordId": "rgt_01a00129-87d9-7227-b503-69fa315c75c3",
      "freshnessRecordId": "frs_01a00129-87d9-7720-8576-bb55a79cb532",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-75a4-9514-824102d2a3e8",
      "requirementOptionId": "opt_01a00129-87d9-7413-8829-a41d6fefa408",
      "schedulePlacementId": "plc_01a00129-87d9-7803-965a-bee1cc3dea22",
      "competencyMappingIds": {
        "programming": "cpm_01a00129-87d9-747b-ae3f-be1f95d1b9dc",
        "algorithms": "cpm_01a00129-87d9-7d47-a1b5-505bdbafc45c"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-7b70-baf4-ddd34a5e8371"
    },
    "computer-architecture": {
      "courseId": "crs_019fab2b-c4d7-795d-9d11-a7bee38bfa12",
      "courseVersionId": "crv_01a00129-87d9-7bd5-957d-7a11787b8ef3",
      "learningUnitIds": {
        "gates-combinational-circuits-and-sequential-logic": "unt_01a00129-87d9-72c7-b1a1-ce110a342504",
        "instruction-set-architecture-and-assembly-programming": "unt_01a00129-87d9-7d98-bcd9-14ac0c220696",
        "processor-datapath-control-and-instruction-execution": "unt_01a00129-87d9-756c-ab27-ba246a1030b3",
        "pipelining-data-control-hazards-and-forwarding": "unt_01a00129-87d9-7a92-933b-9585f5b089b5",
        "caches-locality-and-the-memory-hierarchy": "unt_01a00129-87d9-7db8-8bf4-400dc7ba20b3",
        "virtual-memory-exceptions-and-input-output": "unt_01a00129-87d9-749b-8f72-e31284439d60",
        "parallelism-performance-models-and-measurement": "unt_01a00129-87d9-74c2-a32b-a22b679356db",
        "processor-memory-system-integration-and-defense": "unt_01a00129-87d9-7fa3-9a5d-2b4a63e31db5"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4e1-782a-8bf9-8a0519c64437",
        "final": "asm_019fab2b-c4e2-7d49-83e9-5109b953311e"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87d9-72a6-a00a-c1c594a67e21",
        "final": "asv_01a00129-87d9-79c7-917a-612ef687d7ca"
      },
      "resourceId": "res_019fbc95-32cd-7a5b-b4e7-b0dc86848bd6",
      "resourceVersionId": "rsv_01a00129-87d9-7c12-b314-75346aa8b473",
      "accessOfferId": "acc_01a00129-87d9-7dc3-bd52-e6bd661b40f8",
      "rightsRecordId": "rgt_01a00129-87d9-7780-853d-2497acfc3456",
      "freshnessRecordId": "frs_01a00129-87d9-70b0-87c7-61369e7a73c2",
      "provenanceEvidenceId": "prvdc_01a00129-87d9-73fb-9aa6-7054e517d830",
      "requirementOptionId": "opt_01a00129-87d9-788f-b539-32c390cfc2d8",
      "schedulePlacementId": "plc_01a00129-87d9-77c1-b47b-1bb33ef61284",
      "competencyMappingIds": {
        "systems": "cpm_01a00129-87d9-7afc-8cbe-aaf1aaa8214e"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87d9-7955-8675-d9c54201ea35"
    },
    "linear-algebra": {
      "courseId": "crs_019fab2b-c4ef-74cb-a6b1-ca34680b5b26",
      "courseVersionId": "crv_01a00129-87da-7404-b3f0-f0d09ef9a910",
      "learningUnitIds": {
        "linear-systems-and-elimination": "unt_01a00129-87da-7361-87c8-53f1f6e62cc2",
        "matrix-operations-inverses-and-factorization": "unt_01a00129-87da-7ed1-bdf4-3310420ae6fa",
        "vector-spaces-subspaces-and-basis": "unt_01a00129-87da-759e-8c14-613d986660c7",
        "orthogonality-and-least-squares": "unt_01a00129-87da-7cef-a033-17686b8caac5",
        "determinants-and-volume": "unt_01a00129-87da-7bc1-b178-2d811c14aa33",
        "eigenvalues-and-eigenvectors": "unt_01a00129-87da-71f6-a6ca-ce163e6cfc8b",
        "singular-values-and-low-rank-approximation": "unt_01a00129-87da-770b-a27a-64eb047c6b56",
        "numerical-linear-algebra-in-a-computing-application": "unt_01a00129-87da-7165-b3eb-eec35d934132"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c4f9-7504-bf7c-4a23443fbb3e",
        "final": "asm_019fab2b-c4fa-7583-85a4-1223460e94cc"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-740d-ae55-3edc00431e89",
        "final": "asv_01a00129-87da-7a82-8672-7afa3a9d0039"
      },
      "resourceId": "res_019fab2b-c4fd-7634-9b56-89bffd22466d",
      "resourceVersionId": "rsv_01a00129-87da-7c23-964c-9a7c1675590d",
      "accessOfferId": "acc_01a00129-87da-7bb5-9a14-87a2873ae6f0",
      "rightsRecordId": "rgt_01a00129-87da-7681-8f46-4ac339d4feb7",
      "freshnessRecordId": "frs_01a00129-87da-74ad-9282-b779d1635eac",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7599-9485-57d3dd234c31",
      "requirementOptionId": "opt_01a00129-87da-7251-b384-dab132295f6c",
      "schedulePlacementId": "plc_01a00129-87da-7ddd-ac43-5439084d048c",
      "competencyMappingIds": {
        "mathematics": "cpm_01a00129-87da-7b03-82af-5a86f217dbfd",
        "ai-data": "cpm_01a00129-87da-7f01-a3e9-069ea2ab17ee"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-7aa2-bd66-4b89af912b79"
    },
    "probability": {
      "courseId": "crs_019fab2b-c508-7e77-a932-c251d06e112f",
      "courseVersionId": "crv_01a00129-87da-7fb3-9c3a-5087da38b6dc",
      "learningUnitIds": {
        "counting-and-probability-spaces": "unt_01a00129-87da-7f41-be34-844cd8dea085",
        "conditional-probability-and-bayes-rule": "unt_01a00129-87da-7696-a1a5-ba889e79a69c",
        "independence-and-probabilistic-reasoning": "unt_01a00129-87da-78f6-8690-6c8a0c4a0be1",
        "discrete-random-variables-and-expectation": "unt_01a00129-87da-7d63-9c31-656b98409cb4",
        "continuous-distributions-and-transformations": "unt_01a00129-87da-7989-8ace-fd9fc6a7263e",
        "joint-distributions-covariance-and-conditioning": "unt_01a00129-87da-76f3-aebe-18e3c6122182",
        "law-of-large-numbers-and-central-limit-behavior": "unt_01a00129-87da-7597-9f43-4debe81bd349",
        "simulation-estimation-and-a-cumulative-probability-model": "unt_01a00129-87da-7b8f-9a07-050ab9d774fb"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c512-72c5-9225-153c595a83f1",
        "final": "asm_019fab2b-c513-796f-8ec1-00974c2ad8a6"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7010-9ef6-40e373a5184f",
        "final": "asv_01a00129-87da-71be-abce-8017455361ae"
      },
      "resourceId": "res_019fab2b-c516-73b4-931a-3e2f5f7a9a50",
      "resourceVersionId": "rsv_01a00129-87da-7418-a850-ecc8039b80b2",
      "accessOfferId": "acc_01a00129-87da-7e93-bebd-63d32b3ddff4",
      "rightsRecordId": "rgt_01a00129-87da-7a05-8636-5aa0fb24aecc",
      "freshnessRecordId": "frs_01a00129-87da-7128-8611-492166618aa6",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7b44-bd2d-7206fb928914",
      "requirementOptionId": "opt_01a00129-87da-74aa-bf91-063b3e221ee6",
      "schedulePlacementId": "plc_01a00129-87da-7a77-bd4e-fca554bf6e7d",
      "competencyMappingIds": {
        "mathematics": "cpm_01a00129-87da-73c7-a6d2-a989571d2ea2",
        "ai-data": "cpm_01a00129-87da-728c-85e8-c39ee2e91272"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-7bcc-ab99-3fe30b8ab39a"
    },
    "web-engineering": {
      "courseId": "crs_019fab2b-c521-7440-bc63-ab96a2b29eaa",
      "courseVersionId": "crv_01a00129-87da-79ee-ad4e-05a96f9e0c31",
      "learningUnitIds": {
        "web-standards-semantic-html-and-document-structure": "unt_01a00129-87da-7867-b879-1c896bacc0cd",
        "css-layout-responsive-design-and-maintainability": "unt_01a00129-87da-735e-97bc-df2722f3183a",
        "javascript-the-dom-and-event-driven-behavior": "unt_01a00129-87da-7adc-a5c9-e2f2015e973b",
        "forms-validation-accessibility-and-inclusive-interaction": "unt_01a00129-87da-78c7-a008-c60ebf39f2b8",
        "http-fetch-apis-and-asynchronous-control-flow": "unt_01a00129-87da-7364-bdbd-8d2b13a2ef2f",
        "client-state-components-and-architecture": "unt_01a00129-87da-7abe-b266-e61aebe5452e",
        "testing-security-basics-and-performance": "unt_01a00129-87da-73d2-9de1-fcdf73d3a7d1",
        "deployment-observability-and-a-production-ready-application": "unt_01a00129-87da-737c-8d19-c58643e62a79"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c52b-76a7-89f0-bab68b27ede5",
        "final": "asm_019fab2b-c52c-7b2a-9ae7-2b4b6010a030"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-74fb-b3ff-83a4399a31e9",
        "final": "asv_01a00129-87da-740c-9224-b9f9f497a495"
      },
      "resourceId": "res_019fab2b-c52f-773a-8708-3f479fbaa630",
      "resourceVersionId": "rsv_01a00129-87da-77af-8aac-c70477f2e440",
      "accessOfferId": "acc_01a00129-87da-7227-b739-52d17e800150",
      "rightsRecordId": "rgt_01a00129-87da-7ad6-abac-b223c78a7afa",
      "freshnessRecordId": "frs_01a00129-87da-7cef-805c-0ff3cda9aaa3",
      "provenanceEvidenceId": "prvdc_01a00129-87da-733f-aa18-1db2e3d04405",
      "requirementOptionId": "opt_01a00129-87da-7db5-a9fd-bfd2fa05b822",
      "schedulePlacementId": "plc_01a00129-87da-7a45-90c5-ed9cfb6b48e4",
      "competencyMappingIds": {
        "software": "cpm_01a00129-87da-78e1-b88b-1ce4d529c555",
        "human-centered": "cpm_01a00129-87da-71a7-8ebe-e08d0dd52a57"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-7750-9d28-d4137fed159d"
    },
    "algorithms": {
      "courseId": "crs_019fab2b-c53a-7039-a729-40d905ed4fb1",
      "courseVersionId": "crv_01a00129-87da-74b1-a909-0f9d68e6bfe9",
      "learningUnitIds": {
        "algorithmic-modeling-correctness-and-asymptotic-analysis": "unt_01a00129-87da-79b3-8211-9773f878ccd5",
        "recurrences-divide-and-conquer-and-sorting": "unt_01a00129-87da-71b3-a5b3-afd696f134a6",
        "greedy-algorithms-minimum-spanning-trees-and-shortest-paths": "unt_01a00129-87da-770e-b1ae-eb550a9fce2a",
        "dynamic-programming-design-and-correctness": "unt_01a00129-87da-7626-a487-5bf8f69f87fb",
        "maximum-flow-minimum-cuts-and-matching": "unt_01a00129-87da-7f47-9e5b-8a9e206ea440",
        "reductions-p-np-and-np-completeness": "unt_01a00129-87da-7b3b-b218-a3809013704f",
        "approximation-algorithms-and-intractability-tradeoffs": "unt_01a00129-87da-7a12-b55d-508f24ed853b",
        "cumulative-algorithm-design-proof-and-defense": "unt_01a00129-87da-7216-b606-30f5c01c2d05"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c544-7e1f-a656-22f82bbfc417",
        "final": "asm_019fab2b-c545-702a-8b51-dc5278747b1b"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7bd5-b161-56fde1e494e3",
        "final": "asv_01a00129-87da-7bf7-a54d-ea75b15f04cc"
      },
      "resourceId": "res_019fbc95-32e2-78c3-9cf5-69bc495138b4",
      "resourceVersionId": "rsv_01a00129-87da-714b-8628-77ebbf7dba92",
      "accessOfferId": "acc_01a00129-87da-7fc0-8d33-3f16d3f891bb",
      "rightsRecordId": "rgt_01a00129-87da-792f-bdb7-faebbb787293",
      "freshnessRecordId": "frs_01a00129-87da-79c7-8884-96d096880025",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7532-b962-903bbc720d04",
      "requirementOptionId": "opt_01a00129-87da-7e58-b44f-d2306f0d641d",
      "schedulePlacementId": "plc_01a00129-87da-7318-a6d4-5d2e04e37b5e",
      "competencyMappingIds": {
        "algorithms": "cpm_01a00129-87da-7890-a494-55db626e9e95",
        "mathematics": "cpm_01a00129-87da-7dda-9524-3a93402e1c07"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-7438-ae8d-9281cfc5c9e5"
    },
    "operating-systems": {
      "courseId": "crs_019fab2b-c553-7065-a127-30f3f4b4778a",
      "courseVersionId": "crv_01a00129-87da-7fa5-9a16-240084f7daf9",
      "learningUnitIds": {
        "processes-system-calls-and-direct-execution": "unt_01a00129-87da-74d7-9487-ab478147edde",
        "cpu-scheduling-and-measurable-policy-tradeoffs": "unt_01a00129-87da-7ed2-8f27-2ebef1013305",
        "address-spaces-and-memory-apis": "unt_01a00129-87da-747f-bdb7-9a5bdda1b4f3",
        "paging-translation-and-virtual-memory": "unt_01a00129-87da-7f8b-8ccc-8ce5968287b2",
        "threads-locks-condition-variables-and-semaphores": "unt_01a00129-87da-7999-a67b-4d7c6f821cdd",
        "concurrency-bugs-and-event-driven-systems": "unt_01a00129-87da-7807-956e-959ab21564d1",
        "storage-devices-files-and-file-system-implementation": "unt_01a00129-87da-795c-bf3d-6c4b776eed1e",
        "persistence-integrity-protection-and-a-systems-lab": "unt_01a00129-87da-7f26-a8bf-33e328aa6b00"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c55d-778d-aced-c91dc5632836",
        "final": "asm_019fab2b-c55e-783c-8f23-094d24c0731f"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7f5a-b3ed-7680d2db5233",
        "final": "asv_01a00129-87da-759a-9f60-728460272fdb"
      },
      "resourceId": "res_019fab2b-c561-7f4f-a217-4b2c64b0dec5",
      "resourceVersionId": "rsv_01a00129-87da-74e6-8a18-60253f08a964",
      "accessOfferId": "acc_01a00129-87da-7138-b711-33aede97165d",
      "rightsRecordId": "rgt_01a00129-87da-7d55-9994-d8def0a7643f",
      "freshnessRecordId": "frs_01a00129-87da-7ed3-b923-7a89d83404d8",
      "provenanceEvidenceId": "prvdc_01a00129-87da-76ca-938f-a49900e8118a",
      "requirementOptionId": "opt_01a00129-87da-7699-a5dd-15f6cf1db3b0",
      "schedulePlacementId": "plc_01a00129-87da-7ad6-86ef-1fa48e1b79be",
      "competencyMappingIds": {
        "systems": "cpm_01a00129-87da-77bc-b977-aa6b65bb37c9",
        "security": "cpm_01a00129-87da-7602-9f7d-5753087fa067"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-7db7-8246-6f2bbe67de12"
    },
    "database-systems": {
      "courseId": "crs_019fab2b-c56c-71fc-ac7c-13007b3b8fff",
      "courseVersionId": "crv_01a00129-87da-7fd0-8d57-a400fa50b1d4",
      "learningUnitIds": {
        "data-models-relational-algebra-and-sql": "unt_01a00129-87da-767d-a584-cb72c846d5df",
        "schema-design-dependencies-and-normalization": "unt_01a00129-87da-73fc-b259-4e9566ce050d",
        "storage-models-pages-and-buffer-pools": "unt_01a00129-87da-7e4e-9dbd-3c997ea48651",
        "indexes-trees-hashing-and-filters": "unt_01a00129-87da-746e-aca4-15c5911ca4ee",
        "query-execution-joins-sorting-and-aggregation": "unt_01a00129-87da-7ab8-9e6e-a393e2cc2f85",
        "query-planning-and-optimization": "unt_01a00129-87da-75b9-95cc-ee5a421b154f",
        "transactions-and-concurrency-control": "unt_01a00129-87da-72e0-96b5-5bbdf5421d0e",
        "logging-recovery-and-a-database-implementation-review": "unt_01a00129-87da-74e6-b00c-59243f71bafb"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c576-7e33-bece-95adbd0948de",
        "final": "asm_019fab2b-c577-7f59-9724-83838f812526"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7652-b9dd-0b6518ae9fc1",
        "final": "asv_01a00129-87da-7c76-80e6-5fb1d20c1399"
      },
      "resourceId": "res_019fab2b-c57a-7de1-ba70-05fcf53d9cad",
      "resourceVersionId": "rsv_01a00129-87da-7b11-81d3-a639a8d98c34",
      "accessOfferId": "acc_01a00129-87da-7b27-a131-c82d87660a59",
      "rightsRecordId": "rgt_01a00129-87da-7014-8a12-33f0ef9d0410",
      "freshnessRecordId": "frs_01a00129-87da-7b0c-8a8c-0c372f6b1f43",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7727-be14-21e3e0920eab",
      "requirementOptionId": "opt_01a00129-87da-7f0f-bab6-74dad6cef5d8",
      "schedulePlacementId": "plc_01a00129-87da-745c-90c8-5467511231e4",
      "competencyMappingIds": {
        "data": "cpm_01a00129-87da-7f82-9bb6-253581665024",
        "systems": "cpm_01a00129-87da-770d-a40a-c73c749811bb"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-72fb-9e11-b79bd9ed3f2b"
    },
    "software-engineering": {
      "courseId": "crs_019fab2b-c585-70f0-9e8d-a58d3c812779",
      "courseVersionId": "crv_01a00129-87da-747b-b348-5fd3d17485b4",
      "learningUnitIds": {
        "software-engineering-over-time-and-scale": "unt_01a00129-87da-75dd-927c-1ae936d082f5",
        "team-culture-knowledge-sharing-and-ownership": "unt_01a00129-87da-7f70-a540-54e737e337a2",
        "style-readability-and-documentation": "unt_01a00129-87da-7848-841d-4310533767f2",
        "testing-strategy-and-test-maintainability": "unt_01a00129-87da-7006-aaa0-a3fe9e0c893c",
        "dependency-management-apis-and-compatibility": "unt_01a00129-87da-7696-a57b-f21a3ec65fc0",
        "version-control-code-review-and-change-management": "unt_01a00129-87da-7c5a-bb19-52123399ad91",
        "build-systems-continuous-integration-and-release": "unt_01a00129-87da-729f-9a9e-48cd870cbfd6",
        "technical-debt-sustainability-and-a-maintained-team-system": "unt_01a00129-87da-782e-abcc-d8deaa2f04dd"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c58f-7f12-92e1-57ea27c1a733",
        "final": "asm_019fab2b-c590-73d2-9cc8-dabc34dd3f7d"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-79ae-819f-121913786205",
        "final": "asv_01a00129-87da-715c-9a7b-5217f3286900"
      },
      "resourceId": "res_019fab2b-c593-7304-a707-ac55da0c3402",
      "resourceVersionId": "rsv_01a00129-87da-70df-81ef-4b3cc98ae48d",
      "accessOfferId": "acc_01a00129-87da-75dd-b12a-163f96985ebe",
      "rightsRecordId": "rgt_01a00129-87da-762b-a64e-997207aaa07f",
      "freshnessRecordId": "frs_01a00129-87da-7397-8faf-e444805e6d10",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7616-96b7-6ffdd77a280a",
      "requirementOptionId": "opt_01a00129-87da-7502-b9b3-37e9223ecb06",
      "schedulePlacementId": "plc_01a00129-87da-70cf-a9cd-f89d073dd72d",
      "competencyMappingIds": {
        "software": "cpm_01a00129-87da-7fc2-a95e-ea3935ab683a",
        "professional": "cpm_01a00129-87da-7749-b358-90390d83066c"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-77cb-867a-31ccca6b5b4d"
    },
    "computer-networks": {
      "courseId": "crs_019fab2b-c59e-7165-8905-451e48f0aade",
      "courseVersionId": "crv_01a00129-87da-7947-a59b-32626c2a0311",
      "learningUnitIds": {
        "network-architecture-layering-and-packet-switching": "unt_01a00129-87da-7841-9949-226ff766c27a",
        "application-protocols-naming-and-http": "unt_01a00129-87da-7184-aecf-6d02480ca30c",
        "sockets-streams-and-network-programming": "unt_01a00129-87da-7063-b2bb-d7effe8da0d6",
        "reliable-byte-streams-and-retransmission": "unt_01a00129-87da-7b99-a4df-7d5761ab500a",
        "ip-forwarding-addressing-and-routing": "unt_01a00129-87da-7244-9b95-993b501294ee",
        "congestion-control-and-shared-capacity": "unt_01a00129-87da-74b4-a190-a26bab4470cf",
        "link-layers-local-networks-and-measurement": "unt_01a00129-87da-7a14-b43a-212032be4d0a",
        "network-security-operations-and-a-transport-implementation": "unt_01a00129-87da-7138-958d-13964f59f69f"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5a8-7002-be48-72d87dba301d",
        "final": "asm_019fab2b-c5a9-7e6b-a8f1-4f7ee5db1382"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7a85-ab6c-8566c3b549b5",
        "final": "asv_01a00129-87da-7d39-8eb6-8fabe1f20a51"
      },
      "resourceId": "res_019fab2b-c5ac-78c3-864d-96f58afac728",
      "resourceVersionId": "rsv_01a00129-87da-7a0e-bd16-4c8c8d7e8ce8",
      "accessOfferId": "acc_01a00129-87da-7f3c-bc3a-01aca06c883e",
      "rightsRecordId": "rgt_01a00129-87da-7400-853f-5bffde9b2645",
      "freshnessRecordId": "frs_01a00129-87da-7589-98f7-0d6e5408842e",
      "provenanceEvidenceId": "prvdc_01a00129-87da-764d-acb8-7bea94c3bc06",
      "requirementOptionId": "opt_01a00129-87da-7591-add5-93ce343737e8",
      "schedulePlacementId": "plc_01a00129-87da-7aef-b7b9-5aa172d9ff37",
      "competencyMappingIds": {
        "networks": "cpm_01a00129-87da-7795-8ae3-7ab7ba932b8b",
        "systems": "cpm_01a00129-87da-7935-8411-748c593495b5"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-78b9-9a36-df369b976ec5"
    },
    "theory-of-computation": {
      "courseId": "crs_019fab2b-c5b7-718d-8e74-a564a52ac97d",
      "courseVersionId": "crv_01a00129-87da-7590-b170-20e7caab7fa0",
      "learningUnitIds": {
        "finite-automata-and-regular-languages": "unt_01a00129-87da-7555-b395-11eb37af908b",
        "regular-expressions-closure-and-pumping-arguments": "unt_01a00129-87da-7c5b-9912-1ba3d7edfb00",
        "context-free-grammars-and-pushdown-automata": "unt_01a00129-87da-74b8-b31d-0ea8ad90c4e5",
        "turing-machines-and-recognizable-languages": "unt_01a00129-87da-7096-ad38-fadbd4dc7c0e",
        "decidability-and-undecidability": "unt_01a00129-87da-7ce5-9ebe-5a0e42168f16",
        "mapping-reductions-and-proof-technique": "unt_01a00129-87da-76eb-8f8d-985ddb829ef6",
        "time-complexity-p-and-np": "unt_01a00129-87da-77bd-b8a2-badd55450e21",
        "np-completeness-and-cumulative-theory-proofs": "unt_01a00129-87da-7c05-a9e1-1f67c6c5e316"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5c1-7e75-a1fe-1eb18a5d632f",
        "final": "asm_019fab2b-c5c2-727f-bad9-a22d0b7cf173"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-74a9-ad27-1e0350f9c3b5",
        "final": "asv_01a00129-87da-7a48-93b7-e729ae2c82ac"
      },
      "resourceId": "res_019fab2b-c5c5-7b6d-8659-61306df6234d",
      "resourceVersionId": "rsv_01a00129-87da-7ef9-88bb-03c0f247b7af",
      "accessOfferId": "acc_01a00129-87da-74aa-8f02-2e8ab2fddad9",
      "rightsRecordId": "rgt_01a00129-87da-7ce6-92c6-e2f2a940e181",
      "freshnessRecordId": "frs_01a00129-87da-7cb1-af42-31de652c0e01",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7f0f-b277-eaf2a5cf1edf",
      "requirementOptionId": "opt_01a00129-87da-794e-b6f0-2c6e782efd3a",
      "schedulePlacementId": "plc_01a00129-87da-7755-a276-178923875293",
      "competencyMappingIds": {
        "theory": "cpm_01a00129-87da-786e-833b-dcb09588bb80",
        "mathematics": "cpm_01a00129-87da-72f3-9238-61c9e47b6581"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-746e-94aa-7a459e305315"
    },
    "programming-languages": {
      "courseId": "crs_019fab2b-c5d0-762f-bc5d-fa8dedd83206",
      "courseVersionId": "crv_01a00129-87da-76b8-a1d0-1e70a454a2e5",
      "learningUnitIds": {
        "immutability-expressions-and-equational-reasoning": "unt_01a00129-87da-78dd-bafe-13d9b6176d71",
        "algebraic-data-types-and-pattern-matching": "unt_01a00129-87da-76d6-a967-c79204839855",
        "structural-recursion-folds-and-inductive-data": "unt_01a00129-87da-7660-b80a-fc7863836719",
        "higher-order-functions-composition-and-abstraction": "unt_01a00129-87da-78bf-a835-46d58f232c7c",
        "lexical-scope-environments-and-closures": "unt_01a00129-87da-7e11-a630-83cb773bcdb2",
        "persistent-data-structures-modules-and-interfaces": "unt_01a00129-87da-73d4-8455-d1274d00d51d",
        "polymorphic-types-type-checking-and-inference": "unt_01a00129-87da-7aae-bea4-c0a770a2eb7e",
        "functional-imperative-and-object-oriented-comparison-with-interpreter-defense": "unt_01a00129-87da-754f-aa62-39ed4a0efbcd"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5da-79b0-98a2-42337ed04628",
        "final": "asm_019fab2b-c5db-7b04-bbd0-6d1672d1c12a"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7f0b-83b8-07890e6678de",
        "final": "asv_01a00129-87da-7584-b2a1-2dee4a6bbf1c"
      },
      "resourceId": "res_019fab2b-c5de-7f9a-98c4-d2d089c9100e",
      "resourceVersionId": "rsv_01a00129-87da-72b4-a92b-12b4bf69133c",
      "accessOfferId": "acc_01a00129-87da-7d22-b0b7-be1e7e68528c",
      "rightsRecordId": "rgt_01a00129-87da-70bc-aa77-d19d8b673d2a",
      "freshnessRecordId": "frs_01a00129-87da-7213-810b-8a68a0930928",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7c7c-9eb4-1e0689e34a8b",
      "requirementOptionId": "opt_01a00129-87da-7816-9666-e3defb4f6f55",
      "schedulePlacementId": "plc_01a00129-87da-7637-a902-3f6505404fdc",
      "competencyMappingIds": {
        "programming": "cpm_01a00129-87da-7ce9-af88-3c522de9146a",
        "theory": "cpm_01a00129-87da-74ba-b5d6-611aaefb3c30"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-737b-8d62-f162de7d429a"
    },
    "compilers": {
      "courseId": "crs_019fab2b-c5e9-752e-abbd-f18a4b52cdfa",
      "courseVersionId": "crv_01a00129-87da-7327-8b7c-5dcbf3cfa24c",
      "learningUnitIds": {
        "language-design-tokens-and-scanning": "unt_01a00129-87da-7301-b583-990779ac0735",
        "recursive-descent-parsing-and-syntax-trees": "unt_01a00129-87da-736c-9c65-d24cc86fc661",
        "expression-evaluation-and-runtime-errors": "unt_01a00129-87da-7f2e-a2e8-49d1dfc1d41d",
        "statements-control-flow-functions-and-closures": "unt_01a00129-87da-71c9-bccc-b03286953270",
        "name-resolution-classes-and-inheritance": "unt_01a00129-87da-75ae-9de8-bc107cbe2328",
        "bytecode-representation-and-virtual-machine-execution": "unt_01a00129-87da-792b-84cb-93610d338750",
        "values-memory-hash-tables-and-garbage-collection": "unt_01a00129-87da-7468-a841-ebd3ee2ace18",
        "optimization-diagnostics-and-a-complete-language-implementation": "unt_01a00129-87da-7151-a089-9717409c106c"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c5f3-7e6a-9c0c-a965019661e4",
        "final": "asm_019fab2b-c5f4-7614-8ecc-ee826e4d788d"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-7770-b1f4-e0e6fb9355dc",
        "final": "asv_01a00129-87da-7f9e-b2a2-50ad4f841064"
      },
      "resourceId": "res_019fab2b-c5f7-7478-bbe2-135b90f29949",
      "resourceVersionId": "rsv_01a00129-87da-70d6-8726-edd6151083e5",
      "accessOfferId": "acc_01a00129-87da-7148-bb6e-e1b558919617",
      "rightsRecordId": "rgt_01a00129-87da-71f9-a5b1-be1ce2af95f3",
      "freshnessRecordId": "frs_01a00129-87da-7f4d-8f64-d91ece337bd5",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7b27-a8aa-0b69741a095f",
      "requirementOptionId": "opt_01a00129-87da-70ea-be07-413c72d5839d",
      "schedulePlacementId": "plc_01a00129-87da-787d-9587-2b2710711c1e",
      "competencyMappingIds": {
        "programming": "cpm_01a00129-87da-7b24-803d-4e13be468ca6",
        "systems": "cpm_01a00129-87da-77e1-b119-bc4b1e80e612",
        "theory": "cpm_01a00129-87da-7676-9b95-3385e33d404f"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-7775-8f2b-d13050fc7169"
    },
    "computer-security": {
      "courseId": "crs_019fab2b-c603-72a5-b33e-11fae6aee495",
      "courseVersionId": "crv_01a00129-87da-7479-8d14-8c1d10762fb4",
      "learningUnitIds": {
        "security-goals-threat-models-and-attack-surfaces": "unt_01a00129-87da-7e44-a802-6c1964d8b8ee",
        "authentication-sessions-and-access-control": "unt_01a00129-87da-767d-afda-01d2804cd812",
        "injection-and-server-side-input-handling": "unt_01a00129-87da-7409-a90b-ff2b82355371",
        "cross-site-scripting-and-browser-trust-boundaries": "unt_01a00129-87da-7596-b6a9-73c376ad677b",
        "request-forgery-cross-origin-policy-and-clickjacking": "unt_01a00129-87da-7abe-81df-fad81b91edcf",
        "file-path-command-and-server-side-request-vulnerabilities": "unt_01a00129-87da-7a74-8dee-8f00b392e79e",
        "business-logic-race-conditions-and-api-security": "unt_01a00129-87da-769a-9f23-107efdd117e8",
        "testing-methodology-remediation-and-an-ethical-security-report": "unt_01a00129-87da-7590-9ef9-a5238f4cf126"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c60d-7a4a-b66d-508f8f95329e",
        "final": "asm_019fab2b-c60e-7556-9fe3-41f4aa2e4512"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87da-79f7-9063-ff31fa38cfe9",
        "final": "asv_01a00129-87da-7779-bea6-c0978e5626d6"
      },
      "resourceId": "res_019fab2b-c611-73fd-9ca4-9a6edde4ef20",
      "resourceVersionId": "rsv_01a00129-87da-7373-b6f6-5e4542fdb910",
      "accessOfferId": "acc_01a00129-87da-720e-a92a-9cf35b43a65f",
      "rightsRecordId": "rgt_01a00129-87da-723d-a507-366ee92c9a56",
      "freshnessRecordId": "frs_01a00129-87da-7493-b760-88168e680220",
      "provenanceEvidenceId": "prvdc_01a00129-87da-7b41-a209-896373ebe75d",
      "requirementOptionId": "opt_01a00129-87da-78de-ab45-7570b3e29bb8",
      "schedulePlacementId": "plc_01a00129-87da-7673-977d-9a6df348367a",
      "competencyMappingIds": {
        "security": "cpm_01a00129-87da-7933-8483-243fd0622aa2",
        "systems": "cpm_01a00129-87da-7f8a-b204-b1b73912c7dc"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87da-77cd-8a65-d986b4772132"
    },
    "human-computer-interaction": {
      "courseId": "crs_019fab2b-c61c-7789-b0a0-bc411cff6e88",
      "courseVersionId": "crv_01a00129-87da-7b23-94e7-4aeadf30d282",
      "learningUnitIds": {
        "human-centered-design-and-ethical-research": "unt_01a00129-87da-7d79-ad0d-ba6a18c54509",
        "interviews-observation-and-task-analysis": "unt_01a00129-87da-759a-bbd8-3595594de955",
        "personas-scenarios-requirements-and-design-goals": "unt_01a00129-87da-7cba-ae54-19999993d546",
        "sketching-storyboards-and-design-alternatives": "unt_01a00129-87da-706c-8e12-049cb9552f85",
        "low-fidelity-prototypes-and-heuristic-evaluation": "unt_01a00129-87da-78b2-ad10-82c5ca3e952f",
        "interactive-prototypes-and-accessibility": "unt_01a00129-87da-7295-8ecb-f46d9372061b",
        "usability-studies-measures-and-analysis": "unt_01a00129-87da-7b54-8c60-73f9ec7637c5",
        "iteration-design-rationale-and-a-tested-product-prototype": "unt_01a00129-87da-73e3-aa08-ae683005bc42"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c626-7aa4-8747-c6f6a378b820",
        "final": "asm_019fab2b-c627-790a-b4a9-eb0d44d3e4cc"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7842-b8e4-e8898f2ed472",
        "final": "asv_01a00129-87db-78b4-bbe6-257b8d26e88d"
      },
      "resourceId": "res_019fab2b-c62a-7394-8cb3-8aa9accdf00d",
      "resourceVersionId": "rsv_01a00129-87db-7659-b5da-3b3b5bab8fcc",
      "accessOfferId": "acc_01a00129-87db-7905-9670-4354d5917257",
      "rightsRecordId": "rgt_01a00129-87db-74d5-8857-591d15372e24",
      "freshnessRecordId": "frs_01a00129-87db-7094-9969-34e7b6d5d57c",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7450-8ffc-429c326f0e63",
      "requirementOptionId": "opt_01a00129-87db-7800-b1e3-7c20e0ee5146",
      "schedulePlacementId": "plc_01a00129-87db-7fef-a35f-9e1a813a991a",
      "competencyMappingIds": {
        "human-centered": "cpm_01a00129-87db-7c7b-8e99-4db8098e7472",
        "professional": "cpm_01a00129-87db-7034-8d90-765319097312"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-76f3-ad5a-424f53b3c66f"
    },
    "artificial-intelligence": {
      "courseId": "crs_019fab2b-c635-7c60-8a3a-616611953bb3",
      "courseVersionId": "crv_01a00129-87db-7d13-afd4-3fc9f673dffa",
      "learningUnitIds": {
        "agents-state-spaces-and-uninformed-search": "unt_01a00129-87db-7a2a-b54e-89419ff1c5c8",
        "heuristics-a-star-and-search-quality": "unt_01a00129-87db-76a8-aa16-4a7c24b58648",
        "games-minimax-and-adversarial-search": "unt_01a00129-87db-7aec-aaed-4775f1baab7c",
        "constraint-satisfaction-problems": "unt_01a00129-87db-7aff-aaa6-1d7095eb95e1",
        "probability-bayes-nets-and-inference": "unt_01a00129-87db-7b94-86ce-4be4c855cb40",
        "markov-models-and-decision-processes": "unt_01a00129-87db-71a8-8056-052908d700f5",
        "reinforcement-learning-and-value-estimation": "unt_01a00129-87db-703c-b5c2-ad292f69ae38",
        "machine-learning-overview-and-an-intelligent-agent-project": "unt_01a00129-87db-7fbe-85d3-cd75b76973d4"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c63f-7d8e-ac04-60506080043c",
        "final": "asm_019fab2b-c640-7de6-92b0-c4c83a815ed7"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7aab-8f2d-e1554006b902",
        "final": "asv_01a00129-87db-799e-b151-7e6daf3b249e"
      },
      "resourceId": "res_019fab2b-c643-76b9-ba76-f118f6d248ce",
      "resourceVersionId": "rsv_01a00129-87db-7cd2-93ba-3abe6b1b22f6",
      "accessOfferId": "acc_01a00129-87db-7e32-8f35-fde4853382b4",
      "rightsRecordId": "rgt_01a00129-87db-7e6e-832b-4beda29e9b1b",
      "freshnessRecordId": "frs_01a00129-87db-76ba-9461-7ef3da7f95d4",
      "provenanceEvidenceId": "prvdc_01a00129-87db-770c-851f-9a667f0f7425",
      "requirementOptionId": "opt_01a00129-87db-7223-a911-e748d79be300",
      "schedulePlacementId": "plc_01a00129-87db-77bf-a786-66da2a8b7ed4",
      "competencyMappingIds": {
        "ai-data": "cpm_01a00129-87db-730a-8e74-cea1376bd47f",
        "algorithms": "cpm_01a00129-87db-7aa4-a608-c96006835d22"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7871-a776-90d03e3d1a58"
    },
    "machine-learning": {
      "courseId": "crs_019fab2b-c64e-7c1a-8125-cf04c32b2ec7",
      "courseVersionId": "crv_01a00129-87db-7539-baf0-1c5d079d284f",
      "learningUnitIds": {
        "linear-regression-empirical-risk-and-gradient-optimization": "unt_01a00129-87db-77c5-b7e3-9b6b12f0be80",
        "classification-logistic-models-and-decision-boundaries": "unt_01a00129-87db-75be-9245-c2bcf60898f9",
        "margin-based-classification-kernels-and-features": "unt_01a00129-87db-7c4d-90a2-acd4d08d5ea2",
        "generalization-regularization-and-model-selection": "unt_01a00129-87db-7545-8199-b7477dcbc9dc",
        "neural-networks-backpropagation-and-optimization": "unt_01a00129-87db-7b57-9384-b4d085121509",
        "probabilistic-models-latent-variables-and-inference": "unt_01a00129-87db-747f-8281-23301444a275",
        "reinforcement-learning-and-sequential-decisions": "unt_01a00129-87db-7048-8ec5-f38bc5666ff4",
        "model-comparison-error-analysis-fairness-and-defense": "unt_01a00129-87db-72be-85b3-f9a26a7d1af6"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c658-75d3-a638-fb83b8f2c5f1",
        "final": "asm_019fab2b-c659-74e9-97e6-74256fb513e5"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7d7f-b3d8-16031e8cc532",
        "final": "asv_01a00129-87db-7eba-b4d1-9c74aa6a5232"
      },
      "resourceId": "res_019fbc95-3323-7fd8-ad40-bccfa7bcb293",
      "resourceVersionId": "rsv_01a00129-87db-7a40-974a-f91ede0153e6",
      "accessOfferId": "acc_01a00129-87db-72ab-8635-d0a1fd10ede4",
      "rightsRecordId": "rgt_01a00129-87db-7432-b4ab-88879f5e26da",
      "freshnessRecordId": "frs_01a00129-87db-7f37-a292-35871c8dcfbe",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7fcb-b9eb-407b87e744b9",
      "requirementOptionId": "opt_01a00129-87db-79fe-a592-a761441decec",
      "schedulePlacementId": "plc_01a00129-87db-7672-81c5-037d34e58782",
      "competencyMappingIds": {
        "ai-data": "cpm_01a00129-87db-7aa0-8bee-64a0c6d37034",
        "mathematics": "cpm_01a00129-87db-7fd4-a882-e4b53b6dd860",
        "professional": "cpm_01a00129-87db-7100-bb36-24e0ed47771d"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-74b9-9085-edeff30690c0"
    },
    "distributed-systems": {
      "courseId": "crs_019fab2b-c668-7b6a-8096-ed4ce2cb8c10",
      "courseVersionId": "crv_01a00129-87db-753f-999a-9cc0371220a9",
      "learningUnitIds": {
        "distributed-system-models-and-remote-procedure-calls": "unt_01a00129-87db-72d4-bf28-f6f10ba4bdb0",
        "time-ordering-concurrency-and-failure": "unt_01a00129-87db-72be-8f7a-cd174155954c",
        "primary-backup-replication-and-state-machines": "unt_01a00129-87db-7b09-8ef4-4e082abe3c8f",
        "consensus-and-the-raft-protocol": "unt_01a00129-87db-7b6d-ba26-13a7d3cfca7b",
        "fault-tolerant-key-value-services": "unt_01a00129-87db-7f95-9d7b-2eb08a9ceff0",
        "sharding-reconfiguration-and-transactions": "unt_01a00129-87db-7c0b-a13c-9145e84dbc95",
        "consistency-models-and-distributed-storage": "unt_01a00129-87db-7e2d-8d20-1f6d96f6d370",
        "measurement-testing-under-failure-and-a-replicated-service": "unt_01a00129-87db-75a0-a8ff-5a5ebf64e18e"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c672-77f4-9737-2493d90a1497",
        "final": "asm_019fab2b-c673-7b04-a428-fad7065170a1"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7848-a252-78f0163e41db",
        "final": "asv_01a00129-87db-723d-8241-160b280e4e58"
      },
      "resourceId": "res_019fab2b-c676-7039-b471-3e8584522bfb",
      "resourceVersionId": "rsv_01a00129-87db-7d86-b180-5ffc11d02bad",
      "accessOfferId": "acc_01a00129-87db-7b2a-89d2-6c56ab4e87e4",
      "rightsRecordId": "rgt_01a00129-87db-7124-8da9-60ace72035ed",
      "freshnessRecordId": "frs_01a00129-87db-751a-9ba8-399d737c7874",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7a80-86c8-468e0d9b8a7d",
      "requirementOptionId": "opt_01a00129-87db-762a-ac5d-c1c87fa18287",
      "schedulePlacementId": "plc_01a00129-87db-709e-bd7b-7f34da41ad7a",
      "competencyMappingIds": {
        "networks": "cpm_01a00129-87db-7f30-995a-ffceed808578",
        "systems": "cpm_01a00129-87db-7098-8897-cad753e843f2",
        "data": "cpm_01a00129-87db-700a-9efd-2cb719953d68"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-758e-8a5c-8c4cedd77d2a"
    },
    "computing-ethics": {
      "courseId": "crs_019fab2b-c682-7506-9b52-ecc3009e2ee2",
      "courseVersionId": "crv_01a00129-87db-71df-9064-be15eb0745f6",
      "learningUnitIds": {
        "sociotechnical-systems-and-ethical-argument": "unt_01a00129-87db-7979-97fa-97a8a537e839",
        "benefit-harm-non-maleficence-and-uncertainty": "unt_01a00129-87db-7e86-9bef-b4d0adec0dab",
        "responsibility-accountability-and-governance": "unt_01a00129-87db-7e8b-9921-f212b1539754",
        "transparency-explanation-and-contestability": "unt_01a00129-87db-70ba-b8a1-f618cd97ffbf",
        "privacy-autonomy-and-human-rights": "unt_01a00129-87db-7952-8f67-6f5d6110b5df",
        "fairness-discrimination-and-measurement": "unt_01a00129-87db-73ea-a9a5-0aca73bcdc6c",
        "professional-duties-and-responsible-development": "unt_01a00129-87db-7451-84a2-8eb38abd49bc",
        "case-synthesis-safeguards-and-a-public-ethics-review": "unt_01a00129-87db-78f0-aece-c577c79d6d4d"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c68c-7f3e-8248-493b73a666ff",
        "final": "asm_019fab2b-c68d-7e8f-8085-8cac620e25cf"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7f5f-b750-7a4535071b18",
        "final": "asv_01a00129-87db-762e-afa9-eb2c092963e2"
      },
      "resourceId": "res_019fab2b-c690-73d7-a9e3-4eeca5ce86a4",
      "resourceVersionId": "rsv_01a00129-87db-7f91-b281-9450f56a6687",
      "accessOfferId": "acc_01a00129-87db-74c1-b0e3-9bd3c64e5658",
      "rightsRecordId": "rgt_01a00129-87db-7b57-a560-cae85fdd7bfe",
      "freshnessRecordId": "frs_01a00129-87db-70c0-b5fc-8275e0685e52",
      "provenanceEvidenceId": "prvdc_01a00129-87db-75d5-9a8b-ebdda1642797",
      "requirementOptionId": "opt_01a00129-87db-7ad2-98e5-7bb64586c97b",
      "schedulePlacementId": "plc_01a00129-87db-7c7a-8910-dfb021d2d12d",
      "competencyMappingIds": {
        "ethics": "cpm_01a00129-87db-73cb-b132-ba057fd2bc4e",
        "professional": "cpm_01a00129-87db-76d3-bd00-847e4ea7d5ea"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7cae-8c64-286df44f529a"
    },
    "capstone-1": {
      "courseId": "crs_019fab2b-c69b-7f2c-b447-ddb76d9db25d",
      "courseVersionId": "crv_01a00129-87db-7d9f-a44f-c5fb57ce9c43",
      "learningUnitIds": {
        "problem-discovery-stakeholders-and-evidence": "unt_01a00129-87db-79f7-b734-e2e49c83f407",
        "scope-success-criteria-constraints-and-non-goals": "unt_01a00129-87db-7c00-a792-0ae2384b5bab",
        "command-line-and-development-environment-reproducibility": "unt_01a00129-87db-707c-9594-3f0606e42124",
        "version-control-collaboration-and-project-planning": "unt_01a00129-87db-73e9-b935-0be462210f37",
        "architecture-options-and-risk-spikes": "unt_01a00129-87db-73f0-9ce7-d8daceb1ab9b",
        "debugging-profiling-and-prototype-measurement": "unt_01a00129-87db-7b89-838b-2cbd7fc4cc64",
        "security-ethics-accessibility-and-failure-planning": "unt_01a00129-87db-7126-9fb1-974f179f338b",
        "proposal-prototype-schedule-and-oral-defense": "unt_01a00129-87db-7412-a000-e55daaa8b657"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6a5-760e-b579-132c07ed064a",
        "final": "asm_019fab2b-c6a6-7c66-b69a-abedf4602102"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7ec3-9c08-12c87d2bd876",
        "final": "asv_01a00129-87db-76a3-8fbd-387a457df86e"
      },
      "resourceId": "res_019fab2b-c6a9-71e2-b400-7cb8dfff8ee5",
      "resourceVersionId": "rsv_01a00129-87db-72cd-8455-8ee5410364bc",
      "accessOfferId": "acc_01a00129-87db-7b71-bb7a-8909b6cb8465",
      "rightsRecordId": "rgt_01a00129-87db-78d3-a78a-d78958d75bcf",
      "freshnessRecordId": "frs_01a00129-87db-77ce-ac58-2bf075a4e11d",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7fd4-8ff5-4ae204c04c85",
      "requirementOptionId": "opt_01a00129-87db-7937-9fe3-510ff273166f",
      "schedulePlacementId": "plc_01a00129-87db-75f8-8040-846048f18317",
      "competencyMappingIds": {
        "capstone": "cpm_01a00129-87db-73d4-b360-711abc922e23",
        "software": "cpm_01a00129-87db-7236-b469-b45a2bf92b05",
        "professional": "cpm_01a00129-87db-7503-b2ed-b3e8103efabf"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7e35-bfbf-a81d12b95f9e"
    },
    "data-science": {
      "courseId": "crs_019fab2b-c6b5-7e2a-a460-ea3b3f188410",
      "courseVersionId": "crv_01a00129-87db-78fe-8013-ef5f44c1245b",
      "learningUnitIds": {
        "data-generating-processes-tables-and-reproducibility": "unt_01a00129-87db-7baf-8035-d048c6696daf",
        "cleaning-transformation-and-exploratory-visualization": "unt_01a00129-87db-74ab-bc76-1511f63ee8c9",
        "sampling-empirical-distributions-and-simulation": "unt_01a00129-87db-7e4e-a5ba-33a7c6e085d8",
        "estimation-confidence-intervals-and-uncertainty": "unt_01a00129-87db-7420-9fca-0402524225a4",
        "hypothesis-testing-and-error": "unt_01a00129-87db-7d44-8c4d-2e9d32cd1573",
        "association-correlation-and-linear-prediction": "unt_01a00129-87db-77c7-ab6a-61aa84ce4c58",
        "classification-evaluation-and-fairness": "unt_01a00129-87db-7328-ada6-4954d7cb91c3",
        "end-to-end-investigation-and-an-evidence-aware-report": "unt_01a00129-87db-7bf5-8ace-c57b77a7023d"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6bf-74d8-a86c-4e2041aaece2",
        "final": "asm_019fab2b-c6c0-7b7e-b932-c779cc242723"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7cc4-bf11-dbd9e71d349d",
        "final": "asv_01a00129-87db-7e3f-ab25-e0975cb60fe9"
      },
      "resourceId": "res_019fab2b-c6c3-78f4-af43-d602b397e2db",
      "resourceVersionId": "rsv_01a00129-87db-7b9a-b38b-381c8263c5be",
      "accessOfferId": "acc_01a00129-87db-751b-83c7-1e266798a4de",
      "rightsRecordId": "rgt_01a00129-87db-77a5-b498-0f38e78ecc28",
      "freshnessRecordId": "frs_01a00129-87db-7654-9253-2d656b24f607",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7b10-987f-4ad63efae8d3",
      "requirementOptionId": "opt_01a00129-87db-7d0a-9bc7-9a10d8349d52",
      "schedulePlacementId": "plc_01a00129-87db-7317-99d0-ad74f24e8d83",
      "competencyMappingIds": {
        "ai-data": "cpm_01a00129-87db-7624-87b7-a2c64cadc745",
        "data": "cpm_01a00129-87db-7dbb-9cb5-6a7a097b0b63",
        "professional": "cpm_01a00129-87db-776a-a8be-7faacbb01853"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7189-b259-1a685c674285"
    },
    "research-methods": {
      "courseId": "crs_019fab2b-c6cf-7c6e-99e3-4d83a4a58b24",
      "courseVersionId": "crv_01a00129-87db-72f0-8208-3564df16a1a1",
      "learningUnitIds": {
        "research-questions-claims-contribution-types-and-paper-reading": "unt_01a00129-87db-74f6-bf90-8a3bec8807d3",
        "potential-outcomes-counterfactuals-and-estimands": "unt_01a00129-87db-7240-8753-dd666bb5ce37",
        "randomized-experiments-power-and-common-validity-threats": "unt_01a00129-87db-743f-a5d5-ab3f208c9528",
        "causal-diagrams-confounding-and-identification-assumptions": "unt_01a00129-87db-7c89-bcf6-936176183373",
        "regression-diagnostics-and-responsible-interpretation": "unt_01a00129-87db-77aa-a9d8-b0c8ccd6bb60",
        "benchmarks-as-measurement-instruments": "unt_01a00129-87db-73d7-b081-92a9b948475f",
        "quasi-experiments-reproducibility-and-research-ethics": "unt_01a00129-87db-712e-8c45-200a5a9ddba4",
        "literature-synthesis-analysis-plans-and-a-defensible-proposal": "unt_01a00129-87db-7784-8fec-2a4502f61a6f"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6d9-7a06-bbf1-36ec6cff43ba",
        "final": "asm_019fab2b-c6da-7b26-9138-d88b262a5ff9"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-75d8-883c-242a010baa61",
        "final": "asv_01a00129-87db-7c9b-bc1e-ca7f86fc3e69"
      },
      "resourceId": "res_019fab2b-c6dd-7060-94f4-b8bc0107fa1e",
      "resourceVersionId": "rsv_01a00129-87db-73de-89cf-b4b78bea41e6",
      "accessOfferId": "acc_01a00129-87db-7cfc-a559-2f6c95908465",
      "rightsRecordId": "rgt_01a00129-87db-73c6-99a4-64f76074212f",
      "freshnessRecordId": "frs_01a00129-87db-7c01-9f69-b65f9cbd33c8",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7525-88df-8ea4cffaa0ec",
      "requirementOptionId": "opt_01a00129-87db-7052-bf17-8aa3979106b7",
      "schedulePlacementId": "plc_01a00129-87db-797d-8770-b017d968e90a",
      "competencyMappingIds": {
        "research": "cpm_01a00129-87db-74c8-944c-91d1b01c083e",
        "professional": "cpm_01a00129-87db-7aa7-9cfd-6176079b8400",
        "mathematics": "cpm_01a00129-87db-7258-a4fe-4a3e5b5aab2c"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7733-9946-79ff33cb4844"
    },
    "capstone-2": {
      "courseId": "crs_019fab2b-c6e9-7dd6-aa30-267f79e2b4fa",
      "courseVersionId": "crv_01a00129-87db-7d64-897a-5f1838e46e40",
      "learningUnitIds": {
        "reconfirming-requirements-risks-and-evaluation-plan": "unt_01a00129-87db-7d65-b113-782ed208a0ec",
        "vertical-slice-implementation-and-continuous-integration": "unt_01a00129-87db-7255-a7ba-2552b43d6b21",
        "design-review-and-evidence-driven-reprioritization": "unt_01a00129-87db-7b00-a158-a6edfa68b6f0",
        "testing-security-review-and-accessibility-review": "unt_01a00129-87db-7cf5-b8d5-1dfcee899382",
        "performance-reliability-and-failure-testing": "unt_01a00129-87db-75c3-b86a-3d86541cd8ff",
        "user-or-system-evaluation-and-analysis": "unt_01a00129-87db-726b-8397-100bfd73e0e3",
        "documentation-release-reproducibility-and-handoff": "unt_01a00129-87db-70ea-b280-26ef5cd61f4a",
        "final-artifact-portfolio-retrospective-and-public-defense": "unt_01a00129-87db-7059-975a-a726de64281c"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c6f3-7ca1-addb-dddb524da3b2",
        "final": "asm_019fab2b-c6f4-7367-96d8-9d8a479c823c"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7155-a497-b2db76095be7",
        "final": "asv_01a00129-87db-7cb0-ac8e-5134ead1d3a8"
      },
      "resourceId": "res_019fab2b-c6f7-7cfc-a7bd-cdd37c7bf7dd",
      "resourceVersionId": "rsv_01a00129-87db-74df-adbc-a3c32545b63b",
      "accessOfferId": "acc_01a00129-87db-7499-a22e-0b7629cb4338",
      "rightsRecordId": "rgt_01a00129-87db-75ba-bc7e-9f9586684d3a",
      "freshnessRecordId": "frs_01a00129-87db-7544-b004-a97569baa59c",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7499-9193-e5731a594782",
      "requirementOptionId": "opt_01a00129-87db-7134-a134-ccc47e3e73a6",
      "schedulePlacementId": "plc_01a00129-87db-79c9-94b5-a065d66b4693",
      "competencyMappingIds": {
        "capstone": "cpm_01a00129-87db-722a-87aa-9d2a8ad4b5e7",
        "software": "cpm_01a00129-87db-714b-9caa-f46eae7db540",
        "research": "cpm_01a00129-87db-78c9-9add-62e7e8c18464",
        "professional": "cpm_01a00129-87db-71b0-be29-d92a6b7976a3"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7c74-8e89-8a44e97be9fc"
    },
    "computer-graphics": {
      "courseId": "crs_019fab2b-c704-70b8-9bff-e18fdd1f8301",
      "courseVersionId": "crv_01a00129-87db-700c-87a3-5b4f238b67c2",
      "learningUnitIds": {
        "images-as-data-rasterization-and-sampling": "unt_01a00129-87db-7f91-b28a-39d25cc70913",
        "transforms-coordinate-systems-and-texture-mapping": "unt_01a00129-87db-7f14-93a9-75bbad35c95f",
        "geometry-processing-and-half-edge-meshes": "unt_01a00129-87db-7d78-b4cd-a0c6a13f8ba0",
        "curves-surfaces-and-mesh-editing": "unt_01a00129-87db-7043-8c49-2fbcec93f8de",
        "ray-generation-intersections-and-acceleration": "unt_01a00129-87db-7ad2-bfee-80a7d5cda89b",
        "lighting-materials-and-global-illumination": "unt_01a00129-87db-718a-a607-3e33b4cfb859",
        "animation-numerical-integration-and-simulation": "unt_01a00129-87db-77a4-9b7e-911bf0d506f0",
        "rendering-system-evaluation-and-a-graphics-project": "unt_01a00129-87db-7985-9139-d3ffb16ed170"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c70e-7aeb-a960-6048a2e29078",
        "final": "asm_019fab2b-c70f-7abf-b863-fd7964413255"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-74a6-ab0a-3c9e259ef325",
        "final": "asv_01a00129-87db-787f-ac69-1330410fd9b7"
      },
      "resourceId": "res_019fab2b-c712-7ae4-9aee-b52ac70c9f14",
      "resourceVersionId": "rsv_01a00129-87db-73e2-8f02-b46f42fe8580",
      "accessOfferId": "acc_01a00129-87db-7b9a-9f0a-4ab831774c38",
      "rightsRecordId": "rgt_01a00129-87db-7d88-ac95-4f9c59b3c514",
      "freshnessRecordId": "frs_01a00129-87db-7837-8edc-004fbc7ad8bf",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7311-9904-2d9890ac1445",
      "requirementOptionId": "opt_01a00129-87db-7a8a-949a-4c25de6eafab",
      "schedulePlacementId": "plc_01a00129-87db-7df0-bd93-7cca9bde6d4b",
      "competencyMappingIds": {
        "graphics": "cpm_01a00129-87db-79e8-ab3d-dd448424dce9",
        "programming": "cpm_01a00129-87db-7984-ae6a-fcc78c9ff260",
        "mathematics": "cpm_01a00129-87db-754d-b215-ae87116a56cd"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7437-9f9b-40a5c066d7e5"
    },
    "computer-vision": {
      "courseId": "crs_019fab2b-c71e-7f89-b92a-8bf225d96f37",
      "courseVersionId": "crv_01a00129-87db-788c-89be-4beb97b3104a",
      "learningUnitIds": {
        "image-classification-and-data-driven-recognition": "unt_01a00129-87db-7912-bc58-1032016d9823",
        "linear-classifiers-loss-functions-and-optimization": "unt_01a00129-87db-732d-b6f6-9ef9a48ae61a",
        "neural-networks-and-backpropagation": "unt_01a00129-87db-7a98-a520-4285af1529b6",
        "convolutional-architectures-and-training": "unt_01a00129-87db-71f1-bbc0-75683dbbe65a",
        "regularization-transfer-learning-and-augmentation": "unt_01a00129-87db-7427-af5e-5cb7822addc7",
        "detection-segmentation-and-localization": "unt_01a00129-87db-7ba5-8966-613fe8b6690e",
        "visualization-interpretation-bias-and-robustness": "unt_01a00129-87db-76b6-b15d-a9559d0378ed",
        "reproducible-vision-experiment-and-model-report": "unt_01a00129-87db-7156-b1d6-755458fbc227"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c728-7c24-8337-16a86d39b173",
        "final": "asm_019fab2b-c729-7f06-9d1d-7310a1eadeb0"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7d48-9672-9830b6c668c4",
        "final": "asv_01a00129-87db-746e-b7aa-c8dfbb19a3c6"
      },
      "resourceId": "res_019fab2b-c72c-7ae1-93da-253ce52d02d6",
      "resourceVersionId": "rsv_01a00129-87db-70df-902d-7e2a1e7051b5",
      "accessOfferId": "acc_01a00129-87db-7ec1-ae39-1dce38b81854",
      "rightsRecordId": "rgt_01a00129-87db-79c1-b87c-c132b6b1a541",
      "freshnessRecordId": "frs_01a00129-87db-708e-a32c-29d6974225c1",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7f54-9423-970b600ca75d",
      "requirementOptionId": "opt_01a00129-87db-73c9-9ec9-7060948ec966",
      "schedulePlacementId": "plc_01a00129-87db-729a-bbee-913617b166e8",
      "competencyMappingIds": {
        "ai-data": "cpm_01a00129-87db-70f7-ad5b-2ba71c227e93",
        "graphics": "cpm_01a00129-87db-7125-897f-34a38895097d"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-76c7-9c5c-3d00a46b3729"
    },
    "natural-language-processing": {
      "courseId": "crs_019fab2b-c737-7e1d-9f06-097886bbaa36",
      "courseVersionId": "crv_01a00129-87db-7438-92f4-5e4df8ff925e",
      "learningUnitIds": {
        "language-structure-tokenization-and-distributional-meaning": "unt_01a00129-87db-75b6-b2f4-525dfdb47c64",
        "word-vectors-and-representation-geometry": "unt_01a00129-87db-7892-8c32-6a137b2b7e06",
        "neural-sequence-models-and-recurrent-networks": "unt_01a00129-87db-753e-ba27-b8d7ea80bd9c",
        "attention-and-encoder-decoder-models": "unt_01a00129-87db-7dea-83c1-dfe63a5c707e",
        "transformers-and-pretrained-language-models": "unt_01a00129-87db-7d2e-9847-f672049692e7",
        "question-answering-generation-and-retrieval": "unt_01a00129-87db-733e-8ae5-d584bce39378",
        "evaluation-hallucination-bias-and-safety": "unt_01a00129-87db-7d50-a55b-48e47d748591",
        "reproducible-nlp-system-and-model-documentation": "unt_01a00129-87db-7a50-9d58-0ba7a3047170"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c741-7ce0-9e14-0ddf004f6504",
        "final": "asm_019fab2b-c742-7c6c-901e-f7f6175c9749"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-76a9-a190-286f0d02df4a",
        "final": "asv_01a00129-87db-7aca-bf16-b2de22e9fb6e"
      },
      "resourceId": "res_019fab2b-c745-72a1-ab62-fac44b3f4448",
      "resourceVersionId": "rsv_01a00129-87db-7886-a450-b949984e1a21",
      "accessOfferId": "acc_01a00129-87db-7af9-9b81-f553ae6b9ac2",
      "rightsRecordId": "rgt_01a00129-87db-7618-a0bc-28cb63eb507d",
      "freshnessRecordId": "frs_01a00129-87db-7fa9-944e-66f206bcb2c6",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7676-869b-f230ceb235ed",
      "requirementOptionId": "opt_01a00129-87db-7f79-b3e5-561aff5739a6",
      "schedulePlacementId": "plc_01a00129-87db-7cd4-89a6-ad7891616731",
      "competencyMappingIds": {
        "ai-data": "cpm_01a00129-87db-7d8a-b56e-5c97484b3b44",
        "professional": "cpm_01a00129-87db-7b93-9c1e-a15a08015af8"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7a7c-a362-d6ebceb7c8e2"
    },
    "parallel-computing": {
      "courseId": "crs_019fab2b-c750-79ad-ba54-8668903ec859",
      "courseVersionId": "crv_01a00129-87db-7f5b-ab06-b618af87c847",
      "learningUnitIds": {
        "computation-dags-work-span-and-parallelism": "unt_01a00129-87db-788c-ad8b-3c143e3a2d39",
        "work-efficiency-scheduling-and-brent-s-theorem": "unt_01a00129-87db-702a-a34b-854b06d1b843",
        "parallel-divide-and-conquer-and-sequence-algorithms": "unt_01a00129-87db-7c48-8eff-558c8620c8aa",
        "scan-prefix-computation-and-parallel-data-structures": "unt_01a00129-87db-7818-be11-af0d5119b30e",
        "shared-memory-synchronization-and-contention": "unt_01a00129-87db-7284-9497-8dc636bdaae6",
        "distributed-memory-message-passing-and-decomposition": "unt_01a00129-87db-73dd-9623-bfccccec2eb6",
        "locality-caches-profiling-and-scaling-analysis": "unt_01a00129-87db-7da2-b894-1dc82c4055f4",
        "work-efficient-parallel-implementation-and-defense": "unt_01a00129-87db-7092-9b02-9fa331284bbf"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c75a-707a-b128-428c8e0b3c7d",
        "final": "asm_019fab2b-c75b-79a0-9392-3580343e662a"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7124-883b-861386f7f7d5",
        "final": "asv_01a00129-87db-7676-ade1-c922725bf016"
      },
      "resourceId": "res_019fbc95-333a-7184-8c95-696477349592",
      "resourceVersionId": "rsv_01a00129-87db-717b-b2f7-69f0ba54d226",
      "accessOfferId": "acc_01a00129-87db-75d3-a9e7-dfffe929fd72",
      "rightsRecordId": "rgt_01a00129-87db-7d97-bfbc-a117efc98e84",
      "freshnessRecordId": "frs_01a00129-87db-7c0c-9621-c13c328f2e0a",
      "provenanceEvidenceId": "prvdc_01a00129-87db-71bb-bc0c-57a38e153e83",
      "requirementOptionId": "opt_01a00129-87db-73c7-9b21-500bf4a8c745",
      "schedulePlacementId": "plc_01a00129-87db-7927-a9b7-9b6fca4d113c",
      "competencyMappingIds": {
        "systems": "cpm_01a00129-87db-7981-a5f2-7c05bf97079b",
        "algorithms": "cpm_01a00129-87db-79fe-ac3e-4b3f85298887"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7560-88c4-3237b2701028"
    },
    "android-development": {
      "courseId": "crs_019fab2b-c769-7a2e-b55f-7443fae87ba8",
      "courseVersionId": "crv_01a00129-87db-737e-a8e7-d0be75a30a12",
      "learningUnitIds": {
        "kotlin-fundamentals-and-android-project-structure": "unt_01a00129-87db-77a9-ae90-e9518e34cb03",
        "compose-ui-layouts-and-theming": "unt_01a00129-87db-7e00-96cd-0459e10bfdbe",
        "state-events-and-lifecycle-aware-design": "unt_01a00129-87db-79a0-bb7a-256bde98c48b",
        "navigation-and-adaptive-interfaces": "unt_01a00129-87db-71e9-b35b-4a0f60faec79",
        "architecture-view-models-and-data-layers": "unt_01a00129-87db-760f-b11f-ff2db06e3256",
        "persistence-networking-and-offline-behavior": "unt_01a00129-87db-7b99-ad10-085d8aa67f1e",
        "accessibility-testing-and-performance": "unt_01a00129-87db-7866-a8fa-34ba562cf9fb",
        "release-preparation-and-a-complete-android-application": "unt_01a00129-87db-769d-b4d0-3498fa94efad"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c773-7d4e-b287-db6bfa2e4498",
        "final": "asm_019fab2b-c774-7cfd-9912-e86f1ad6e487"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-70c6-b06b-a257f5578a56",
        "final": "asv_01a00129-87db-76f8-942d-5ed4d902c7c7"
      },
      "resourceId": "res_019fab2b-c777-7c7b-bb51-361c67aa9208",
      "resourceVersionId": "rsv_01a00129-87db-733c-b9d4-5c69af3eda3b",
      "accessOfferId": "acc_01a00129-87db-7fca-93b6-ce437f8b84b2",
      "rightsRecordId": "rgt_01a00129-87db-75b8-97f0-b5669495ba31",
      "freshnessRecordId": "frs_01a00129-87db-73ca-a5c7-39a03703bae7",
      "provenanceEvidenceId": "prvdc_01a00129-87db-781c-8598-002642ec684f",
      "requirementOptionId": "opt_01a00129-87db-774f-90d8-a89bc902cf7a",
      "schedulePlacementId": "plc_01a00129-87db-7b16-b75f-0167a6ee0d2a",
      "competencyMappingIds": {
        "software": "cpm_01a00129-87db-7552-b307-88edbc637828",
        "human-centered": "cpm_01a00129-87db-719b-849f-ea03f7598b05"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7cd1-a836-5abee8c1c670"
    },
    "applied-cryptography": {
      "courseId": "crs_019fab2b-c782-7de7-a4aa-d6d09b307afd",
      "courseVersionId": "crv_01a00129-87db-7f11-be21-9533647832b1",
      "learningUnitIds": {
        "security-definitions-adversaries-and-threat-models": "unt_01a00129-87db-796f-b83f-3c328a56c948",
        "one-time-pads-stream-ciphers-and-pseudorandomness": "unt_01a00129-87db-78c8-8a63-4c4c7e0e34cd",
        "block-ciphers-and-modes-of-operation": "unt_01a00129-87db-76db-a685-d1ee60d4ba83",
        "message-authentication-and-authenticated-encryption": "unt_01a00129-87db-7f42-b8fa-0f17369ae65b",
        "hash-functions-and-password-storage": "unt_01a00129-87db-73a2-9fb6-5cf99057f385",
        "public-key-encryption-and-number-theoretic-foundations": "unt_01a00129-87db-7b28-b3bf-cc05f628fe71",
        "key-exchange-digital-signatures-and-certificates": "unt_01a00129-87db-750a-b474-51dc4afd6e1e",
        "protocol-composition-implementation-failures-and-a-security-analysis": "unt_01a00129-87db-77e5-acc9-70748f13c335"
      },
      "assessmentIds": {
        "applied": "asm_019fab2b-c78c-7f07-8b8b-cddcbe159adf",
        "final": "asm_019fab2b-c78d-7707-afde-287836607320"
      },
      "assessmentVersionIds": {
        "applied": "asv_01a00129-87db-7346-80d7-79bf7c17f185",
        "final": "asv_01a00129-87db-7e84-9790-6a6f7b36ca3b"
      },
      "resourceId": "res_019fab2b-c790-7469-91f1-98cbfddcbe83",
      "resourceVersionId": "rsv_01a00129-87db-779b-9ef7-4ff5134393fb",
      "accessOfferId": "acc_01a00129-87db-73d5-9fef-0fd1a09f054b",
      "rightsRecordId": "rgt_01a00129-87db-7d7d-93f6-eba7483424b6",
      "freshnessRecordId": "frs_01a00129-87db-7a34-9e24-c785747dc8ea",
      "provenanceEvidenceId": "prvdc_01a00129-87db-7f80-a383-574d1f6845f0",
      "requirementOptionId": "opt_01a00129-87db-7128-b59c-e0f20b0b63c1",
      "schedulePlacementId": "plc_01a00129-87db-7bf5-b4c2-8b1e101eaf27",
      "competencyMappingIds": {
        "security": "cpm_01a00129-87db-7465-b332-1ebf748bf2c4",
        "mathematics": "cpm_01a00129-87db-7549-a7ad-cea05d9e05cd"
      },
      "finalAssessmentMappingId": "cpm_01a00129-87db-7180-b7be-a31f41a3ef5e"
    }
  }
} as const;

function collectIdentityValues(value: unknown, values: string[] = []): string[] {
  if (typeof value === "string" && /^[a-z]+_/.test(value)) {
    values.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectIdentityValues(child, values));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((child) => collectIdentityValues(child, values));
  }
  return values;
}

const uuidV7Identity =
  /^[a-z]+_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const previousIdentityValues = new Set(
  collectIdentityValues(computerScienceV11Identities),
);
const currentIdentityValues = collectIdentityValues(
  computerScienceV12Identities,
);
const freshIdentityValues = currentIdentityValues.filter(
  (identity) => !previousIdentityValues.has(identity),
);

if (new Set(currentIdentityValues).size !== currentIdentityValues.length) {
  throw new Error("Computer Science 1.2 identity manifest contains duplicate identities.");
}
if (freshIdentityValues.some((identity) => !uuidV7Identity.test(identity))) {
  throw new Error("Every new Computer Science 1.2 identity must be a literal UUIDv7.");
}
const expectedFreshIdentityCounts = {
  bnd: 1,
  prv: 1,
  prvdc: 35,
  req: 7,
  con: 3,
  cpm: 125,
  sch: 1,
  crv: 34,
  unt: 272,
  asv: 68,
  res: 1,
  rsv: 34,
  acc: 34,
  rgt: 34,
  frs: 34,
  opt: 34,
  plc: 34,
} as const;
for (const [prefix, expected] of Object.entries(expectedFreshIdentityCounts)) {
  const actual = freshIdentityValues.filter((identity) =>
    identity.startsWith(`${prefix}_`),
  ).length;
  if (actual !== expected) {
    throw new Error(
      `Computer Science 1.2 needs ${expected} fresh ${prefix}_ identities; received ${actual}.`,
    );
  }
}
if (
  computerScienceV12Identities.programId !==
  computerScienceV11Identities.programId
) {
  throw new Error("Computer Science 1.2 must retain the stable program identity.");
}
for (const [courseKey, identity] of Object.entries(
  computerScienceV12Identities.courses,
)) {
  const previous =
    computerScienceV11Identities.courses[
      courseKey as keyof typeof computerScienceV11Identities.courses
    ];
  if (!previous || identity.courseId !== previous.courseId) {
    throw new Error(`Computer Science 1.2 changed stable course identity ${courseKey}.`);
  }
  if (String(identity.courseVersionId) === String(previous.courseVersionId)) {
    throw new Error(`Computer Science 1.2 did not version course ${courseKey}.`);
  }
  if (
    String(identity.assessmentVersionIds.applied) ===
      String(previous.assessmentVersionIds.applied) ||
    String(identity.assessmentVersionIds.final) ===
      String(previous.assessmentVersionIds.final)
  ) {
    throw new Error(`Computer Science 1.2 did not version assessments for ${courseKey}.`);
  }
}
