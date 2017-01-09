<div class="sidebar__foldout color-adjustment-foldout" data-ng-class="{open:(foldout=='colorAdjustment')}" data-ng-controller="ColorAdjustmentController">
    <h4 class="clearfix">
        <span class="pull-right">
            <button class="btn btn-default" data-ng-click="reset()" title="Reset color adjustment">
                <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
            <button class="btn btn-default" data-ng-click="toggleFoldout('colorAdjustment')" title="Collapse this foldout">
                <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
            </button>
        </span>
        Color adjustment
    </h4>

    <div data-ng-switch="isBrightnessRgbActive()">
        <div class="clearfix" data-ng-switch-default="">
            <span class="pull-right">
                <button class="btn btn-default btn-xs" data-ng-click="toggleBrightnessRGB()" title="Control brightness for individual color channels">
                    <span class="glyphicon glyphicon-tasks" aria-hidden="true"></span>
                </button>
                <button class="btn btn-default btn-xs" data-ng-click="reset('brightnessContrast', 0)" title="Reset brightness">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
            </span>
            <label title="Set the brightness of the image">
                Brightness (<span data-ng-bind="colorAdjustment.brightnessContrast[0]"></span>)
            </label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.brightnessContrast[0]">
        </div>

        <div class="ng-cloak clearfix" data-ng-switch-when="true">
            <span class="pull-right">
                <button class="btn btn-default btn-xs active" data-ng-click="toggleBrightnessRGB()" title="Control brightness for all color channels at once">
                    <span class="glyphicon glyphicon-tasks" aria-hidden="true"></span>
                </button>
                <button class="btn btn-default btn-xs" data-ng-click="reset('brightnessRGB', 0)" title="Reset brightness for red channel">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
            </span>
            <label title="Set the brightness of the image">Brightness R (<span data-ng-bind="colorAdjustment.brightnessRGB[0]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.brightnessRGB[0]">
        </div>

        <div class="ng-cloak clearfix" data-ng-switch-when="true">
            <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('brightnessRGB', 1)" title="Reset brightness for green channel">
                <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
            <label title="Set the brightness of the image">Brightness G (<span data-ng-bind="colorAdjustment.brightnessRGB[1]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.brightnessRGB[1]">
        </div>

        <div class="ng-cloak clearfix" data-ng-switch-when="true">
            <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('brightnessRGB', 2)" title="Reset brightness for blue channel">
                <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
            <label title="Set the brightness of the image">Brightness B (<span data-ng-bind="colorAdjustment.brightnessRGB[2]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.brightnessRGB[2]">
        </div>
    </div>


    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('brightnessContrast', 1)" title="Reset contrast">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the contrast of the image">Contrast (<span data-ng-bind="colorAdjustment.brightnessContrast[1]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.brightnessContrast[1]">
    </div>

    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('hueSaturation', 0)" title="Reset hue">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the hue of the image">Hue (<span data-ng-bind="colorAdjustment.hueSaturation[0]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.hueSaturation[0]">
    </div>

    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('hueSaturation', 1)" title="Reset saturation">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the saturation of the image">Saturation (<span data-ng-bind="colorAdjustment.hueSaturation[1]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.hueSaturation[1]">
    </div>

    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('vibrance', 0)" title="Reset vibrance">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the vibrance of the image">Vibrance (<span data-ng-bind="colorAdjustment.vibrance[0]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="colorAdjustment.vibrance[0]">
    </div>

</div>
