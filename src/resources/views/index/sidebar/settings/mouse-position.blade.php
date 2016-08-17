<div class="settings-foldout__item" data-ng-controller="SettingsMousePositionController">
    <label title="Show the position of the mouse on the image">Mouse position</label>
    <div class="btn-group">
        <button type="button" class="btn btn-default" data-ng-class="{active: shown()}" data-ng-click="show()" title="Show mouse position">show</button>
        <button type="button" class="btn btn-default" data-ng-class="{active: !shown()}" data-ng-click="hide()" title="Hide mouse position">hide</button>
    </div>
</div>
