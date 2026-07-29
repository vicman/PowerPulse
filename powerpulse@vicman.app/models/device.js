/**
 * PowerPulse device model, sorting and display helpers.
 * Provider-agnostic — new backends only fill createDevice() fields.
 */

const DeviceType = {
    UNKNOWN: "unknown",
    BATTERY: "battery",
    KEYBOARD: "keyboard",
    MOUSE: "mouse",
    HEADSET: "headset",
    GAMING_INPUT: "gaming-input",
    PHONE: "phone",
    TABLET: "tablet",
    COMPUTER: "computer",
    TOUCHPAD: "touchpad",
    UPS: "ups",
    STYLUS: "stylus",
    OTHER: "other"
};

const DeviceState = {
    UNKNOWN: "unknown",
    CHARGING: "charging",
    DISCHARGING: "discharging",
    EMPTY: "empty",
    FULLY_CHARGED: "fully-charged",
    PENDING_CHARGE: "pending-charge",
    PENDING_DISCHARGE: "pending-discharge",
    AVAILABLE: "available",
    UNAVAILABLE: "unavailable",
    DISCONNECTED: "disconnected"
};

const Transport = {
    UNKNOWN: "unknown",
    BATTERY: "internal",
    USB: "usb",
    BLUETOOTH: "bluetooth",
    WIRELESS: "wireless"
};

const SortMode = {
    BATTERY_ASC: "battery-asc",
    BATTERY_DESC: "battery-desc",
    NAME: "name",
    TYPE: "type",
    UPDATED: "updated",
    MANUAL: "manual"
};

const FRESHNESS = {
    SOFT_SECONDS: 6 * 3600,
    HARD_SECONDS: 24 * 3600,
    FRESH: "fresh",
    SOFT: "soft",
    HARD: "hard"
};

const UPOWER_TYPE_MAP = {
    2: DeviceType.BATTERY,
    3: DeviceType.UPS,
    5: DeviceType.MOUSE,
    6: DeviceType.KEYBOARD,
    8: DeviceType.PHONE,
    10: DeviceType.TABLET,
    11: DeviceType.COMPUTER,
    12: DeviceType.GAMING_INPUT,
    13: DeviceType.STYLUS,
    14: DeviceType.TOUCHPAD,
    17: DeviceType.HEADSET,
    19: DeviceType.HEADSET
};

const UPOWER_STATE_MAP = {
    0: DeviceState.UNKNOWN,
    1: DeviceState.CHARGING,
    2: DeviceState.DISCHARGING,
    3: DeviceState.EMPTY,
    4: DeviceState.FULLY_CHARGED,
    5: DeviceState.PENDING_CHARGE,
    6: DeviceState.PENDING_DISCHARGE
};

const TRACKED_TYPES = {
    [DeviceType.BATTERY]: true,
    [DeviceType.KEYBOARD]: true,
    [DeviceType.MOUSE]: true,
    [DeviceType.HEADSET]: true,
    [DeviceType.GAMING_INPUT]: true,
    [DeviceType.PHONE]: true,
    [DeviceType.UPS]: true,
    [DeviceType.STYLUS]: true
};

const TYPE_SORT_ORDER = {
    [DeviceType.BATTERY]: 0,
    [DeviceType.HEADSET]: 1,
    [DeviceType.KEYBOARD]: 2,
    [DeviceType.MOUSE]: 3,
    [DeviceType.GAMING_INPUT]: 4,
    [DeviceType.PHONE]: 5,
    [DeviceType.UPS]: 6,
    [DeviceType.STYLUS]: 7,
    [DeviceType.TABLET]: 8,
    [DeviceType.TOUCHPAD]: 9,
    [DeviceType.COMPUTER]: 10,
    [DeviceType.OTHER]: 11,
    [DeviceType.UNKNOWN]: 12
};

function createDevice(partial) {
    const now = Date.now() / 1000;
    return Object.assign({
        id: "",
        source: "unknown",
        providerLabel: "Unknown",
        type: DeviceType.UNKNOWN,
        name: "Unknown",
        model: "",
        vendor: "",
        serial: "",
        percentage: null,
        state: DeviceState.UNKNOWN,
        present: false,
        rechargeable: false,
        connected: false,
        voltage: null,
        timeToEmpty: null,
        timeToFull: null,
        warningLevel: 0,
        updated: now,
        path: "",
        iconName: "battery-symbolic",
        freshness: FRESHNESS.FRESH,
        ageSeconds: 0,
        stale: false,
        transport: Transport.UNKNOWN,
        // Laptop / UPS health (optional)
        capacity: null,
        energyFull: null,
        energyFullDesign: null,
        cycleCount: null,
        mac: "",
        raw: null
    }, partial || {});
}

function mapUpowerType(typeCode) {
    return UPOWER_TYPE_MAP[typeCode] || DeviceType.OTHER;
}

