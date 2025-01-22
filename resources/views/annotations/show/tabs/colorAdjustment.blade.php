<sidebar-tab name="color-adjustment" icon="adjust" :title="supportsColorAdjustment ? 'Color adjustment' : 'Color adjustment is not available for this image'" :disabled="!supportsColorAdjustment">
    <color-adjustment-tab v-on:change="updateColorAdjustment" v-cloak></color-adjustment-tab>
</sidebar-tab>


@push('scripts')
<script type="text/html" id="color-adjustment-tab-template">
    <div class="annotator-tab">
        <h4 class="clearfix">
            <button class="btn btn-default pull-right" v-on:click="reset" title="Reset color adjustment"><span class="fa fa-times" aria-hidden="true"></span></button>
            Color Adjustment
        </h4>

        <div class="sidebar-tab__section">
            <div v-if="isBrightnessRgbActive" v-cloak class="clearfix">
                <span class="pull-right">
                    <button class="btn btn-default btn-xs active" v-on:click="toggleBrightnessRgb" title="Control brightness for all color channels at once">
                        <span class="fa fa-sliders-h" aria-hidden="true"></span>
                    </button>
                    <button class="btn btn-default btn-xs" v-on:click="resetType('brightnessRGB', 0)" title="Reset brightness for red channel">
                        <span class="fa fa-times" aria-hidden="true"></span>
                    </button>
                </span>
                <label title="Set the brightness of the image">Brightness R (<span v-text="colorAdjustment.brightnessRGB[0]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessRGB[0]">
            </div>

            <div v-if="isBrightnessRgbActive" v-cloak class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('brightnessRGB', 1)" title="Reset brightness for green channel">
                    <span class="fa fa-times" aria-hidden="true"></span>
                </button>
                <label title="Set the brightness of the image">Brightness G (<span v-text="colorAdjustment.brightnessRGB[1]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessRGB[1]">
            </div>

            <div v-if="isBrightnessRgbActive" v-cloak class="clearfix">
                <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('brightnessRGB', 2)" title="Reset brightness for blue channel">
                    <span class="fa fa-times" aria-hidden="true"></span>
                </button>
                <label title="Set the brightness of the image">Brightness B (<span v-text="colorAdjustment.brightnessRGB[2]"></span>)</label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessRGB[2]">
            </div>
            <div class="clearfix" v-else>
                <span class="pull-right">
                    <button class="btn btn-default btn-xs" v-on:click="toggleBrightnessRgb" title="Control brightness for individual color channels">
                        <span class="fa fa-sliders-h" aria-hidden="true"></span>
                    </button>
                    <button class="btn btn-default btn-xs" v-on:click="resetType('brightnessContrast', 0)" title="Reset brightness">
                        <span class="fa fa-times" aria-hidden="true"></span>
                    </button>
                </span>
                <label title="Set the brightness of the image">
                    Brightness (<span v-text="colorAdjustment.brightnessContrast[0]"></span>)
                </label>
                <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessContrast[0]">
            </div>
        </div>

        <div class="sidebar-tab__section clearfix">
            <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('brightnessContrast', 1)" title="Reset contrast">
                <span class="fa fa-times" aria-hidden="true"></span>
            </button>
            <label title="Set the contrast of the image">Contrast (<span v-text="colorAdjustment.brightnessContrast[1]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.brightnessContrast[1]">
        </div>

        <div class="sidebar-tab__section clearfix">
            <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('gamma', 0)" title="Reset gamma adjustment">
                <span class="fa fa-times" aria-hidden="true"></span>
            </button>
            <label title="Gamma adjust the image">Gamma (<span v-text="colorAdjustment.gamma[0]"></span>)</label>
            <input type="range" min="0" max="5" step="0.01" v-model="colorAdjustment.gamma[0]">
        </div>

        <div class="sidebar-tab__section clearfix">
            <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('hueSaturation', 0)" title="Reset hue">
                <span class="fa fa-times" aria-hidden="true"></span>
            </button>
            <label title="Set the hue of the image">Hue (<span v-text="colorAdjustment.hueSaturation[0]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.hueSaturation[0]">
        </div>

        <div class="sidebar-tab__section clearfix">
            <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('hueSaturation', 1)" title="Reset saturation">
                <span class="fa fa-times" aria-hidden="true"></span>
            </button>
            <label title="Set the saturation of the image">Saturation (<span v-text="colorAdjustment.hueSaturation[1]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.hueSaturation[1]">
        </div>

        <div class="sidebar-tab__section clearfix">
            <button class="btn btn-default btn-xs pull-right" v-on:click="resetType('vibrance', 0)" title="Reset vibrance">
                <span class="fa fa-times" aria-hidden="true"></span>
            </button>
            <label title="Set the vibrance of the image">Vibrance (<span v-text="colorAdjustment.vibrance[0]"></span>)</label>
            <input type="range" min="-1" max="1" step="0.01" v-model="colorAdjustment.vibrance[0]">
        </div>
    </div>
</script>
@endpush
