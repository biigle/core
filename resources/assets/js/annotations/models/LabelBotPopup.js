export default class LabelBotPopup {
    constructor(annotation) {
        this.available = true;
        this.ready = false; // true when labels is not empty
        this.isDragging = false;
        this.overlay = null;
        this.annotation = annotation;
        this.labels = [annotation.labels[0].label].concat(annotation.labelBOTLabels);
        this.overlayLineFeature = null;
    }

    getKey() {
        return this.annotation.id;
    }
}
