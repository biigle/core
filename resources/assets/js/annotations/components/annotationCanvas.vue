<script>
import * as PolygonValidator from '../ol/PolygonValidator';
import AnnotationTooltip from './annotationCanvas/annotationTooltip';
import AttachLabelInteraction from './annotationCanvas/attachLabelInteraction';
import CanvasSource from '@biigle/ol/source/Canvas';
import Circle from '@biigle/ol/geom/Circle';
import Collection from '@biigle/ol/Collection';
import ControlButton from './controlButton';
import DrawInteractions from './annotationCanvas/drawInteractions';
import Ellipse from '@biigle/ol/geom/Ellipse';
import Events from '../../core/events';
import Feature from '@biigle/ol/Feature';
import ImageLayer from '@biigle/ol/layer/Image';
import Keyboard from '../../core/keyboard';
import LabelIndicator from './labelIndicator';
import Lawnmower from './annotationCanvas/lawnmower';
import LineString from '@biigle/ol/geom/LineString';
import MagicWandInteraction from './annotationCanvas/magicWandInteraction';
import Map from '@biigle/ol/Map';
import MeasureInteraction from './annotationCanvas/measureInteraction';
import Minimap from './minimap';
import ModifyInteraction from '@biigle/ol/interaction/Modify';
import MousePosition from './annotationCanvas/mousePosition';
import MouseWheelZoom from '@biigle/ol/interaction/MouseWheelZoom';
import Point from '@biigle/ol/geom/Point';
import Polygon from '@biigle/ol/geom/Polygon';
import PolygonBrushInteraction from './annotationCanvas/polygonBrushInteraction';
import Projection from '@biigle/ol/proj/Projection';
import Rectangle from '@biigle/ol/geom/Rectangle';
import Sampling from './annotationCanvas/sampling';
import ScaleLine from './annotationCanvas/scaleLine';
import SelectInteraction from '@biigle/ol/interaction/Select';
import Styles from '../stores/styles';
import TileLayer from '@biigle/ol/layer/Tile';
import TranslateInteraction from './annotationCanvas/translateInteraction';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import View from '@biigle/ol/View';
import ZoomControl from '@biigle/ol/control/Zoom';
import ZoomifySource from '@biigle/ol/source/Zoomify';
import ZoomLevel from './annotationCanvas/zoomLevel';
import ZoomToExtentControl from '@biigle/ol/control/ZoomToExtent';
import ZoomToNativeControl from '../ol/ZoomToNativeControl';
import {click as clickCondition} from '@biigle/ol/events/condition';
import {defaults as defaultInteractions} from '@biigle/ol/interaction'
import {getCenter} from '@biigle/ol/extent';
import {shiftKeyOnly as shiftKeyOnlyCondition} from '@biigle/ol/events/condition';
import {singleClick as singleClickCondition} from '@biigle/ol/events/condition';
import { isInvalidShape } from '../utils';


/**
 * The annotator canvas
 *
 * @type {Object}
 */
