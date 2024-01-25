<div class="sidebar-container__content">
    <dismiss-image-grid v-if="isInDismissStep" ref="dismissGrid" :images="sortedAnnotations" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" v-on:select="handleSelectedImageDismiss" :selectable="true" selected-icon="times"></dismiss-image-grid>
    <relabel-image-grid v-cloak v-else :images="dismissedAnnotations" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" v-on:select="handleSelectedImageRelabel" :selectable="true"></relabel-image-grid>
    <div class="largo-images__alerts" :class="{block: loading}">
        <div v-cloak v-if="loading">
            <loader :active="true" :fancy="true"></loader>
        </div>
        <div v-if="isInDismissStep && !selectedLabel" class="text-info">
            Please choose a label in the sidebar.
        </div>
        <div v-cloak v-if="isInDismissStep && hasNoAnnotations" class="text-info">
            There are no annotations with the label <strong v-text="selectedLabel.name"></strong>.
        </div>
    </div>
</div>
<sidebar v-cloak open-tab="labels">
    <sidebar-tab class="largo-tab" name="labels" icon="tags" title="Label trees">
        <div class="largo-tab__button">
            <button v-if="isInDismissStep" class="btn btn-success btn-block" :disabled="!hasDismissedAnnotations" title="Go to the re-labelling step" v-on:click="goToRelabel">Continue</button>
            <div v-else class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button class="btn btn-default col-xs-6" title="Go back to dismissing annotations" :disabled="loading" v-on:click="goToDismiss">Back</button>
                </div>
                <div class="btn-group">
                    <button v-if="loading" class="btn col-xs-6" :class="saveButtonClass" title="Saving the changes" disabled><loader :active="true"></loader> Saving</button>
                    <button v-else class="btn col-xs-6" :class="saveButtonClass" title="Save the changes" v-on:click="save">Save</button>
                </div>
            </div>
        </div>
        @can('force-edit-in', $target)
            <div v-if="isInRelabelStep" class="largo-tab__button">
                <power-toggle :active="forceChange" type="danger" title="Delete or replace annotation labels created by other users" v-on:on="enableForceChange" :disabled="loading" v-on:off="disableForceChange">Force delete/re-label</power-toggle>
            </div>
        @endcan
        <label-trees class="largo-tab__label-trees" :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
    </sidebar-tab>
    <sidebar-tab :disabled="isInRelabelStep" name="sorting" icon="exchange-alt fa-rotate-90" title="Sort patches" :highlight="sortingIsActive">
        <sorting-tab
            v-on:change-direction="updateSortDirection"
            v-on:change-key="updateSortKey"
            ></sorting-tab>
    </sidebar-tab>
</sidebar>
