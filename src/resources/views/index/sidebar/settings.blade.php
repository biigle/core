@inject('modules', 'Dias\Services\Modules')
<div class="sidebar__foldout settings-foldout" data-ng-class="{open:(foldout=='settings')}" data-ng-controller="SettingsController">
    <h4>
        Settings
        <button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('settings')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button>
    </h4>

    <div class="settings-foldout__item" data-ng-controller="SettingsAnnotationOpacityController">
        <label title="Set the opacity of annotations on the map">Annotation opacity (<span data-ng-bind="settings.annotation_opacity | number:2"></span>)</label>
        <input type="range" min="0" max="1" step="0.01" data-ng-model="settings.annotation_opacity">
    </div>
    @foreach ($modules->getMixins('annotationsSettings') as $module => $nestedMixins)
        @include($module.'::annotationsSettings')
    @endforeach
</div>