function mapUpowerState(stateCode) {
    return UPOWER_STATE_MAP[stateCode] || DeviceState.UNKNOWN;
}

function isTrackedType(type) {
    return !!TRACKED_TYPES[type];
}

function levelClass(percentage, connected) {
    if (!connected || percentage === null || percentage === undefined || isNaN(percentage)) {
        return "powerpulse-level-disconnected";
    }
    if (percentage > 60) {
        return "powerpulse-level-high";
    }
    if (percentage > 30) {
        return "powerpulse-level-medium";
    }
    if (percentage >= 0) {
        return "powerpulse-level-low";
    }
    return "powerpulse-level-unknown";
}

function shortName(name, maxLen) {
    const limit = maxLen || 18;
    const text = (name || "").trim();
    if (text.length <= limit) {
        return text;
    }
    return text.slice(0, limit - 1) + "…";
}

function friendlyName(device, options) {
    if (!device) {
        return "Unknown";
    }
    const opts = options || {};

    if (device.type === DeviceType.BATTERY) {
        const label = (opts.laptopName || "Laptop").toString().trim();
        return label || "Laptop";
    }

    let name = device.name || device.model || "";
    name = name.replace(/\s+/g, " ").trim();

    const replacements = [
        [/Logitech MX Keys.*/i, "MX Keys"],
        [/Razer Basilisk V3 Pro.*/i, "Basilisk V3 Pro"],
        [/Basilisk V3 Pro.*/i, "Basilisk V3 Pro"],
        [/Logitech G933.*/i, "Logitech G933"],
        [/Logitech G633\/G635\/G733\/G933\/G935.*/i, "Logitech G933"],
        [/Gaming Wireless Headset/i, ""],
        [/\(.*\)/, ""]
    ];

    for (let i = 0; i < replacements.length; i++) {
        name = name.replace(replacements[i][0], replacements[i][1]).trim();
    }

    if (!name) {
        name = device.model || device.type || "Device";
    }
    return name;
}

function iconForType(type) {
    switch (type) {
        case DeviceType.BATTERY:
            return "laptop-symbolic";
        case DeviceType.KEYBOARD:
            return "input-keyboard-symbolic";
        case DeviceType.MOUSE:
            return "input-mouse-symbolic";
        case DeviceType.HEADSET:
            return "audio-headset-symbolic";
        case DeviceType.GAMING_INPUT:
            return "input-gaming-symbolic";
        case DeviceType.PHONE:
            return "phone-symbolic";
        case DeviceType.UPS:
            return "uninterruptible-power-supply-symbolic";
        case DeviceType.STYLUS:
            return "input-tablet-symbolic";
        case DeviceType.TABLET:
            return "input-tablet-symbolic";
        case DeviceType.TOUCHPAD:
            return "input-touchpad-symbolic";
        default:
            return "battery-symbolic";
    }
}

function stateStatusIcon(state) {
    switch (state) {
        case DeviceState.CHARGING:
            return "xsi-thunderbolt-symbolic";
        case DeviceState.PENDING_CHARGE:
        case DeviceState.FULLY_CHARGED:
            return "ac-adapter-symbolic";
        default:
            return null;
    }
}

/** Compact status glyph for the row (no long text). */
function statusIndicator(device, lowThreshold) {
    if (!device || !device.connected) {
        return null;
    }
    const threshold = lowThreshold !== undefined ? lowThreshold : 20;
    if (device.percentage !== null && device.percentage <= Math.max(5, threshold / 2)) {
        return { glyph: "🟥", kind: "critical" };
    }
    if (device.percentage !== null && device.percentage <= threshold) {
        return { glyph: "⚠", kind: "low" };
    }
    if (device.state === DeviceState.CHARGING) {
        return { glyph: "⚡", kind: "charging" };
    }
    if (device.state === DeviceState.PENDING_CHARGE || device.state === DeviceState.FULLY_CHARGED) {
        return { glyph: "🔌", kind: "plugged" };
    }
    return { glyph: "🔋", kind: "battery" };
}

function classifyFreshness(ageSeconds) {
    const age = Number(ageSeconds) || 0;
    if (age > FRESHNESS.HARD_SECONDS) {
        return FRESHNESS.HARD;
    }
    if (age > FRESHNESS.SOFT_SECONDS) {
        return FRESHNESS.SOFT;
    }
    return FRESHNESS.FRESH;
}

function markFreshness(device, nowSeconds) {
    if (!device) {
        return device;
    }
    if (device.source !== "upower") {
        device.freshness = FRESHNESS.FRESH;
        device.ageSeconds = 0;
        device.stale = false;
        return device;
    }
    const now = nowSeconds !== undefined ? nowSeconds : (Date.now() / 1000);
    const updated = Number(device.updated) || 0;
    const age = updated > 0 ? Math.max(0, now - updated) : 0;
    device.ageSeconds = age;
    device.freshness = classifyFreshness(age);
    device.stale = device.freshness !== FRESHNESS.FRESH;
    return device;
}

