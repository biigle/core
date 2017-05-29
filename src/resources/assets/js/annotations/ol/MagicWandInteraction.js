/**
 * Control for drawing polygons using fuzzy matching of colors.
 */
biigle.$declare('annotations.ol.MagicWandInteraction', function () {
    function MagicWandInteraction(options) {
        ol.interaction.Pointer.call(this, {
            handleUpEvent: this.handleUpEvent,
            handleDownEvent: this.handleDownEvent,
            handleMoveEvent: this.handleMoveEvent,
        });

        this.on('change:active', this.toggleActive);

        // The image layer to use for the magic wand tool.
        this.layer = options.layer;

        this.colorThreshold = options.colorThreshold === undefined ? 15 : options.colorThreshold;
        this.blurRadius = options.blurRadius === undefined ? 5 : options.blurRadius;
        this.currentThreshold = this.colorThreshold;
        this.simplifyTolerant = options.simplifyTolerant === undefined ? 0 : options.simplifyTolerant;
        this.simplifyCount = options.simplifyCount === undefined ? 30 : options.simplifyCount;
        // Coordinates of the initial mousedown event.
        this.downPoint = [0, 0];
        this.map = options.map;
        this.dragging = false;
        // Canvas element to draw the snapshot of the current view of the image layer to.
        this.snapshotCanvas = document.createElement('canvas');
        this.snapshotContext = this.snapshotCanvas.getContext('2d');
        // Image object of the snapshot to use by MagicWand.
        this.snapshot = null;
        // Specifies whether the snapshot is currently updated. This is required to avoid
        // infinite recursion because the moveend event triggers the update but the
        // update in turn triggers a moveend event.
        this.updatingSnapshot = false;

        this.maskSource = new ol.source.Vector();
        this.maskLayer = new ol.layer.Vector({
            source: this.maskSource,
            zIndex: 200,
        });
        this.map.addLayer(this.maskLayer);
        this.map.on(['moveend', 'change:size'], this.updateSnapshot, this);
    }

    ol.inherits(MagicWandInteraction, ol.interaction.Pointer);

    MagicWandInteraction.prototype.toSnapshotCoordinates = function (points) {
        var extent = this.map.getView().calculateExtent(this.map.getSize());
        var resolution = this.map.getView().getResolution();
        var height = this.snapshot.height;

        return points.map(function (point) {
            return [
                Math.round((point[0] - extent[0]) / resolution),
                height - Math.round((point[1] - extent[1]) / resolution),
            ];
        });
    };

    MagicWandInteraction.prototype.fromSnapshotCoordinates = function (points) {
        var extent = this.map.getView().calculateExtent(this.map.getSize());
        var resolution = this.map.getView().getResolution();
        var height = this.snapshot.height;

        return points.map(function (point) {
            return [
                Math.round((point[0] * resolution) + extent[0]),
                Math.round(((height - point[1]) * resolution) + extent[1]),
            ];
        });
    };

    MagicWandInteraction.prototype.fromMagicWandCoordinates = function (points) {
        return points.map(function (point) {
            return [point.x, point.y];
        });
    };

    MagicWandInteraction.prototype.handleUpEvent = function (e) {
        this.currentThreshold = this.colorThreshold;

        if (this.dragging) {
            this.dragging = false;

            return false;
        }
    };

    MagicWandInteraction.prototype.handleDownEvent = function (e) {
        if (!this.dragging) {
            this.dragging = true;
            this.downPoint[0] = Math.round(e.coordinate[0]);
            this.downPoint[1] = Math.round(e.coordinate[1]);
            this.drawSelection();

            return true;
        }
    };

    MagicWandInteraction.prototype.handleMoveEvent = function (e) {
        if (this.dragging) {
            var x = Math.round(e.coordinate[0]);
            var y = Math.round(e.coordinate[1]);
            var px = this.downPoint[0];
            var py = this.downPoint[1];

            // Color threshold calculation. Migrated from the MagicWand example:
            // http://jsfiddle.net/Tamersoul/dr7Dw/
            if (x !== px || y !== py) {
                var dx = x - px;
                var dy = y - py;
                var len = Math.sqrt(dx * dx + dy * dy);
                var adx = Math.abs(dx);
                var ady = Math.abs(dy);
                var sign = adx > ady ? dx / adx : dy / ady;
                sign = sign < 0 ? sign / 5 : sign / 3;
                var thres = Math.min(Math.max(this.colorThreshold + Math.round(sign * len), 1), 255);
                if (thres != this.currentThreshold) {
                    this.currentThreshold = thres;
                    this.drawSelection();
                }
            }
        }
    };

    MagicWandInteraction.prototype.toggleActive = function (e) {
        if (this.getActive()) {
            // TODO: Toggle the updateSnapshot listeners here. Only update if the
            // interaction is active.
        }
    };

    MagicWandInteraction.prototype.updateSnapshot = function () {
        if (!this.updatingSnapshot) {
            console.log('update snapshot');
            // TODO: Update on switching images. Changing color adjustment, too?
            this.layer.once('postcompose', function (e) {
                this.snapshotCanvas.width = e.context.canvas.width;
                this.snapshotCanvas.height = e.context.canvas.height;
                this.snapshotContext.drawImage(e.context.canvas, 0, 0);
                this.snapshot = this.snapshotContext.getImageData(0, 0, this.snapshotCanvas.width, this.snapshotCanvas.height);
                this.snapshot.bytes = 4;
            }, this);

            // Set flag to avoid infinite recursion since renderSync will trigger the
            // moveend event again!
            this.updatingSnapshot = true;
            this.map.renderSync();
            this.updatingSnapshot = false;
        }
    };

    MagicWandInteraction.prototype.drawSelection = function () {
        var point = this.toSnapshotCoordinates([this.downPoint])[0];
        var mask = MagicWand.floodFill(this.snapshot, point[0], point[1], this.currentThreshold);
        if (this.blurRadius > 0) {
            mask = MagicWand.gaussBlurOnlyBorder(mask, this.blurRadius);
        }

        // Take only the outer contour.
        var contour = MagicWand.traceContours(mask).find(function (c) {
            return !c.innner;
        });

        if (contour) {
            contour = MagicWand.simplifyContours([contour], this.simplifyTolerant, this.simplifyCount)[0];

            var feature = this.maskSource.getFeatures()[0];
            var points = this.fromMagicWandCoordinates(contour.points);

            if (feature) {
                feature.getGeometry().setCoordinates([this.fromSnapshotCoordinates(points)]);
            } else {
                this.maskSource.addFeature(new ol.Feature({
                    geometry: new ol.geom.Polygon([this.fromSnapshotCoordinates(points)])
                }));
            }
        }
    };

    return MagicWandInteraction;
});
