<sidebar-tab name="color-adjustment" icon="adjust" :title="supportsColorAdjustment ? 'Color adjustment' : 'Color adjustment is not available for this image'" :disabled="!supportsColorAdjustment">
    <color-adjustment-tab v-on:change="updateColorAdjustment" v-cloak inline-template>
        <div class="annotator-tab">
            <h4 class="clearfix">
                <button class="btn btn-default pull-right" v-on:click="reset" title="Reset color adjustment"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                Color adjustment
            </h4>

            <div v-if="isBrightnessRgbActive" v-cloak class="clearfix">
                <span class="pull-right">
                    <button class="btn btn-default btn-xs active" v-on:click="toggleBrightnessRgb" title="Control brightness for all color channels at once">
                        <span class="glyphicon glyphicon-tasks" aria-hidden="true"></span>
                    </button>
                    <button class="btn btn-default btn-xs" v-on:click="resetType('brightnessRGB', 0)" title="Reset brightness for red channel">
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </button>
                </span>
                <label title="Set the brightness of the image">Brightness R (<span v-text="colorAdjustment.brightnessRGB[0]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessRGB[0]">
            </div>

            <div v-if="isBrightnessRgbActive" v-cloak class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('brightnessRGB', 1)" title="Reset brightness for green channel">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
                <label title="Set the brightness of the image">Brightness G (<span v-text="colorAdjustment.brightnessRGB[1]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessRGB[1]">
            </div>

            <div v-if="isBrightnessRgbActive" v-cloak class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('brightnessRGB', 2)" title="Reset brightness for blue channel">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
                <label title="Set the brightness of the image">Brightness B (<span v-text="colorAdjustment.brightnessRGB[2]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessRGB[2]">
            </div>
            <div class="clearfix" v-else>
                <span class="pull-right">
                    <button class="btn btn-default btn-xs" v-on:click="toggleBrightnessRgb" title="Control brightness for individual color channels">
                        <span class="glyphicon glyphicon-tasks" aria-hidden="true"></span>
                    </button>
                    <button class="btn btn-default btn-xs" v-on:click="resetType('brightnessContrast', 0)" title="Reset brightness">
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </button>
                </span>
                <label title="Set the brightness of the image">
                    Brightness (<span v-text="colorAdjustment.brightnessContrast[0]"></span>)
                </label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessContrast[0]">
            </div>

            <div class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('brightnessContrast', 1)" title="Reset contrast">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
                <label title="Set the contrast of the image">Contrast (<span v-text="colorAdjustment.brightnessContrast[1]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessContrast[1]">
            </div>

            <div class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('hueSaturation', 0)" title="Reset hue">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
                <label title="Set the hue of the image">Hue (<span v-text="colorAdjustment.hueSaturation[0]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.hueSaturation[0]">
            </div>

            <div class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('hueSaturation', 1)" title="Reset saturation">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
                <label title="Set the saturation of the image">Saturation (<span v-text="colorAdjustment.hueSaturation[1]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.hueSaturation[1]">
            </div>

            <div class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('vibrance', 0)" title="Reset vibrance">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                </button>
                <label title="Set the vibrance of the image">Vibrance (<span v-text="colorAdjustment.vibrance[0]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.vibrance[0]">
            </div>
        </div>
    </color-adjustment-tab>
</sidebar-tab>
