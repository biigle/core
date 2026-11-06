/**
 * An annotation guideline as returned by the volume annotation guidelines endpoint.
 *
 * The methods mirror the AnnotationGuideline Eloquent model. Shapes are identified by
 * their names instead of IDs.
 */
import {markRaw} from 'vue';

export default class AnnotationGuideline {
    /**
     * @param {Object} attributes Attributes of the guideline (with labels).
     * @param {Object} shapeNames Shape names, keyed by ID.
     */
    constructor(attributes, shapeNames) {
        Object.assign(this, attributes);
        this.shapeNames = markRaw(shapeNames);
        // Allowed shapes, keyed by label ID. The map is raw because it is populated
        // during render and must not trigger reactive updates.
        this.allowedShapesCache = markRaw(new Map());
    }

    /**
     * Prop validator. In the video popout, guidelines are objects of the main window
     * whose class is a different one than the class of the popout, so instanceof fails.
     */
    static validate(value) {
        return value instanceof AnnotationGuideline
            || value.constructor.name === AnnotationGuideline.name;
    }

    /**
     * The user's project role is not checked here because the backend only provides
     * guidelines of projects where the user can create annotations.
     */
    get isEnforced() {
        return this.enforced === true;
    }

    get labelIds() {
        return this.labels.map(label => label.id);
    }

    // Names of the shapes of only_shapes or an empty array if there are none. Shapes
    // that are not available in the current tool (e.g. Ellipse in the video annotation
    // tool) are omitted, as they can't be used anyway.
    get onlyShapeNames() {
        return (this.only_shapes ?? [])
            .map(id => this.shapeNames[id])
            .filter(Boolean);
    }

    hasLabel(labelId) {
        return this.labels.some(label => label.id === labelId);
    }

    /**
     * Get the pivot attributes (description, shape etc.) of a label of the guideline.
     */
    getLabel(labelId) {
        return this.labels.find(label => label.id === labelId)?.pivot;
    }

    /**
     * Get the name of the shape of a label of the guideline (if any).
     */
    getLabelShape(labelId) {
        return this.shapeNames[this.getLabel(labelId)?.shape];
    }

    /**
     * Get the name of the shape that should be used for annotations with the label (if
     * any). This is the only allowed shape of an enforced guideline or the shape of the
     * label in an informational guideline.
     */
    getPreferredShape(labelId) {
        const shapes = this.allowedShapes(labelId);
        if (shapes?.size === 1) {
            return shapes.values().next().value;
        }

        return this.getLabelShape(labelId);
    }

    /**
     * Determine if the guideline allows the label.
     */
    allowsLabel(labelId) {
        if (!this.isEnforced || this.labels.length === 0) {
            return true;
        }

        return this.hasLabel(labelId);
    }

    /**
     * Determine if the guideline allows the shape (optionally in combination with a
     * label).
     */
    allowsShape(shape, labelId = null) {
        const shapes = this.allowedShapes(labelId);

        return shapes === null || shapes.has(shape);
    }

    /**
     * Get the names of the shapes that are allowed by the guideline (optionally in
     * combination with a label).
     *
     * @return {Set|null} Null if all shapes are allowed.
     */
    allowedShapes(labelId = null) {
        // Cached because the annotation canvas calls this many times on each render.
        if (!this.allowedShapesCache.has(labelId)) {
            this.allowedShapesCache.set(labelId, this.computeAllowedShapes(labelId));
        }

        return this.allowedShapesCache.get(labelId);
    }

    computeAllowedShapes(labelId) {
        if (!this.isEnforced) {
            return null;
        }

        const labelShapeId = this.getLabel(labelId)?.shape;
        if (labelShapeId) {
            const labelShape = this.shapeNames[labelShapeId];
            // The shape may not be available in the current tool (e.g. Ellipse in the
            // video annotation tool) so no shape can be used for the label.
            return labelShape ? new Set([labelShape]) : new Set();
        }

        if (!this.only_shapes) {
            return null;
        }

        return new Set(this.onlyShapeNames);
    }
}
