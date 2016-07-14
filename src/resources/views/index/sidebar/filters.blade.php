<div class="sidebar__foldout filters-foldout" data-ng-class="{open:(foldout=='filters')}" data-ng-controller="FiltersController">
    <h4 class="clearfix">
        <span class="pull-right">
            <button class="btn btn-default" data-ng-click="reset()" title="Reset all filters">
                <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
            <button class="btn btn-default" data-ng-click="toggleFoldout('filters')" title="Collapse this foldout">
                <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
            </button>
        </span>
        Filters
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
                Brightness (<span data-ng-bind="filters.brightnessContrast[0]"></span>)
            </label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.brightnessContrast[0]">
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
            <label title="Set the brightness of the image">Brightness R (<span data-ng-bind="filters.brightnessRGB[0]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.brightnessRGB[0]">
        </div>

        <div class="ng-cloak clearfix" data-ng-switch-when="true">
            <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('brightnessRGB', 1)" title="Reset brightness for green channel">
                <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
            <label title="Set the brightness of the image">Brightness G (<span data-ng-bind="filters.brightnessRGB[1]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.brightnessRGB[1]">
        </div>

        <div class="ng-cloak clearfix" data-ng-switch-when="true">
            <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('brightnessRGB', 2)" title="Reset brightness for blue channel">
                <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </button>
            <label title="Set the brightness of the image">Brightness B (<span data-ng-bind="filters.brightnessRGB[2]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.brightnessRGB[2]">
        </div>
    </div>


    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('brightnessContrast', 1)" title="Reset contrast">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the contrast of the image">Contrast (<span data-ng-bind="filters.brightnessContrast[1]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.brightnessContrast[1]">
    </div>

    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('hueSaturation', 0)" title="Reset hue">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the hue of the image">Hue (<span data-ng-bind="filters.hueSaturation[0]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.hueSaturation[0]">
    </div>

    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('hueSaturation', 1)" title="Reset saturation">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the saturation of the image">Saturation (<span data-ng-bind="filters.hueSaturation[1]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.hueSaturation[1]">
    </div>

    <div class="clearfix">
        <button class="btn btn-default btn-xs pull-right" data-ng-click="reset('vibrance', 0)" title="Reset vibrance">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
        </button>
        <label title="Set the vibrance of the image">Vibrance (<span data-ng-bind="filters.vibrance[0]"></span>)</label>
        <input type="range" min="-1" max="1" step="0.01" data-ng-model="filters.vibrance[0]">
    </div>

</div>
