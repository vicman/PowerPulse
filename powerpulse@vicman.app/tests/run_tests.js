#!/usr/bin/env node
/**
 * PowerPulse unit tests (pure JS modules).
 * Run: node tests/run_tests.js
 */

const path = require("path");
const fs = require("fs");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

function loadModule(relPath) {
    const full = path.join(ROOT, relPath);
    const code = fs.readFileSync(full, "utf8");
    const module = { exports: {} };
    const sandbox = {
        module,
        exports: module.exports,
        require: (req) => {
            if (req.startsWith("./") || req.startsWith("../")) {
                const base = path.dirname(full);
                let resolved = path.normalize(path.join(base, req));
                if (!resolved.endsWith(".js")) {
                    resolved += ".js";
                }
                const rel = path.relative(ROOT, resolved);
                return loadModule(rel);
            }
            throw new Error("Unexpected require: " + req);
        },
        console,
        Date,
        Math,
        isNaN,
        isFinite,
        Number,
        String,
        Object,
        Array,
        JSON,
        encodeURIComponent
    };
    vm.runInNewContext(code, sandbox, { filename: full });
    return module.exports;
}

const formatter = loadModule("utils/formatter.js");
const deviceModel = loadModule("models/device.js");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) {
        passed += 1;
        console.log("  OK  " + msg);
    } else {
        failed += 1;
        console.error(" FAIL " + msg);
    }
}

console.log("headset Level parsing");
{
    const sample = `Found 1 supported device(s):
 Logitech G633/G635/G733/G933/G935 (Logitech G933 Gaming Wireless Headset) [0x046d:0x0a5b]
Battery:
    Status: BATTERY_AVAILABLE
    Level: 63%
    Voltage: 3867 mV
    Time to Empty: 567 minutes
`;
    const parsed = formatter.parseHeadsetControlOutput(sample);
    assert(parsed.devices[0].percentage === 63, "Level 63");
    assert(parsed.devices[0].voltageMv === 3867, "voltage separate");
    assert(parsed.devices[0].percentage !== Math.round(3867 / 42), "not derived from mV");
}

console.log("sort battery ascending");
{
    const sorted = deviceModel.sortDevices([
        { id: "a", type: "mouse", name: "Basilisk V3 Pro", percentage: 100, connected: true, updated: 1 },
        { id: "b", type: "battery", name: "SMP", percentage: 75, connected: true, updated: 2 },
        { id: "c", type: "headset", name: "Logitech G933", percentage: 63, connected: true, updated: 3 },
        { id: "d", type: "keyboard", name: "MX Keys", percentage: 50, connected: true, updated: 4 }
    ], "battery-asc", { laptopName: "Laptop" });
    assert(sorted[0].percentage === 50, "50% first");
    assert(sorted[1].percentage === 63, "63% second");
    assert(sorted[2].percentage === 75, "75% third");
    assert(sorted[3].percentage === 100, "100% last");
    assert(deviceModel.friendlyName(sorted[2], { laptopName: "Laptop" }) === "Laptop", "laptop name");
}

console.log("names and icons");
{
    assert(deviceModel.friendlyName({ type: "battery", name: "SMP L17M3PG3" }) === "Laptop", "OEM → Laptop");
    assert(deviceModel.friendlyName({ name: "Razer Basilisk V3 Pro" }) === "Basilisk V3 Pro", "basilisk");
    assert(deviceModel.iconForType("battery") === "laptop-symbolic", "laptop icon");
    assert(deviceModel.SortMode.BATTERY_ASC === "battery-asc", "sort constant");
}

console.log("freshness");
{
    assert(deviceModel.classifyFreshness(100) === "fresh", "fresh");
    assert(deviceModel.classifyFreshness(7 * 3600) === "soft", "soft");
    assert(deviceModel.classifyFreshness(30 * 3600) === "hard", "hard");
}

console.log("clipboard summary shape");
{
    const text = formatter.buildClipboardSummary([
        { name: "Laptop", percentage: 75, connected: true, type: "battery" },
        { name: "Logitech G933", percentage: 63, connected: true, timeToEmpty: 9 * 3600 + 27 * 60 }
    ], (d) => d.name, { title: "PowerPulse", updatedLabel: "1:42 PM" });
    assert(text.indexOf("PowerPulse") === 0, "starts with title");
    assert(text.indexOf("75%") !== -1, "has 75%");
    assert(text.indexOf("Actualizado:") !== -1, "has updated");
}

console.log("");
console.log(`Result: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
