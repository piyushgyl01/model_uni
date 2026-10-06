import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  characterLevel,
  experienceFrom,
  experienceToNext,
  rankFor,
  studyStreak,
} from "../app/domain/practice/character";
import { buildQuestions, checkDoneOn, planDailyCheck } from "../app/domain/practice/daily-check";
import { answerText, isCorrect, parseNumber } from "../app/domain/practice/grading";
import { LEVELS, isDue, levelRule, scoreRound, skillStates } from "../app/domain/practice/levels";
import { seededRng } from "../app/domain/practice/random";
import {
  PRACTICE_SKILLS,
  practiceSkill,
  practicedUnitIds,
  skillIdsForUnit,
} from "../app/domain/practice/registry";
import type { PracticeQuestion, PracticeRound } from "../app/domain/practice/types";
import { catalogRepository } from "../content/catalog";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";
import { computerScienceBundleV12 } from "../content/programs/computer-science-v1-2";

const SAMPLES = 120;

function generated() {
  return PRACTICE_SKILLS.flatMap((skill) =>
    Array.from({ length: SAMPLES }, (_, index) => skill.generate(seededRng(index * 7919 + 13))),
  );
}

let roundSeq = 0;
function round(
  skillId: string,
  studyDate: string,
  correctCount: number,
  questionCount: number,
  mode: PracticeRound["mode"] = "check",
): PracticeRound {
  roundSeq += 1;
  return {
    id: `round-${String(roundSeq).padStart(4, "0")}`,
    skillId,
    mode,
    level: 1,
    questionCount,
    correctCount,
    durationSeconds: 60,
    studyDate,
    completedAt: `${studyDate}T12:${String(roundSeq % 60).padStart(2, "0")}:00.000Z`,
    courseVersionId: "crv_test",
  };
}

test("every practice skill makes well-formed questions with one right answer", () => {
  assert.equal(new Set(PRACTICE_SKILLS.map((skill) => skill.id)).size, PRACTICE_SKILLS.length);
  for (const question of generated()) {
    assert.ok(practiceSkill(question.skillId), `${question.skillId} is registered`);
    assert.ok(question.prompt.trim() && question.explain.trim(), `${question.skillId} explains itself`);
    if (question.kind === "number") {
      assert.ok(Number.isFinite(question.answer), `${question.skillId} has a finite answer`);
      assert.ok(isCorrect(question, answerText(question)), `${question.skillId} accepts its own answer`);
      assert.ok(!isCorrect(question, String(question.answer + 1)), `${question.skillId} rejects a wrong one`);
    } else {
      assert.ok(question.options.length >= 3, `${question.skillId} offers real choices`);
      assert.equal(new Set(question.options).size, question.options.length, `${question.skillId} has distinct options`);
      assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
      assert.ok(isCorrect(question, question.correctIndex));
      assert.ok(!isCorrect(question, (question.correctIndex + 1) % question.options.length));
    }
  }
});

/** Run each question's own program through Python and compare its output. */
test("generated answers agree with Python itself", (context) => {
  const probe = spawnSync("python3", ["--version"]);
  if (probe.status !== 0) {
    context.skip("python3 is not installed here");
    return;
  }
  const questions = generated().filter((question): question is PracticeQuestion & { python: string } =>
    Boolean(question.python),
  );
  const runner = [
    "import io, json, sys, contextlib",
    "out = []",
    "for code in json.load(sys.stdin):",
    "    buf = io.StringIO()",
    "    try:",
    "        with contextlib.redirect_stdout(buf):",
    '            exec(compile(code, "<q>", "exec"), {"__name__": "__main__"})',
    "        out.append(buf.getvalue().strip())",
    "    except Exception as error:",
    '        out.append("!!" + type(error).__name__)',
    "print(json.dumps(out))",
  ].join("\n");
  const result = spawnSync("python3", ["-c", runner], {
    input: JSON.stringify(questions.map((question) => question.python)),
    maxBuffer: 1 << 26,
  });
  assert.equal(result.status, 0, result.stderr.toString());
  const outputs = JSON.parse(result.stdout.toString()) as string[];
  assert.equal(outputs.length, questions.length);
  questions.forEach((question, index) => {
    const output = outputs[index] as string;
    const agrees =
      question.kind === "number"
        ? isCorrect(question, Number(output))
        : output === question.options[question.correctIndex];
    assert.ok(agrees, `${question.skillId}: app says ${answerText(question)}, Python says ${output}\n${question.code}`);
  });
});

