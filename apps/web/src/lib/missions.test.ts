import assert from "node:assert/strict";
import test from "node:test";

import { findMission, missionContext, missions } from "./missions";

test("mission catalog stays broad while the launch demo remains concrete", () => {
  assert.equal(missions.length, 6);
  assert.equal(findMission("MISSION-KAIRO-K01").title, "Launch the K-01 smart hydration bottle");
  assert.equal(findMission("MISSION-INVESTOR-READY").title, "Make the company investable");
  assert.ok(missions.every((mission) => mission.constraints.length > 0));
  assert.ok(missions.every((mission) => mission.goals.length > 0));
});

test("mission context reflects the visible brief and durable workplace records", () => {
  const context = missionContext("MISSION-KAIRO-K01", [
    {
      id: "task-1",
      title: "Research first retail wedge",
      description: "Compare commuter and boutique wellness channels.",
      url: "https://example.com/tasks/task-1",
    },
  ], {
    summary: "A human-edited launch brief.",
    currentStage: "execute",
  });

  assert.equal(context.selectedMission.summary, "A human-edited launch brief.");
  assert.equal(context.selectedMission.currentStage, "execute");
  assert.equal(context.durableWorkplaceRecords[0]?.id, "task-1");
  assert.match(context.dataSource, /^Mission Room context plus Ambiguous records when connected/);
});
