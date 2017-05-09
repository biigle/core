<div class="annotation-canvas">
    <loader-block v-cloak :active="loading"></loader-block>
    <minimap :extent="extent" :projection="projection" inline-template>
        <div class="annotation-canvas__minimap"></div>
    </minimap>
    <label-indicator :label="selectedLabel" inline-template>
        <div class="label-indicator" title="Currently selected label" v-if="hasLabel" v-text="label.name"></div>
    </label-indicator>
    <div class="annotation-canvas__toolbar">
        <div class="btn-group">
            <control-button icon="step-backward" title="Previous image 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄" v-on:click="handlePreviousImage"></control-button>
            <control-button icon="step-forward" title="Next image 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲" v-on:click="handleNextImage"></control-button>
        </div>
    </div>
</div>
