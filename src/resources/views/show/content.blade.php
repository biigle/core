<div class="largo-images">
    <dismiss-image-grid v-if="isInDismissStep" :images="annotations" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" v-on:select="handleDismissedImage" v-on:deselect="handleUndismissedImage"></dismiss-image-grid>
    <relabel-image-grid v-cloak v-else :images="dismissedAnnotations" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" v-on:select="handleRelabelledImage" v-on:deselect="handleUnrelabelledImage"></relabel-image-grid>
    <div class="largo-images__alerts" :class="{block: loading}">
        <div v-cloak v-if="loading">
            <loader :active="true" :fancy="true"></loader>
        </div>
        <div v-if="isInDismissStep && !selectedLabel" class="alert alert-info">
            Please choose a label in the sidebar.
        </div>
        <div v-cloak v-if="isInDismissStep && hasNoAnnotations" class="alert alert-info">
            There are no annotations with the label <strong v-text="selectedLabel.name"></strong>.
        </div>
    </div>
</div>
<sidebar :show-buttons="false" open-tab="labels">
    <sidebar-tab class="largo-tab" slot="tabs" name="labels" icon="tags" title="Label trees">
        <div v-cloak class="largo-tab__button">
            <button v-if="isInDismissStep" class="btn btn-success btn-block" :disabled="!hasDismissedAnnotations" title="Go to the re-labelling step" v-on:click="goToRelabel">Continue</button>
            <div v-cloak v-else class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button class="btn btn-default col-xs-6" title="Go back to dismissing annotations" :disabled="loading" v-on:click="goToDismiss">Back</button>
                </div>
                <div class="btn-group">
                    <button class="btn btn-success col-xs-6" title="Save the changes" :disabled="loading" v-on:click="save">Save</button>
                </div>
            </div>
        </div>
        <label-trees class="largo-tab__label-trees" :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
    </sidebar-tab>
</sidebar>
