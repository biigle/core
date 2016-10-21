@if ($editMode)
    <h4>Example annotations</h4>

    <div class="settings-foldout__item" data-ng-controller="AteExamplePatchesSettingsController">
        <div class="btn-group">
            <button type="button" class="btn btn-default" data-ng-class="{active: shown()}" data-ng-click="show()" title="Show example annotations">show</button>
            <button type="button" class="btn btn-default" data-ng-class="{active: !shown()}" data-ng-click="hide()" title="Don't show example annotations">hide</button>
        </div>
    </div>
@endif
