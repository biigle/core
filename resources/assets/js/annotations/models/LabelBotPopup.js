export default class LabelBotPopup {
    constructor(annotation) {
        this.isDragging = false;
        this.annotation = annotation;
        this.labels = [annotation.labels[0].label].concat(annotation.labelBOTLabels);
    }

    getKey() {
        return this.annotation.id;
    }
}
