import assert from 'node:assert/strict';
import test from 'node:test';

import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';

// Resolve application aliases and OpenLayers imports with the existing bundler.
const server = await createServer({
    configFile: false,
    resolve: {alias: {'@': fileURLToPath(new URL('../../resources/assets/js', import.meta.url))}},
    server: {middlewareMode: true, watch: null, ws: false},
    ssr: {noExternal: ['@biigle/ol']},
});
let utils;
try {
    utils = await server.ssrLoadModule('/resources/assets/js/annotations/utils.js');
} finally {
    await server.close();
}
const {
    LABEL_TOOLTIP_MODES,
    getInitialAnnotationOverlayPlacement,
    normalizeLabelTooltipMode,
    shouldShowPersistentLabelTooltips,
    anchorAnnotationOverlay,
    createAnnotationOverlayConnector,
    dragAnnotationOverlay,
} = utils;

test('restores legacy enabled tooltip settings as hover mode', () => {
    assert.equal(normalizeLabelTooltipMode(true), LABEL_TOOLTIP_MODES.HOVER);
    assert.equal(normalizeLabelTooltipMode('true'), LABEL_TOOLTIP_MODES.HOVER);
});

test('restores legacy disabled tooltip settings as off mode', () => {
    assert.equal(normalizeLabelTooltipMode(false), LABEL_TOOLTIP_MODES.OFF);
    assert.equal(normalizeLabelTooltipMode('false'), LABEL_TOOLTIP_MODES.OFF);
});

test('preserves supported tooltip modes', () => {
    assert.equal(normalizeLabelTooltipMode('off'), LABEL_TOOLTIP_MODES.OFF);
    assert.equal(normalizeLabelTooltipMode('hover'), LABEL_TOOLTIP_MODES.HOVER);
    assert.equal(normalizeLabelTooltipMode('always'), LABEL_TOOLTIP_MODES.ALWAYS);
});

test('falls back to off for malformed tooltip modes', () => {
    assert.equal(normalizeLabelTooltipMode(), LABEL_TOOLTIP_MODES.OFF);
    assert.equal(normalizeLabelTooltipMode('sometimes'), LABEL_TOOLTIP_MODES.OFF);
});

test('shows persistent tooltips only in always mode while playback is paused', () => {
    assert.equal(shouldShowPersistentLabelTooltips('always', false), true);
    assert.equal(shouldShowPersistentLabelTooltips('always', true), false);
    assert.equal(shouldShowPersistentLabelTooltips('hover', false), false);
    assert.equal(shouldShowPersistentLabelTooltips('off', false), false);
});

test('places a persistent tooltip to the right of its annotation by default', () => {
    assert.deepEqual(getInitialAnnotationOverlayPlacement(
        [40, 40, 60, 60],
        [0, 0, 100, 100],
        1,
        [20, 10]
    ), {
        position: [60, 50],
        positioning: 'center-left',
        offset: [15, 0],
    });
});

test('places a persistent tooltip to the left when the right side overflows', () => {
    assert.deepEqual(getInitialAnnotationOverlayPlacement(
        [80, 40, 95, 60],
        [0, 0, 100, 100],
        1,
        [20, 10]
    ), {
        position: [80, 50],
        positioning: 'center-right',
        offset: [-15, 0],
    });
});

test('nudges persistent tooltips inside the vertical viewport bounds', () => {
    assert.deepEqual(getInitialAnnotationOverlayPlacement(
        [40, 0, 60, 4],
        [0, 0, 100, 100],
        1,
        [20, 10]
    ).offset, [15, -3]);

    assert.deepEqual(getInitialAnnotationOverlayPlacement(
        [40, 96, 60, 100],
        [0, 0, 100, 100],
        1,
        [20, 10]
    ).offset, [15, 3]);
});

