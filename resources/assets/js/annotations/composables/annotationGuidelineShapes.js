import {computed, inject, toValue} from 'vue';

// Interaction modes of the image annotation tool that create new annotations and the
// shape they create. Measuring is not included because it creates an annotation only
// after a conversion.
export const INTERACTION_MODE_SHAPES = {
    drawPoint: 'Point',
    drawRectangle: 'Rectangle',
    drawAlignedRectangle: 'Rectangle',
    drawCircle: 'Circle',
    drawEllipse: 'Ellipse',
    drawLineString: 'LineString',
    drawPolygon: 'Polygon',
    polygonBrush: 'Polygon',
    magicWand: 'Polygon',
};

/**
 * Shape restrictions of the selected annotation guideline for the drawing tools of the
 * image and video annotation tools.
 *
 * Requires the injected "shapes" (shape names, keyed by ID).
 *
 * @param {Object|Function} guideline The selected annotation guideline (ref or getter).
 * @param {Object|Function} selectedLabel The selected label (ref or getter).
 */
export function useAnnotationGuidelineShapes(guideline, selectedLabel) {
    const shapes = inject('shapes');

    const selectedGuidelineLabel = computed(() => {
        const labelId = toValue(selectedLabel)?.id;

        return toValue(guideline)?.labels.find(l => l.id === labelId)?.pivot;
    });

    // Names of the shapes that are allowed by the selected annotation guideline or null
    // if all shapes are allowed. This mirrors AnnotationGuideline::allowedShapes().
    const allowed = computed(() => {
        const g = toValue(guideline);
        if (!g?.enforced_for_user) {
            return null;
        }

        const shapeId = selectedGuidelineLabel.value?.shape;
        const ids = shapeId ? [shapeId] : g.only_shapes;
        if (!ids) {
            return null;
        }

        return new Set(ids.map(id => shapes[id]));
    });

    // The drawing tool of this shape should be activated automatically when a label is
    // selected.
    const preferred = computed(() => {
        if (!toValue(selectedLabel)) {
            return undefined;
        }

        if (allowed.value?.size === 1) {
            return allowed.value.values().next().value;
        }

        // Informational guidelines suggest the shape of the label, too.
        return shapes[selectedGuidelineLabel.value?.shape];
    });

    const isAllowed = (shape) => {
        return !allowed.value || allowed.value.has(shape);
    };

    const getTooltipTitle = (shape, title) => {
        return isAllowed(shape) ? title : 'Not allowed by the annotation guideline';
    };

    return {
        allowed,
        preferred,
        isAllowed,
        getTooltipTitle,
    };
}