test("typed numbers are read the way people write them", () => {
  assert.equal(parseNumber("-7"), -7);
  assert.equal(parseNumber(" 3.5 "), 3.5);
  assert.equal(parseNumber("3,5"), 3.5);
  assert.equal(parseNumber("1,000"), 1000);
  assert.equal(parseNumber("4.7k"), 4700);
  assert.equal(parseNumber("1e-3"), 0.001);
  assert.equal(parseNumber("2M"), 2_000_000);
  assert.equal(parseNumber("4.0"), 4);
  assert.equal(parseNumber(""), null);
  assert.equal(parseNumber("12a"), null);
  assert.equal(parseNumber("1 2"), 12);
  const question: PracticeQuestion = { kind: "number", skillId: "x", prompt: "?", answer: 6.5, explain: "." };
  assert.ok(isCorrect(question, "6.5"));
  assert.ok(isCorrect(question, "6,5"));
  assert.ok(!isCorrect(question, "6.4"));
  assert.ok(!isCorrect(question, "six"));
});

test("a clean round moves a skill up, one miss keeps it, two drop it", () => {
  assert.equal(scoreRound(1, 2, 2), 2);
  assert.equal(scoreRound(4, 3, 4), 4);
  assert.equal(scoreRound(4, 2, 4), 3);
  assert.equal(scoreRound(1, 0, 2), 1);
  assert.equal(scoreRound(10, 7, 7), 10);
  assert.equal(scoreRound(0, 2, 2), 2, "a first round is played at level 1");
  assert.equal(LEVELS.length, 10);
  assert.ok(levelRule(10).questions > levelRule(1).questions, "higher levels ask more");
  assert.ok(levelRule(10).numberSeconds < levelRule(1).numberSeconds, "with less time each");
  assert.deepEqual(levelRule(99), levelRule(10));
});

test("levels come from replaying checks in finishing order, whatever order they arrive in", () => {
  const rounds = [
    round("py.arith", "2026-09-01", 2, 2),
    round("py.arith", "2026-09-02", 3, 3),
    round("py.arith", "2026-09-03", 1, 3),
    round("py.arith", "2026-09-03", 0, 2, "practice"),
  ];
  const forward = skillStates(rounds).get("py.arith");
  const backward = skillStates([...rounds].reverse()).get("py.arith");
  assert.deepEqual(forward, backward);
  assert.equal(forward?.level, 2, "up, up, then down");
  assert.equal(forward?.checks, 3);
  assert.equal(forward?.practiced, 1, "practice is counted but never moves the level");
  assert.equal(forward?.lastOutcome, "down");
});

test("a skill rests after a good round and comes back when due", () => {
  const states = skillStates([round("py.bool", "2026-09-01", 2, 2), round("py.bool", "2026-09-02", 3, 3)]);
  const state = states.get("py.bool");
  assert.equal(state?.level, 3);
  assert.equal(isDue(state, "2026-09-02"), false, "never twice in one day");
  assert.equal(isDue(state, "2026-09-03"), false, "level 3 rests two days");
  assert.equal(isDue(state, "2026-09-04"), true);
  assert.equal(isDue(undefined, "2026-09-04"), true, "a new skill is always due");
  const dropped = skillStates([round("py.csv", "2026-09-01", 0, 2)]).get("py.csv");
  assert.equal(isDue(dropped, "2026-09-02"), true, "a dropped skill comes back tomorrow");
});

test("practice is attached to real published units, under every version that carries them", () => {
  const units = new Map(
    [computerScienceBundle, computerScienceBundleV12].flatMap((bundle) =>
      bundle.learningUnits.map((unit) => [unit.id as string, unit] as const),
    ),
  );
  for (const unitId of practicedUnitIds()) {
    assert.ok(units.has(unitId), `${unitId} is a published unit`);
    for (const skillId of skillIdsForUnit(unitId)) assert.ok(practiceSkill(skillId), `${skillId} exists`);
  }
  const latest = catalogRepository.loadBySlug("computer-science");
  assert.ok(latest);
  const programmingI = latest.courseVersions.find((course) => course.title.startsWith("Programming I:"));
  assert.ok(programmingI);
  const courseUnits = latest.learningUnits.filter((unit) => unit.courseVersionId === programmingI.id);
  assert.equal(courseUnits.length, 8);
  assert.ok(courseUnits.every((unit) => skillIdsForUnit(unit.id).length >= 2), "every unit of the first course has checks");
  const everySkill = new Set(courseUnits.flatMap((unit) => skillIdsForUnit(unit.id)));
  assert.equal(everySkill.size, PRACTICE_SKILLS.length, "every skill is reachable from the current version");
});

