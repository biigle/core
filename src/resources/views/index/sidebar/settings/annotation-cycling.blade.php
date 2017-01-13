<div class="settings-foldout__item"  data-ng-controller="SettingsAnnotationsCyclingController">
    <div class="form-group">
        <label title="Cycle through all annotations">Cycle through annotations <small>(Volare)</small></label>
        <div class="btn-group">
            <button type="button" class="btn btn-default" data-ng-class="{active: cycling()}" data-ng-click="startCycling()" title="Start cycling through all annotations">on</button>
            <button type="button" class="btn btn-default" data-ng-class="{active: !cycling()}" data-ng-click="stopCycling()" title="Stop cycling through all annotations 𝗘𝘀𝗰">off</button>
        </div>
        <div class="btn-group">
            <button class="btn btn-default" data-ng-disabled="!cycling()" data-ng-click="prevAnnotation()" title="Previous anotation 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄"><span class="glyphicon glyphicon-step-backward" aria-hidden="true"></span></button>
            <button class="btn btn-default" data-ng-disabled="!cycling()" data-ng-click="nextAnnotation()" title="Next annotation 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲"><span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span></button>
            @if ($editMode)
                <button class="btn btn-default" data-ng-disabled="!cycling()" data-ng-click="attachLabel()" title="Attach the current label to the selected annotation 𝗘𝗻𝘁𝗲𝗿"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
            @endif
        </div>
    </div>
    <p class="help-text">Use the annotation filter to cycle through annotations with certain properties.</p>
</div>