test('preserves centered LabelBOT positioning and viewport fallbacks', () => {
    const viewport = [0, 0, 1000, 1000];
    const cases = [
        {extent: [100, 100, 200, 200], resolution: 1, position: [200, 150], offset: [200, 0]},
        {extent: [600, 100, 700, 200], resolution: 1, position: [600, 150], offset: [-200, 0]},
        {extent: [10, 10, 990, 990], resolution: 1, position: [10, 500], offset: [200, 0]},
        {extent: [600, 940, 700, 1000], resolution: 1, position: [600, 970], offset: [-200, 20]},
        {extent: [600, 0, 700, 40], resolution: 1, position: [600, 20], offset: [-200, -30]},
        {extent: [600, 100, 700, 200], resolution: 2, position: [600, 150], offset: [200, 0]},
    ];
    for (const {extent, resolution, position, offset} of cases) {
        assert.deepEqual(
            getInitialAnnotationOverlayPlacement(extent, viewport, resolution, [300, 100], 200, true),
            {position, positioning: 'center-center', offset}
        );
    }
});

function createOverlayFixture() {
    const overlay = {
        position: [10, 20],
        offset: [15, 0],
        getPosition() { return this.position; },
        setPosition(position) { this.position = position; },
        getOffset() { return this.offset; },
        setOffset(offset) { this.offset = offset; },
        _annotationGeometry: {getClosestPoint() { return [20, 30]; }},
    };
    const view = {resolution: 2, getResolution() { return this.resolution; }};
    const map = {getView() { return view; }};
    return {overlay, view, map};
}

test('dragging uses the original offset and pointer delta without moving the anchor', () => {
    const {overlay} = createOverlayFixture();
    dragAnnotationOverlay(overlay, [15, 0], [100, 100], {clientX: 200, clientY: 150});
    assert.deepEqual(overlay.getOffset(), [115, 50]);
    assert.deepEqual(overlay.getPosition(), [10, 20]);
    dragAnnotationOverlay(overlay, [15, 0], [100, 100], {clientX: 80, clientY: 90});
    assert.deepEqual(overlay.getOffset(), [-5, -10]);
});

test('reanchoring after dragging preserves the displayed overlay position', () => {
    const {overlay, map} = createOverlayFixture();
    overlay.setOffset([115, 50]);
    anchorAnnotationOverlay(overlay, map);
    assert.deepEqual(overlay.getPosition(), [20, 30]);
    assert.deepEqual(overlay.getOffset(), [110, 55]);
    const position = overlay.getPosition();
    const offset = overlay.getOffset();
    assert.deepEqual([position[0] + offset[0] * 2, position[1] - offset[1] * 2], [240, -80]);
});

test('connectors retain their style and annotation color and update on drag and zoom', () => {
    const {overlay, map, view} = createOverlayFixture();
    const style = () => [];
    const connector = createAnnotationOverlayConnector(overlay, map, 'ff5722', style);
    assert.equal(connector.get('unselectable'), true);
    assert.equal(connector.get('color'), 'ff5722');
    assert.equal(connector.getStyle(), style);
    assert.deepEqual(connector.getGeometry().getCoordinates(), [[20, 30], [40, 20]]);
    dragAnnotationOverlay(overlay, [15, 0], [100, 100], {clientX: 200, clientY: 150});
    connector._updateCoordinates();
    assert.deepEqual(connector.getGeometry().getCoordinates(), [[20, 30], [240, -80]]);
    view.resolution = 1;
    connector._updateCoordinates();
    assert.deepEqual(connector.getGeometry().getCoordinates(), [[20, 30], [125, -30]]);
});

test('hidden tooltip connectors skip updates and refresh when shown again', () => {
    const {overlay, map} = createOverlayFixture();
    let show = true;
    const connector = createAnnotationOverlayConnector(overlay, map, 'ff5722', () => [], () => show);
    show = false;
    overlay.setOffset([115, 50]);
    connector._updateCoordinates();
    assert.deepEqual(connector.getGeometry().getCoordinates(), [[20, 30], [40, 20]]);
    show = true;
    connector._updateCoordinates();
    assert.deepEqual(connector.getGeometry().getCoordinates(), [[20, 30], [240, -80]]);
});
