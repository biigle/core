<sidebar-tab name="settings" icon="cog" title="Settings" :highlight="annotationsAreHidden">
    <settings-tab
        :supports-jump-by-frame="supportsJumpByFrame"
        :cross-origin-error="hasCrossOriginError"
        :current-id="videoId"
        :video-filenames="videoFilenames"
        :ids="videoIds"
        v-on:update="handleUpdatedSettings"
        ></settings-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="settings-tab-template">
<div class="annotator-tab settings-tab">

    <div class="sidebar-tab__section">
        <button v-if="crossOriginError" class="btn btn-default" title="Screenshots are not available for remote videos without cross-origin resource sharing" disabled="disabled" ><span class="fa fa-camera" aria-hidden="true"></span> Capture screenshot</button>
        <screenshot-button
            v-else
            :current-id="currentId"
            :filenames="videoFilenames"
            :ids="ids"
            ></screenshot-button>
    </div>

    <div class="sidebar-tab__section">
        <h5 title="Set the opacity of annotations">Annotation Opacity (<span v-text="annotationOpacity"></span>)</h5>
        <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity">
    </div>


    @can('add-annotation', $video)
        <div class="sidebar-tab__section">
            <input type="number" min="0" step="0.5" v-model="autoplayDraw" class="form-control form-control--small" title="Time in seconds that the video should play after an annotation keyframe is drawn"> Play/pause while drawing
        </div>
    @endcan

    <div class="sidebar-tab__section">
        <h5 title="Configure the time to stop the video on each annotation">Play/pause while viewing (<span v-text="autoPauseText"></span>)</h5>
        <input type="range" min="0" :max="autoPauseMax" step="1" v-model="autoPause">
    </div>


    <div class="sidebar-tab__section">
        <input type="number" min="0.25" max="4.0" step="0.25" v-model="playbackRate" class="form-control form-control--small" title="Video playback rate"> Playback rate
    </div>

    <div class="sidebar-tab__section">
        <input type="number" min="0" max="60.0" step="0.1" v-model="jumpStep" class="form-control form-control--small" title="Time in seconds that the video will jump (back or forward) with command buttons"> Jump step (s)
    </div>

    <div class="sidebar-tab__section">
        <h5 title="Set the duration of the LabelBOT popup timeout">LabelBOT Timeout (<span v-text="labelbotTimeoutValue"></span>)</h5>
        <input type="range" min="0" :max="labelbotTimeoutMax" step="1" v-model="labelbotTimeout" onmouseup="this.blur()">
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="showProgressIndicator" title-off="Show progress indicator" title-on="Hide progress indicator" v-on:on="handleShowProgressIndicator" v-on:off="handleHideProgressIndicator">Progress Indicator</power-toggle>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="showMinimap" title-off="Show minimap" title-on="Hide minimap" v-on:on="handleShowMinimap" v-on:off="handleHideMinimap">Minimap</power-toggle>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="showLabelTooltip" title-off="Show label tooltip" title-on="Hide label tooltip" v-on:on="handleShowLabelTooltip" v-on:off="handleHideLabelTooltip">Label Tooltip</power-toggle>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="showMousePosition" title-off="Show mouse position" title-on="Hide mouse position" v-on:on="handleShowMousePosition" v-on:off="handleHideMousePosition">Mouse Position</power-toggle>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="showThumbnailPreview" title-off="Show Thumbnail" title-on="Hide Thumbnail" v-on:on="handleShowThumbnailPreview" v-on:off="handleHideThumbnailPreview">Thumbnail preview</power-toggle>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :disabled="jumpByFrameNotSupported" :active="enableJumpByFrame" title-off="Enable jump by frame" title-on="Disable jump by frame" v-on:on="handleEnableJumpByFrame" v-on:off="handleDisableJumpByFrame">Jump by frame</power-toggle>
        <a href="{{route('manual-tutorials', ['videos', 'sidebar'])}}#jump-by-frame">(experimental)</a>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="muteVideo" title-off="Mute video" title-on="Unmute video" v-on:on="handleMuteVideo" v-on:off="handleUnmuteVideo">Mute Video</power-toggle>
    </div>

    <div class="sidebar-tab__section">
        <power-toggle :active="singleAnnotation" title-off="Enable always creating single-frame annotations" title-on="Disable always creating single-frame annotations" v-on:on="handleSingleAnnotation" v-on:off="handleDisableSingleAnnotation">Single-Frame Annotation</power-toggle>
    </div>
</div>
</script>
@endpush
