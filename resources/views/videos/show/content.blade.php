<loader-block :active="loading"></loader-block>
<div v-cloak v-if="hasVideoError" class="error-message">
    <div class="panel" :class="errorClass">
        <div class="panel-body">
            <span v-if="hasNotProcessedError">
                The video has not been processed yet. Please try again later.
            </span>
            <span v-if="hasNotFoundError">
                The video file has not been found. Please check the source.
            </span>
            <span v-if="hasMimeTypeError">
                The video MIME type is invalid. Allowed MIME types: {{implode(', ', Biigle\Video::MIMES)}}.
            </span>
            <span v-if="hasCodecError">
                The video codec is invalid. Allowed codecs: {{implode(', ', Biigle\Video::CODECS)}}.
            </span>
            <span v-if="hasMalformedError">
                The video file seems to be malformed.
            </span>
            <span v-if="hasTooLargeError">
                The video file is too large.
            </span>
        </div>
    </div>
</div>
<message-curtain v-if="invalidMoovAtomPosition" v-cloak>
    <div class="message-curtain--text text-danger">
        <div class="lead">
            The video file contains an invalid moov atom position.<br>This can cause performance issues or incorrect annotation thumbnails in Largo.<br>See <a href="/manual/tutorials/videos/fix-video-encoding">the manual</a> for how to fix this.
        </div>
        <button type="button" class="btn btn-default" v-on:click="dismissMoovAtomError">Continue at own risk</button>
    </div>
</message-curtain>
<video-screen
      ref="videoScreen"
      :annotations="filteredAnnotations"
      :annotation-opacity="settings.annotationOpacity"
      :autoplay-draw="settings.autoplayDraw"
      :jump-step="settings.jumpStep"
      :can-add="canEdit"
      :can-modify="canEdit"
      :can-delete="canEdit"
      :initial-center="initialMapCenter"
      :initial-resolution="initialMapResolution"
      :selected-annotations="selectedAnnotations"
      :selected-label="selectedLabel"
      :show-label-tooltip="settings.showLabelTooltip"
      :show-minimap="settings.showMinimap"
      :single-annotation="settings.singleAnnotation"
      :show-mouse-position="settings.showMousePosition"
      :enable-jump-by-frame="settings.enableJumpByFrame"
      :video="video"
      :height-offset="screenHeightOffset"
      :show-prev-next="hasSiblingVideos"
      :has-error="hasError"
      :seeking="seeking"
      :reached-tracked-annotation-limit="reachedTrackedAnnotationLimit"
      v-on:create-annotation="createAnnotation"
      v-on:track-annotation="trackAnnotation"
      v-on:split-annotation="splitAnnotation"
      v-on:link-annotations="linkAnnotations"
      v-on:pending-annotation="updatePendingAnnotation"
      v-on:attach-label="attachAnnotationLabel"
      v-on:swap-label="swapAnnotationLabel"
      v-on:select="selectAnnotations"
      v-on:modify="modifyAnnotations"
      v-on:delete="deleteAnnotationsOrKeyframes"
      v-on:moveend="updateMapUrlParams"
      v-on:requires-selected-label="handleRequiresSelectedLabel"
      v-on:previous="showPreviousVideo"
      v-on:next="showNextVideo"
      v-on:attaching-active="handleAttachingLabelActive"
      v-on:swapping-active="handleSwappingLabelActive"
      v-on:seek="seek"
      v-on:start-seeking="startSeeking"
      v-on:is-invalid-shape="handleInvalidShape"
      ></video-screen>
<video-timeline
      ref="videoTimeline"
      :annotations="filteredAnnotations"
      :video="video"
      :seeking="seeking"
      :height-offset="timelineHeightOffset"
      :pending-annotation="pendingAnnotation"
      :show-thumbnail-preview="settings.showThumbnailPreview"
      :video-id="videoId"
      :has-error="hasError"
      :duration="videoDuration"
      v-on:seek="seek"
      v-on:select="selectAnnotation"
      v-on:deselect="deselectAnnotation"
      v-on:start-resize="startUpdateTimelineHeight"
      ></video-timeline>
