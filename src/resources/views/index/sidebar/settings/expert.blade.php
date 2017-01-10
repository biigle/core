<div data-ng-controller="SettingsExpertController">
    <div class="settings-foldout__item">
        <label title="Show the position of the mouse on the image">Mouse position</label>
        <div class="btn-group">
            <button type="button" class="btn btn-default" data-ng-class="{active: mouseShown()}" data-ng-click="showMouse()" title="Show mouse position">show</button>
            <button type="button" class="btn btn-default" data-ng-class="{active: !mouseShown()}" data-ng-click="hideMouse()" title="Hide mouse position">hide</button>
        </div>
    </div>
    <div class="settings-foldout__item">
        <label title="Enable or disable the modify interaction">Modify interaction</label>
        <div class="btn-group">
            <button type="button" class="btn btn-default" data-ng-class="{active: !modifyDisabled()}" data-ng-click="enableModify()" title="Enable the modify interaction">enabled</button>
            <button type="button" class="btn btn-default" data-ng-class="{active: modifyDisabled()}" data-ng-click="disableModify()" title="Disable the modify interaction">disabled</button>
        </div>
        <p class="help-block">Reloads the page. Disabling the modify interaction can speed up switching between images if there are lots of complex annotations.</p>
    </div>
</div>
