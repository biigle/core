// Simple hash function to convert the name to a number
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
// Convert HSL to RGB
function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
        l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// Format the RGB components into a hexadecimal color code
function toHex(value) {
    return value.toString(16).padStart(2, '0');
}

export function usernameToColor(name) {
    // Convert name to a numeric hash value
    const hash = simpleHash(name);

    // Use the hash to generate a unique hue
    const hue = hash % 360;
    const saturation = 70; // Keep saturation high for bright colors
    const lightness = 60;  // Keep lightness moderate for bright colors

    const [r, g, b] = hslToRgb(hue, saturation, lightness);

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}