function markStale(device, _maxAge, nowSeconds) {
    return markFreshness(device, nowSeconds);
}

function parseManualOrder(raw) {
    if (!raw) {
        return [];
    }
    if (Array.isArray(raw)) {
        return raw.slice();
    }
    try {
        const parsed = JSON.parse(String(raw));
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
        return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    }
}

function sortDevices(devices, sortBy, nameOptions, manualOrder) {
    const list = (devices || []).slice();
    const mode = sortBy || SortMode.BATTERY_ASC;
    const opts = nameOptions || {};
    const order = parseManualOrder(manualOrder);
    const orderIndex = {};
    order.forEach((id, i) => {
        orderIndex[id] = i;
    });

    list.sort((a, b) => {
        if (mode === SortMode.MANUAL) {
            const ia = orderIndex[a.id] !== undefined ? orderIndex[a.id] : 9999;
            const ib = orderIndex[b.id] !== undefined ? orderIndex[b.id] : 9999;
            if (ia !== ib) {
                return ia - ib;
            }
        } else if (mode === SortMode.BATTERY_ASC || mode === SortMode.BATTERY_DESC || mode === "percentage") {
            const pa = a.connected && a.percentage !== null ? Number(a.percentage) : 999;
            const pb = b.connected && b.percentage !== null ? Number(b.percentage) : 999;
            if (pa !== pb) {
                return (mode === SortMode.BATTERY_DESC || mode === "percentage") ? (pb - pa) : (pa - pb);
            }
        } else if (mode === SortMode.NAME) {
            const na = friendlyName(a, opts).toLowerCase();
            const nb = friendlyName(b, opts).toLowerCase();
            if (na < nb) return -1;
            if (na > nb) return 1;
        } else if (mode === SortMode.UPDATED) {
            const ua = Number(a.updated) || 0;
            const ub = Number(b.updated) || 0;
            if (ub !== ua) {
                return ub - ua;
            }
        } else {
            const ta = TYPE_SORT_ORDER[a.type] !== undefined ? TYPE_SORT_ORDER[a.type] : 99;
            const tb = TYPE_SORT_ORDER[b.type] !== undefined ? TYPE_SORT_ORDER[b.type] : 99;
            if (ta !== tb) {
                return ta - tb;
            }
        }
        return friendlyName(a, opts).localeCompare(friendlyName(b, opts));
    });

    return list;
}

function guessTransport(nativePath, path, serial) {
    const blob = ((nativePath || "") + " " + (path || "") + " " + (serial || "")).toLowerCase();
    if (blob.indexOf("bluetooth") !== -1 || /_[0-9a-f]{2}(_[0-9a-f]{2}){4}/i.test(path || "")) {
        return Transport.BLUETOOTH;
    }
    if (blob.indexOf("usb") !== -1 || blob.indexOf("hidraw") !== -1) {
        return Transport.USB;
    }
    if (blob.indexOf("battery") !== -1 || blob.indexOf("bat") !== -1) {
        return Transport.BATTERY;
    }
    return Transport.WIRELESS;
}

function extractMac(path, serial) {
    if (serial && /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(serial)) {
        return serial;
    }
    const fromPath = (path || "").match(/([0-9A-Fa-f]{2}(?:_[0-9A-Fa-f]{2}){5})/);
    if (fromPath) {
        return fromPath[1].replace(/_/g, ":");
    }
    return "";
}

function buildStats(devices, lowThreshold) {
    const list = devices || [];
    const threshold = lowThreshold !== undefined ? lowThreshold : 20;
    let charging = 0;
    let discharging = 0;
    let low = 0;
    const providers = {};

    list.forEach((d) => {
        if (d.providerLabel) {
            providers[d.providerLabel] = true;
        }
        if (!d.connected) {
            return;
        }
        if (d.state === DeviceState.CHARGING || d.state === DeviceState.PENDING_CHARGE) {
            charging += 1;
        }
        if (d.state === DeviceState.DISCHARGING || d.state === DeviceState.PENDING_DISCHARGE || d.state === DeviceState.AVAILABLE) {
            discharging += 1;
        }
        if (d.percentage !== null && d.percentage <= threshold) {
            low += 1;
        }
    });

    return {
        count: list.length,
        charging: charging,
        discharging: discharging,
        low: low,
        providers: Object.keys(providers)
    };
}

module.exports = {
    DeviceType,
    DeviceState,
    Transport,
    SortMode,
    FRESHNESS,
    TRACKED_TYPES,
    TYPE_SORT_ORDER,
    createDevice,
    mapUpowerType,
    mapUpowerState,
    isTrackedType,
    levelClass,
    shortName,
    friendlyName,
    iconForType,
    stateStatusIcon,
    statusIndicator,
    classifyFreshness,
    markFreshness,
    markStale,
    parseManualOrder,
    sortDevices,
    guessTransport,
    extractMac,
    buildStats
};
