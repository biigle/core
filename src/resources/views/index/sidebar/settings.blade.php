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

    <div class="settings-foldout__item"  data-ng-controller="AnnotationsCyclingController">
        <label title="Cycle through all annotations">Cycle through annotations</label>
        <div class="btn-group">
            <button type="button" class="btn btn-inverse" data-ng-class="{active: cycling()}" data-ng-click="startCycling()" title="Start cycling through all annotations">on</button>
            <button type="button" class="btn btn-inverse" data-ng-class="{active: !cycling()}" data-ng-click="stopCycling()" title="Stop cycling through all annotations 𝗘𝘀𝗰">off</button>
        </div>
        <div class="btn-group">
            <button class="btn btn-inverse" data-ng-disabled="!cycling()" data-ng-click="prevRoi()" title="Previous anotation 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄"><span class="glyphicon glyphicon-step-backward" aria-hidden="true"></span></button>
            <button class="btn btn-inverse" data-ng-disabled="!cycling()" data-ng-click="nextRoi()" title="Next annotation 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲"><span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span></button>
            <button class="btn btn-inverse" data-ng-disabled="!cycling()" data-ng-click="attachLabel()" title="Attach the current label to the selected annotation 𝗘𝗻𝘁𝗲𝗿"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
        </div>
    </div>

    @foreach ($modules->getMixins('annotationsSettings') as $module => $nestedMixins)
        @include($module.'::annotationsSettings')
    @endforeach
</div>
