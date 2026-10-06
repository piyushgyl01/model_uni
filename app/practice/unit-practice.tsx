"use client";

import { useEffect, useState } from "react";
import { todayInTimezone } from "../domain/academic-calendar";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "../domain/catalog";
import type { CheckItem } from "../domain/practice/daily-check";
import { levelRule, skillStates } from "../domain/practice/levels";
import { skillsForUnit } from "../domain/practice/registry";
import type { PracticeRound } from "../domain/practice/types";
import { useCourseAccess } from "../course-access-context";
import { PROGRESS_EVENT, readLocalPracticeRounds } from "../progress-storage";
import { PracticePlayer } from "./practice-player";

interface UnitPracticeProps {
  readonly programVersionId: ProgramVersionId;
  readonly courseVersionId: CourseVersionId;
  readonly unitId: LearningUnitId;
}

/** A unit's self-marked skills with their levels, each open to practice. */
export function UnitPractice({
  programVersionId,
  courseVersionId,
  unitId,
}: UnitPracticeProps) {
  const { hydrated, prerequisites, progress } = useCourseAccess();
  const [rounds, setRounds] = useState<readonly PracticeRound[]>([]);
  const [playing, setPlaying] = useState<CheckItem | null>(null);
  const skills = skillsForUnit(unitId);

  useEffect(() => {
    const refresh = () => setRounds(readLocalPracticeRounds(programVersionId));
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, [programVersionId]);

  if (skills.length === 0) return null;
  const states = skillStates(rounds);
  const locked = !hydrated || !prerequisites.isUnlocked;

  return (
    <section className="unit-practice" aria-label="Self-marked practice">
      <h4>Self-marked practice</h4>
      <p className="practice-note" style={{ marginTop: "0.25rem" }}>
        Fresh questions, marked on the spot. Practice is recorded; levels move
        only in your daily check on Today.
      </p>
      <ul>
        {skills.map((skill) => {
          const level = states.get(skill.id)?.level ?? 0;
          return (
            <li key={skill.id}>
              <span className={`practice-level ${level ? "" : "is-new"}`}>
                {level ? `Lv ${level}` : "New"}
              </span>
              <span>
                {skill.title}
                <small>{skill.summary}</small>
              </span>
              <button
                type="button"
                className="practice-btn"
                disabled={locked}
                title={locked ? prerequisites.lockReasonText : undefined}
                onClick={() =>
                  setPlaying({
                    skillId: skill.id,
                    level: Math.max(1, level),
                    questions: levelRule(Math.max(1, level)).questions,
                    courseVersionId,
                    learningUnitId: unitId,
                    reason: level ? "today" : "new",
                  })
                }
              >
                Practise
              </button>
            </li>
          );
        })}
      </ul>
      {playing && (
        <PracticePlayer
          title={`Practice · ${skills.find((skill) => skill.id === playing.skillId)?.title ?? ""}`}
          mode="practice"
          items={[playing]}
          programVersionId={programVersionId}
          studyDate={todayInTimezone(progress?.enrollment?.timezone)}
          onClose={() => setPlaying(null)}
        />
      )}
    </section>
  );
}
