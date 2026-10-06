/**
 * Which practice skills belong to which learning unit.
 *
 * Practice is an overlay on the catalog, not part of a publication: adding a
 * skill never creates a new program version. Units are matched by their stable
 * identities, and every unit of a course is listed for each published version
 * that carries it, so a learner pinned to an older version keeps the checks.
 * Units with no entry simply have no practice yet.
 */
import { PYTHON_FUNDAMENTALS } from "./skills/python-fundamentals";
import type { PracticeSkill } from "./types";

export const PRACTICE_SKILLS: readonly PracticeSkill[] = [
  ...PYTHON_FUNDAMENTALS,
];

const SKILLS_BY_ID = new Map(PRACTICE_SKILLS.map((skill) => [skill.id, skill]));

export function practiceSkill(id: string) {
  return SKILLS_BY_ID.get(id);
}

/** One unit's skills, under every stable unit identity that carries it. */
function unit(ids: readonly string[], skills: readonly string[]) {
  return ids.map((id) => [id, skills] as const);
}

const UNIT_SKILLS: ReadonlyMap<string, readonly string[]> = new Map([
  // Programming I: Computational Problem Solving (1.0–1.1, then 1.2).
  ...unit(
    [
      "unt_019fab2b-c444-746f-8d31-1e0609488c43",
      "unt_01a00129-87d9-7de3-8f38-7fa74c321ad5",
    ],
    ["py.arith", "py.binding", "py.strings"],
  ),
  ...unit(
    [
      "unt_019fab2b-c445-7f08-850d-3795dee04b5d",
      "unt_01a00129-87d9-72ba-ad7b-b1bea12727cf",
    ],
    ["py.bool", "py.branch"],
  ),
  ...unit(
    [
      "unt_019fab2b-c446-719e-b54d-17fa6fb14830",
      "unt_01a00129-87d9-7555-9d0b-c20688b17ed8",
    ],
    ["py.loopcount", "py.accum"],
  ),
  ...unit(
    [
      "unt_019fab2b-c447-7891-8c90-0e67ee4322d7",
      "unt_01a00129-87d9-70b0-b007-7f5432342b92",
    ],
    ["py.except", "py.tryflow"],
  ),
  ...unit(
    [
      "unt_019fab2b-c448-7610-8643-2c0548af1883",
      "unt_01a00129-87d9-7527-8cbd-88d4cacb962d",
    ],
    ["py.http", "py.json", "py.semver"],
  ),
  ...unit(
    [
      "unt_019fab2b-c449-7ebf-b4bd-f964fc4d48ab",
      "unt_01a00129-87d9-7768-9a42-e693569a267e",
    ],
    ["py.boundary", "py.mutation"],
  ),
  ...unit(
    [
      "unt_019fab2b-c44a-7dbc-9eb5-ff31f7e722fc",
      "unt_01a00129-87d9-73bc-ac3e-d226388147e0",
    ],
    ["py.regex", "py.csv"],
  ),
  ...unit(
    [
      "unt_019fab2b-c44b-7751-ba91-2ffcfe0668ce",
      "unt_01a00129-87d9-787d-a8bb-0fb77228638f",
    ],
    ["py.oop", "py.alias"],
  ),
]);

export function skillIdsForUnit(learningUnitId: string): readonly string[] {
  return UNIT_SKILLS.get(learningUnitId) ?? [];
}

export function skillsForUnit(
  learningUnitId: string,
): readonly PracticeSkill[] {
  return skillIdsForUnit(learningUnitId).flatMap(
    (id) => SKILLS_BY_ID.get(id) ?? [],
  );
}

/** Every unit identity that has practice, for the catalog contract test. */
export function practicedUnitIds() {
  return [...UNIT_SKILLS.keys()];
}
