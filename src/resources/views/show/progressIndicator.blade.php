<span v-if="showIndicator" v-cloak :title="progressTitle" class="progress-indicator-container">
    <svg class="progress-indicator" viewBox="-0.2 -0.2 2.4 2.4">
        <circle class="progress-indicator__background" cx="1" cy="1" r="1"></circle>
        <g class="progress-indicator__progress">
            <circle v-if="progress==1" cx="1" cy="1" r="1"></circle>
            <path v-else :d="progressPath"></path>
        </g>
        <path v-if="showInitialProgressMarker" class="progress-indicator__marker" :d="initialProgressPath"></path>
        <circle v-if="hasSeenAllImages" class="progress-indicator__all" cx="1" cy="1" r="1"></circle>
    </svg>
</span>
