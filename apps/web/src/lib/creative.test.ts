import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreativePack,
  buildCreativePrompt,
  normalizeCreativeOutputs,
  normalizeCreativeStyles,
} from "./creative";

const reference = {
  assetId: "asset-reference",
  name: "bottle.jpg",
  mimeType: "image/jpeg",
  size: 1234,
  url: "/api/assets/asset-reference",
};

test("creative prompt carries the user's direction into a coherent visual recipe", () => {
  const prompt = buildCreativePrompt({
    instruction: "Make this bottle a cobalt-blue energy drink for a launch campaign.",
    outputs: ["hero", "ugc", "poster", "deck"],
    styles: ["exploded-fpv", "fisheye"],
    brand: {
      name: "Northstar",
      mission: "Make momentum visible",
      voice: ["direct", "optimistic"],
      palette: ["cobalt blue", "soft silver"],
      patterns: ["high-contrast editorial crops"],
      sourceUrl: "https://northstar.example",
      mode: "extracted",
    },
  });

  assert.match(prompt, /cobalt-blue energy drink/);
  assert.match(prompt, /exploded product reveal/);
  assert.match(prompt, /fisheye/);
  assert.match(prompt, /camera hardware and lens/);
  assert.match(prompt, /Northstar/);
  assert.match(prompt, /do not reproduce it/);
});

test("normalizers reject unknown choices without losing a useful default", () => {
  assert.deepEqual(normalizeCreativeOutputs(["hero", "hero", "unknown"]), ["hero"]);
  assert.deepEqual(normalizeCreativeOutputs([]), ["hero", "ugc", "poster", "deck"]);
  assert.deepEqual(normalizeCreativeStyles(["fisheye", "unknown", "fisheye"]), ["fisheye"]);
  assert.deepEqual(normalizeCreativeStyles([]), ["exploded-fpv"]);
});

test("one reference evolves into a traceable multi-output pack", () => {
  const pack = buildCreativePack({
    sessionId: "session-test",
    reference,
    instruction: "Build the blue energy drink launch.",
    outputs: ["hero", "ugc", "poster", "deck"],
    styles: ["exploded-fpv"],
    mode: "sample",
  });

  assert.equal(pack.sessionId, "session-test");
  assert.equal(pack.reference.assetId, reference.assetId);
  assert.equal(pack.mode, "sample");
  assert.equal(pack.ugc.shots.length, 3);
  assert.equal(pack.poster.treatments.length, 4);
  assert.equal(pack.deck.slides.length, 5);
  assert.match(pack.prompt, /blue energy drink/);
});
