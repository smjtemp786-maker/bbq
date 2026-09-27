// Custom Brain Bonds Blockly blocks + JS generators (defined once).
import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

let defined = false;

export function defineBrainBondsBlocks() {
  if (defined) return;
  defined = true;

  Blockly.defineBlocksWithJsonArray([
    { type: "bb_when_start", message0: "when \u25B6 start", nextStatement: null, colour: "#F59E0B", tooltip: "Runs when you press Run" },
    { type: "bb_move_forward", message0: "move forward", previousStatement: null, nextStatement: null, colour: "#2563EB" },
    { type: "bb_turn_left", message0: "turn left \u21BA", previousStatement: null, nextStatement: null, colour: "#2563EB" },
    { type: "bb_turn_right", message0: "turn right \u21BB", previousStatement: null, nextStatement: null, colour: "#2563EB" },
    { type: "bb_move_steps", message0: "move %1 steps", args0: [{ type: "input_value", name: "STEPS", check: "Number" }], inputsInline: true, previousStatement: null, nextStatement: null, colour: "#2563EB" },
    { type: "bb_wait", message0: "wait %1 seconds", args0: [{ type: "input_value", name: "SECS", check: "Number" }], inputsInline: true, previousStatement: null, nextStatement: null, colour: "#F59E0B" },
    { type: "bb_forever", message0: "forever %1 %2", args0: [{ type: "input_dummy" }, { type: "input_statement", name: "DO" }], previousStatement: null, nextStatement: null, colour: "#0D9488" },
    { type: "bb_repeat", message0: "repeat %1 times %2 %3", args0: [{ type: "input_value", name: "COUNT", check: "Number" }, { type: "input_dummy" }, { type: "input_statement", name: "DO" }], inputsInline: true, previousStatement: null, nextStatement: null, colour: "#0D9488" },
    { type: "bb_say", message0: "say %1", args0: [{ type: "input_value", name: "MSG" }], inputsInline: true, previousStatement: null, nextStatement: null, colour: "#9333EA" },
    { type: "bb_play_sound", message0: "play sound \u266A", previousStatement: null, nextStatement: null, colour: "#9333EA" },
    { type: "bb_change_score", message0: "change score by %1", args0: [{ type: "input_value", name: "N", check: "Number" }], inputsInline: true, previousStatement: null, nextStatement: null, colour: "#EF4444" },
    { type: "bb_pen", message0: "pen %1", args0: [{ type: "field_dropdown", name: "STATE", options: [["down", "down"], ["up", "up"]] }], previousStatement: null, nextStatement: null, colour: "#9333EA" },
    // robotics
    { type: "bb_sense_distance", message0: "distance sensor", output: "Number", colour: "#06B6D4", tooltip: "Distance to nearest obstacle (cm)" },
    { type: "bb_at_goal", message0: "reached goal?", output: "Boolean", colour: "#06B6D4" },
    { type: "bb_led", message0: "LED %1", args0: [{ type: "field_dropdown", name: "STATE", options: [["on", "on"], ["off", "off"]] }], previousStatement: null, nextStatement: null, colour: "#10B981" },
    { type: "bb_buzzer", message0: "buzzer beep", previousStatement: null, nextStatement: null, colour: "#10B981" },
  ]);

  const G = javascriptGenerator;
  G.forBlock["bb_when_start"] = () => "";
  G.forBlock["bb_move_forward"] = () => "await move(1);\n";
  G.forBlock["bb_turn_left"] = () => "await turnLeft();\n";
  G.forBlock["bb_turn_right"] = () => "await turnRight();\n";
  G.forBlock["bb_move_steps"] = (b) => {
    const n = G.valueToCode(b, "STEPS", Order.NONE) || "1";
    return `await move(${n});\n`;
  };
  G.forBlock["bb_wait"] = (b) => {
    const s = G.valueToCode(b, "SECS", Order.NONE) || "1";
    return `await wait(${s});\n`;
  };
  G.forBlock["bb_forever"] = (b) => {
    const inner = G.statementToCode(b, "DO");
    return `while(!isStopped()){\n${inner}await tick();\n}\n`;
  };
  G.forBlock["bb_repeat"] = (b) => {
    const n = G.valueToCode(b, "COUNT", Order.NONE) || "3";
    const inner = G.statementToCode(b, "DO");
    return `for(let _i=0; _i<(${n}); _i++){ if(isStopped())break;\n${inner}await tick();\n}\n`;
  };
  G.forBlock["bb_say"] = (b) => {
    const msg = G.valueToCode(b, "MSG", Order.NONE) || "''";
    return `await say(${msg});\n`;
  };
  G.forBlock["bb_play_sound"] = () => "await playSound();\n";
  G.forBlock["bb_change_score"] = (b) => {
    const n = G.valueToCode(b, "N", Order.NONE) || "1";
    return `changeScore(${n});\n`;
  };
  G.forBlock["bb_pen"] = (b) => `pen('${b.getFieldValue("STATE")}');\n`;
  G.forBlock["bb_sense_distance"] = () => ["sense()", Order.FUNCTION_CALL];
  G.forBlock["bb_at_goal"] = () => ["atGoal()", Order.FUNCTION_CALL];
  G.forBlock["bb_led"] = (b) => `led('${b.getFieldValue("STATE")}');\n`;
  G.forBlock["bb_buzzer"] = () => "await buzzer();\n";
}

export { Blockly, javascriptGenerator };