export default {
    mixins: [
        // Since this component got quite huge some logic is outsourced to these mixins.
        AnnotationTooltip,
        AttachLabelInteraction,
        DrawInteractions,
        Lawnmower,
        MagicWandInteraction,
        MeasureInteraction,
        MousePosition,
        PolygonBrushInteraction,
        Sampling,
        ScaleLine,
        TranslateInteraction,
        ZoomLevel,
    ],
    components: {
        minimap: Minimap,
        labelIndicator: LabelIndicator,
        controlButton: ControlButton,
    },
    props: {
        canAdd: {
            type: Boolean,
            default: false,
        },
        canModify: {
            type: Boolean,
            default: false,
        },
        canDelete: {
            type: Boolean,
            default: false,
        },
        image: {
            type: Object,
            default: null,
        },
        annotations: {
            type: Array,
            default() {
                return [];
            },
        },
        selectedAnnotations: {
            type: Array,
            default() {
                return [];
            },
        },
        center: {
            type: Array,
            default: undefined,
        },
        resolution: {
            type: Number,
            default: undefined,
        },
        selectedLabel: {
            default: null,
        },
        lastCreatedAnnotation: {
            default: null,
        },
        annotationOpacity: {
            type: Number,
            default: 1,
        },
        annotationMode: {
            type: String,
            default: 'default',
        },
        showMinimap: {
            type: Boolean,
            default: true,
        },
        listenerSet: {
            type: String,
            default: 'default',
        },
        userId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            initialized: false,
            // Options to use for the view.fit function.
            focusOptions: {
                padding: 50,
                duration: 250,
                resolution: 1,
            },
            // There are several interaction modes like 'drawPoint', 'attach' or
            // 'translate' etc. For each mode the allowed/active OpenLayers map
            // interactions are different.
            interactionMode: 'default',
            // Size of the OpenLayers map in px.
            mapSize: [0, 0],
            // Mouse position in OpenLayers coordinates.
            mousePosition: [0, 0],
            modifyInProgress: false,
        };
    },
    computed: {
        extent() {
            if (this.image) {
                return [0, 0, this.image.width, this.image.height];
            }

            return [0, 0, 0, 0];
        },
        viewExtent() {
            // The view can't calculate the extent if the resolution is not set.
            // Also use this.initialized so this property is recomputed when the
            // map is set (because the map is no reactive object). See:
            // https://github.com/biigle/annotations/issues/69
            if (this.initialized && this.resolution && this.map) {
                return this.map.getView().calculateExtent(this.mapSize);
            }

            return [0, 0, 0, 0];
        },
        projection() {
            return new Projection({
                code: 'biigle-image',
                units: 'pixels',
                extent: this.extent
            });
        },
        selectedFeatures() {
            return this.selectInteraction ? this.selectInteraction.getFeatures() : [];
        },
        isDefaultInteractionMode() {
            return this.interactionMode === 'default';
        },
        hasSelectedLabel() {
            return Boolean(this.selectedLabel);
        },
        hasSelectedAnnotations() {
            return this.selectedAnnotations.length > 0;
        },
        hasLastCreatedAnnotation() {
            return this.lastCreatedAnnotation !== null;
        },
        previousButtonTitle() {
            switch (this.annotationMode) {
                case 'volare':
                    return 'Previous annotation';
                case 'lawnmower':
                    return 'Previous image section';
                case 'randomSampling':
                case 'regularSampling':
                    return 'Previous sample location';
                default:
                    return 'Previous image';
            }
        },
        nextButtonTitle() {
            switch (this.annotationMode) {
                case 'volare':
                    return 'Next annotation';
                case 'lawnmower':
                    return 'Next image section';
                case 'randomSampling':
                case 'regularSampling':
                    return 'Next sample location';
                default:
                    return 'Next image';
            }
        },
    },
    methods: {
        createMap() {
            let control = new ZoomToExtentControl({
                tipLabel: 'Zoom to show whole image',
                // fontawesome compress icon
                label: '\uf066'
            });

            Keyboard.on('-', control.handleZoomToExtent.bind(control), 0, this.listenerSet);

            let map = new Map({
                controls: [
                    new ZoomControl(),
                    control,
                ],
                interactions: defaultInteractions({
                    altShiftDragRotate: false,
                    doubleClickZoom: false,
                    keyboard: false,
                    shiftDragZoom: false,
                    pinchRotate: false,
                    pinchZoom: true,
                    mouseWheelZoom: false,
                }),
            });

            map.addInteraction(new MouseWheelZoom({
                condition: function (mapBrowserEvent) {
                    // If Shift is pressed, the event should be handled by the parent
                    // component to scroll through the images of a volume.
                    return !shiftKeyOnlyCondition(mapBrowserEvent);
                },
            }));

            control = new ZoomToNativeControl({
                // fontawesome expand icon
                label: '\uf065'
            });

            Keyboard.on('+', control.zoomToNative.bind(control), 0, this.listenerSet);

            map.addControl(control);

            return map;
        },
        declareNonReactiveProperties() {
            // Declare properties of this component that should *not* be reactive.
            // This is mostly OpenLayers stuff that should work as fast as possible
            // without being slowed down by Vue reactivity.
            this.map = this.createMap();
            this.imageLayer = new ImageLayer();
            this.tiledImageLayer = new TileLayer();

            this.annotationFeatures = new Collection();
            this.annotationSource = new VectorSource({
                features: this.annotationFeatures
            });
            this.annotationLayer = new VectorLayer({
                source: this.annotationSource,
                zIndex: 100,
                updateWhileAnimating: true,
                updateWhileInteracting: true,
                style: Styles.features,
            });

            this.selectInteraction = new SelectInteraction({
                // Use click instead of default singleclick because the latter is
                // delayed 250ms to ensure the event is no doubleclick. But we want
                // it to be as fast as possible.
                condition: clickCondition,
                style: Styles.highlight,
                layers: [this.annotationLayer],
                // Enable selection of multiple overlapping annotations. Otherwise you
                // could always only select the annotation that was drawn last (i.e. on
                // the top). Use Shift+Click to deselect overlapping annotations that
                // shouldn't be selected or use the annotation filter.
                multi: true
            });

            // Map to detect which features were changed between modifystart and
            // modifyend events of the modify interaction.
            this.featureRevisionMap = {};
            this.modifyInteraction = new ModifyInteraction({
                features: this.selectInteraction.getFeatures(),
                // The Shift key must be pressed to delete vertices, so that new
                // vertices can be drawn at the same position of existing
                // vertices.
                deleteCondition: function (event) {
                    return shiftKeyOnlyCondition(event) && singleClickCondition(event);
                },
            });
        },
        updateMapSize() {
            this.mapSize = this.map.getSize();
        },
        updateMapView(e) {
            let view = e.target.getView();
            this.$emit('moveend', {
                center: view.getCenter(),
                resolution: view.getResolution(),
            });


        },
        invertPointsYAxis(points) {
            // Expects a points array like [x1, y1, x2, y2]. Inverts the y axis of
            // the points. CAUTION: Modifies the array in place!
            // The y axis should be switched from "top to bottom" to "bottom to top"
            // or vice versa. Our database expects ttb, OpenLayers expects btt.

            let height = this.extent[3];
            for (let i = 1; i < points.length; i += 2) {
                points[i] = height - points[i];
            }

            return points;
        },
        convertPointsFromOlToDb(points) {
            // Merge the individual point arrays to a single array first.
            // [[x1, y1], [x2, y2]] -> [x1, y1, x2, y2]
            return this.invertPointsYAxis(Array.prototype.concat.apply([], points));
        },
        convertPointsFromDbToOl(points) {
            // Duplicate the points array because we don't want to modify the
            // original array.
            points = this.invertPointsYAxis(points.slice());
            let newPoints = [];
            for (let i = 0; i < points.length; i += 2) {
                newPoints.push([
                    points[i],
                    // Circles have no fourth point so we take 0.
                    (points[i + 1] || 0)
                ]);
            }

            return newPoints;
        },
        // Determines the OpenLayers geometry object for an annotation.
        getGeometry(annotation) {
            let points = this.convertPointsFromDbToOl(annotation.points);

            switch (annotation.shape) {
                case 'Point':
                    return new Point(points[0]);
                case 'Rectangle':
                    return new Rectangle([points]);
                case 'Polygon':
                    return new Polygon([points]);
                case 'LineString':
                    return new LineString(points);
                case 'Circle':
                    // radius is the x value of the second point of the circle
                    return new Circle(points[0], points[1][0]);
                case 'Ellipse':
                    return new Ellipse([points]);
                default:
                    // unsupported shapes are ignored
                    console.error('Unknown annotation shape: ' + annotation.shape);
                    return;
            }
        },
        // Creates an OpenLayers feature object from an annotation.
        createFeature(annotation) {
            let feature = new Feature(this.getGeometry(annotation));

            feature.setId(annotation.id);
            feature.set('annotation', annotation);
            if (annotation.labels && annotation.labels.length > 0) {
                feature.set('color', annotation.labels[0].label.color);
            }

            return feature;
        },
        handleFeatureModifyStart(e) {
            this.modifyInProgress = true;
            e.features.getArray().forEach((feature) => {
                this.featureRevisionMap[feature.getId()] = feature.getRevision();
            });
        },
        handleFeatureModifyEnd(e) {
            this.modifyInProgress = false;
            let annotations = e.features.getArray()
                .filter((feature) => {
                    return this.featureRevisionMap[feature.getId()] !== feature.getRevision();
                })
                .map((feature) => {
                    if (feature.getGeometry().getType() === 'Polygon') {
                        PolygonValidator.simplifyPolygon(feature);
                    }

                    return {
                        id: feature.getId(),
                        image_id: feature.get('annotation').image_id,
                        points: this.getPoints(feature.getGeometry()),
                    };
                });

            if (annotations.length > 0) {
                this.$emit('update', annotations);
            }
        },
        focusAnnotation(annotation, fast, keepResolution) {
            let feature = this.annotationSource.getFeatureById(annotation.id);
            if (feature) {
                let view = this.map.getView();
                let duration = fast ? 0 : this.focusOptions.duration;
                let resolution = keepResolution ? this.resolution : this.focusOptions.resolution;
                let extent = feature.getGeometry().getExtent().slice();
                extent[0] -= this.focusOptions.padding;
                extent[1] -= this.focusOptions.padding;
                extent[2] += this.focusOptions.padding;
                extent[3] += this.focusOptions.padding;

                if (!keepResolution) {
                    let exactResolution = view.getResolutionForExtent(extent);
                    resolution = exactResolution > this.focusOptions.resolution ? exactResolution : resolution;
                }

                view.animate({
                    center: getCenter(extent),
                    resolution: resolution,
                    duration: duration,
                });
            }
        },
        fitImage() {
            this.map.getView().fit(this.extent, this.map.getSize());
        },
        extractAnnotationFromFeature(feature) {
            return feature.get('annotation');
        },
        handleFeatureSelect(event) {
            this.$emit('select',
                event.selected.map(this.extractAnnotationFromFeature),
                event.deselected.map(this.extractAnnotationFromFeature)
            );
        },
        handlePrevious() {
            if (!this.modifyInProgress) {
                this.$emit('previous');
            }
        },
        conditionalHandleScroll(event) {
            if (shiftKeyOnlyCondition({originalEvent: event})) {
                this.handleScroll(event);
            }
        },
        handleScroll(event) {
            event.preventDefault();
            // Some systems toggle the scroll direction if Shift is pressed, so we
            // take deltaX if deltaY is 0.
            const delta = event.deltaY || event.deltaX;
            if (delta < 0) {
                this.handleNext();
            } else if (delta > 0) {
                this.handlePrevious();
            }
        },
        handleNext() {
            if (!this.modifyInProgress) {
               this.$emit('next');
            }
        },
        resetInteractionMode() {
            this.interactionMode = 'default';
        },
        // Assembles the points array depending on the OpenLayers geometry type.
        getPoints(geometry) {
            let points;
            switch (geometry.getType()) {
                case 'Circle':
                    // radius is the x value of the second point of the circle
                    points = [geometry.getCenter(), [geometry.getRadius()]];
                    break;
                case 'Polygon':
                case 'Rectangle':
                case 'Ellipse':
                    points = geometry.getCoordinates()[0];
                    break;
                case 'Point':
                    points = [geometry.getCoordinates()];
                    break;
                default:
                    points = geometry.getCoordinates();
            }

            return this.convertPointsFromOlToDb(points);
        },
        handleNewFeature(e) {
            if (!this.hasSelectedLabel) {
                this.annotationSource.removeFeature(e.feature);
                return;
            }
            
            if (isInvalidShape(e.feature)) {
                // This must be done in the change event handler.
                // Not exactly sure why.
                this.annotationSource.once('change', () => {
                    if (this.annotationSource.hasFeature(e.feature)) {
                        this.annotationSource.removeFeature(e.feature);
                    }
                });
                this.$emit('is-invalid-shape', e.feature.getGeometry().getType());
                return;
            }

            let geometry = e.feature.getGeometry();
            if (geometry.getType() === 'Polygon') {
                PolygonValidator.simplifyPolygon(e.feature);
            }

            e.feature.set('color', this.selectedLabel.color);

            // This callback is called when saving the annotation succeeded or
            // failed, to remove the temporary feature.
            let removeCallback = () => {
                try {
                    this.annotationSource.removeFeature(e.feature);
                } catch (e) {
                    // If this failed, the feature was already removed.
                    // Do nothing in this case.
                }
            };

            this.$emit('new', {
                shape: geometry.getType(),
                points: this.getPoints(geometry),
            }, removeCallback);

        },
        deleteSelectedAnnotations() {
            if (!this.modifyInProgress && this.hasSelectedAnnotations && confirm('Are you sure you want to delete all selected annotations?')) {
                this.$emit('delete', this.selectedAnnotations);
            }
        },
        deleteLastCreatedAnnotation() {
            if (this.hasLastCreatedAnnotation) {
                this.$emit('delete', [this.lastCreatedAnnotation]);
            }
        },
        createPointAnnotationAt(x, y) {
            if (this.hasSelectedLabel) {
                let feature = new Feature(new Point([x, y]));
                // Simulare a feature created event so we can reuse the apropriate
                // function.
                this.annotationSource.addFeature(feature);
                this.handleNewFeature({feature: feature});
            } else {
                this.requireSelectedLabel();
            }
        },
        requireSelectedLabel(reset) {
            reset = reset === undefined ? true : reset;

            this.$emit('requires-selected-label');
            if (reset) {
                this.resetInteractionMode();
            }
        },
        render() {
            if (this.map) {
                this.map.render();
                this.$emit('render');
            }
        },
        handleRegularImage(image) {
            if (!image) {
                this.imageLayer.setSource(null);
            } else {
                this.imageLayer.setSource(new CanvasSource({
                    canvas: image.canvas,
                    projection: this.projection,
                    canvasExtent: this.extent,
                    canvasSize: [image.width, image.height]
                }));
            }
        },
        handleTiledImage(image) {
            if (!image) {
                this.tiledImageLayer.setSource(null);
            } else {
                this.tiledImageLayer.setSource(new ZoomifySource({
                    url: image.url,
                    size: [image.width, image.height],
                    // Set the extent like this instead of default so static images
                    // and tiled images can be treated the same.
                    extent: [0, 0, image.width, image.height],
                    transition: 100,
                }));
            }
        },
        updateMousePosition(e) {
            this.mousePosition = e.coordinate;
        },
        refreshSingleAnnotation(annotation) {
            let source = this.annotationSource;

            let newFeature = this.createFeature(annotation);
            let oldFeature = source.getFeatureById(annotation.id)

            source.removeFeature(oldFeature);
            source.addFeature(newFeature);
        },
        refreshAnnotationSource(annotations, source) {
            let annotationsMap = {};
            annotations.forEach(function (annotation) {
                annotationsMap[annotation.id] = null;
            });

            let oldFeaturesMap = {};
            let oldFeatures = source.getFeatures();
            let removedFeatures = oldFeatures.filter(function (feature) {
                oldFeaturesMap[feature.getId()] = null;
                return !annotationsMap.hasOwnProperty(feature.getId());
            });

            if (removedFeatures.length === oldFeatures.length) {
                // In case we switched the images, we want to clear and redraw all
                // features.
                source.clear(true);
            } else {
                // In case annotations were added/removed, we only want to update the
                // changed features. But don't remove the temporary annotations with
                // undefined ID here. These will be removed asynchronously through
                // their removeCallback when they were saved (or failed to be).
                // see: https://github.com/biigle/annotations/issues/82
                removedFeatures.filter((feature) => feature.getId() !== undefined)
                    .forEach(function (feature) {
                        source.removeFeature(feature);
                    });

                annotations = annotations.filter(function (annotation) {
                    return !oldFeaturesMap.hasOwnProperty(annotation.id);
                });
            }

            source.addFeatures(annotations.map(this.createFeature));
        },
        updateModifyInteractions() {
            if (!this.canModify) {
                this.resetInteractionMode();
            } else if (this.modifyInteraction) {
                this.modifyInteraction.setActive(this.isDefaultInteractionMode);
            }
        },
        updateDeleteInteractions() {
            if (!this.canDelete) {
                this.resetInteractionMode();
                Keyboard.off('Delete', this.deleteSelectedAnnotations, 0, this.listenerSet);
                Keyboard.off('Backspace', this.deleteLastCreatedAnnotation, 0, this.listenerSet);
            } else {
                Keyboard.on('Delete', this.deleteSelectedAnnotations, 0, this.listenerSet);
                Keyboard.on('Backspace', this.deleteLastCreatedAnnotation, 0, this.listenerSet);
            }
        },
    },
    watch: {
        image(image, oldImage) {
            if (!image) {
                this.map.removeLayer(this.tiledImageLayer);
                this.map.removeLayer(this.imageLayer);
                this.resetInteractionMode();
            } else if (image.tiled === true) {
                if (!oldImage || oldImage.tiled !== true) {
                    this.map.removeLayer(this.imageLayer);
                    this.map.addLayer(this.tiledImageLayer);
                }

                this.handleTiledImage(image, oldImage);
            } else {
                if (!oldImage || oldImage.tiled === true) {
                    this.map.removeLayer(this.tiledImageLayer);
                    this.map.addLayer(this.imageLayer);
                }

                this.handleRegularImage(image, oldImage);
            }
        },
        annotations(annotations) {
            this.refreshAnnotationSource(annotations, this.annotationSource);
            this.resetHoveredAnnotations();
        },
        selectedAnnotations(annotations) {
            let source = this.annotationSource;
            let features = this.selectedFeatures;
            features.clear();
            annotations.forEach(function (annotation) {
                features.push(source.getFeatureById(annotation.id));
            });
        },
        extent(extent, oldExtent) {
            // The extent only truly changes if the width and height changed.
            // extent[0] and extent[1] are always 0.
            if (extent[2] === oldExtent[2] && extent[3] === oldExtent[3]) {
                return;
            }

            let center = getCenter(extent);

            // Only use this.center once on initialization. If the extent changes
            // afterwards, the center should be reset.
            if (!this.initialized) {
                center = this.center || center;
            }

            this.map.setView(new View({
                projection: this.projection,
                center: center,
                resolution: this.resolution,
                zoomFactor: 2,
                // Allow a maximum of 100x magnification for non-tiled images. More
                // cannot be represented in the URL parameters.
                minResolution: 0.01,
                // Restrict movement.
                extent: extent,
            }));

            if (this.resolution === undefined) {
                this.map.getView().fit(extent);
            }

            // Fake a map moveend event here so everything that is dependent on the
            // map viwport is initialized.
            if (!this.initialized) {
                this.updateMapView({target: this.map});
                this.initialized = true;
            }
        },
        annotationOpacity(opacity) {
            this.annotationLayer.setOpacity(opacity);
        },
        isDefaultInteractionMode(defaultMode) {
            this.selectInteraction.setActive(defaultMode || this.isTranslating);
            if (this.canModify) {
                this.modifyInteraction.setActive(defaultMode);
            }
        },
        canAdd(state) {
            if (!state) {
                this.resetInteractionMode();
            }
        },
        canModify() {
            this.updateModifyInteractions();
        },
        canDelete() {
            this.updateDeleteInteractions();
        },
    },
    created() {
        this.declareNonReactiveProperties();

        // The name can be used for layer filters, e.g. with forEachFeatureAtPixel.
        this.annotationLayer.set('name', 'annotations');
        this.map.addLayer(this.annotationLayer);

        // These names are required by the minimap component.
        this.imageLayer.set('name', 'imageRegular');
        this.tiledImageLayer.set('name', 'imageTile');

        Events.$on('sidebar.toggle', () => {
            // This needs to be wrapped in a function so it is called without arguments.
            this.$nextTick(() => {
                this.map.updateSize();
            });
        });

        this.map.on('change:size', this.updateMapSize);
        this.map.on('moveend', this.updateMapView);
        this.map.on('pointermove', this.updateMousePosition);

        this.selectInteraction.on('select', this.handleFeatureSelect);
        this.map.addInteraction(this.selectInteraction);

        Keyboard.on(' ', this.handleNext, 0, this.listenerSet);
        Keyboard.on('ArrowRight', this.handleNext, 0, this.listenerSet);
        Keyboard.on('ArrowLeft', this.handlePrevious, 0, this.listenerSet);
        Keyboard.on('Escape', this.resetInteractionMode, 0, this.listenerSet);

        this.modifyInteraction.on('modifystart', this.handleFeatureModifyStart);
        this.modifyInteraction.on('modifyend', this.handleFeatureModifyEnd);
        this.map.addInteraction(this.modifyInteraction);
        this.modifyInteraction.setActive(false);

        this.updateModifyInteractions();
        this.updateDeleteInteractions();
    },
    mounted() {
        this.map.setTarget(this.$el);
    },
};
</script>
