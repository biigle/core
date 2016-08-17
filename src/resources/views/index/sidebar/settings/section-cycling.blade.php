<div class="settings-foldout__item"  data-ng-controller="SettingsSectionCyclingController">
    <label title="Cycle through image sections">Cycle through image sections</label>
    <div class="btn-group">
        <button type="button" class="btn btn-default" data-ng-class="{active: cycling()}" data-ng-click="startCycling()" title="Start cycling through image sections">on</button>
        <button type="button" class="btn btn-default" data-ng-class="{active: !cycling()}" data-ng-click="stopCycling()" title="Stop cycling through image sections 𝗘𝘀𝗰">off</button>
    </div>
    <div class="btn-group">
        <button class="btn btn-default" data-ng-disabled="!cycling()" data-ng-click="prevSection()" title="Previous section 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄"><span class="glyphicon glyphicon-step-backward" aria-hidden="true"></span></button>
        <button class="btn btn-default" data-ng-disabled="!cycling()" data-ng-click="nextSection()" title="Next section 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲"><span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span></button>
    </div>
</div>
