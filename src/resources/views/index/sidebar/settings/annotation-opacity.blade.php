<div class="settings-foldout__item" data-ng-controller="SettingsAnnotationOpacityController">
    <label title="Set the opacity of annotations on the map">Annotation opacity (<span data-ng-bind="annotation_opacity | number:2"></span>)</label>
    <input type="range" min="0" max="1" step="0.01" data-ng-model="annotation_opacity">
</div>
