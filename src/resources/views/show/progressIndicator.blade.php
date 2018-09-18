<span v-if="showIndicator" :title="progressTitle" class="progress-indicator-container">
    <svg class="progress-indicator" v-bind:class="indicatorClass" viewBox="-0.2 -0.2 2.4 2.4">
        <circle class="progress-indicator__background" cx="1" cy="1" r="1"></circle>
        <g class="progress-indicator__progress">
            <circle v-cloak v-if="progress==1" cx="1" cy="1" r="1"></circle>
            <path v-else :d="progressPath"></path>
        </g>
        <path v-cloak v-if="showInitialProgressMarker" class="progress-indicator__marker" :d="initialProgressPath"></path>
    </svg>
</span>