test("the daily check asks today's skills first, then due reviews, within a budget", () => {
  const latest = catalogRepository.loadBySlug("computer-science");
  assert.ok(latest);
  const programmingI = latest.courseVersions.find((course) => course.title.startsWith("Programming I:"));
  assert.ok(programmingI);
  const [first, second] = latest.learningUnits
    .filter((unit) => unit.courseVersionId === programmingI.id)
    .sort((a, b) => a.order - b.order);
  assert.ok(first && second);
  const today = [{ learningUnitId: first.id, courseVersionId: programmingI.id }];

  const fresh = planDailyCheck(today, [], "2026-09-01");
  assert.deepEqual(fresh.items.map((item) => item.skillId), ["py.arith", "py.binding", "py.strings"]);
  assert.ok(fresh.items.every((item) => item.reason === "new" && item.level === 1 && item.questions === 2));
  assert.equal(fresh.questionCount, 6);

  const questions = buildQuestions(fresh.items, seededRng(7));
  assert.equal(questions.length, 6);
  assert.ok(questions.every((entry) => entry.seconds > 0));

  const played = fresh.items.map((item) => ({ ...round(item.skillId, "2026-09-01", 2, 2), courseVersionId: programmingI.id }));
  assert.ok(checkDoneOn(played, "2026-09-01"));
  assert.equal(planDailyCheck(today, played, "2026-09-01").doneToday, true, "one check a day");

  const nextDay = planDailyCheck([{ learningUnitId: second.id, courseVersionId: programmingI.id }], played, "2026-09-02");
  assert.deepEqual(nextDay.items.filter((item) => item.reason === "new").map((item) => item.skillId), ["py.bool", "py.branch"]);
  assert.deepEqual(
    nextDay.items.filter((item) => item.reason === "review").map((item) => item.skillId).sort(),
    ["py.arith", "py.binding", "py.strings"],
    "level-2 skills rest one day, then come back as reviews",
  );
  assert.ok(nextDay.items.filter((item) => item.reason === "review").every((item) => item.courseVersionId === programmingI.id));
});

test("experience pays for checked answers and level-ups, and caps practice", () => {
  const rounds = [round("py.arith", "2026-09-01", 2, 2), round("py.arith", "2026-09-02", 2, 3)];
  assert.equal(experienceFrom(rounds), 2 * 5 + 15 + 2 * 5);
  const practice = Array.from({ length: 20 }, () => round("py.json", "2026-09-03", 5, 5, "practice"));
  assert.equal(experienceFrom(practice), 60, "practice stops paying at the daily cap");
  assert.equal(experienceFrom([]), 0);
});

test("character level and rank follow experience", () => {
  assert.deepEqual(characterLevel(0), { level: 1, into: 0, needed: experienceToNext(1) });
  assert.equal(characterLevel(experienceToNext(1)).level, 2);
  assert.equal(rankFor(1).name, "Newcomer");
  assert.equal(rankFor(12).name, "Practitioner");
  assert.equal(rankFor(99).name, "Legend");
});

test("a streak counts study days with a check and forgives planned days off", () => {
  const weekdays = [1, 2, 3, 4, 5];
  // 2026-09-04 is a Friday; 2026-09-07 the Monday after.
  const rounds = ["2026-09-02", "2026-09-03", "2026-09-04", "2026-09-07"].map((day) => round("py.arith", day, 2, 2));
  assert.deepEqual(studyStreak(rounds, "2026-09-07", weekdays), { current: 4, best: 4, todayDone: true });
  assert.equal(studyStreak(rounds, "2026-09-08", weekdays).current, 4, "today is still open");
  assert.equal(studyStreak(rounds, "2026-09-09", weekdays).current, 0, "a missed study day breaks it");
  assert.equal(studyStreak(rounds, "2026-09-07").current, 1, "studying every day, the weekend counts");
  assert.equal(studyStreak(rounds, "2026-09-09", weekdays).best, 4);
  const practiceOnly = [round("py.arith", "2026-09-07", 2, 2, "practice")];
  assert.equal(studyStreak(practiceOnly, "2026-09-07").current, 0, "practice alone keeps no streak");
});
