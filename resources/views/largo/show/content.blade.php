<div class="sidebar-container__content">
    <dismiss-image-grid
        v-if="isInDismissStep"
        ref="dismissGrid"
        empty-url="{{ asset(config('thumbnails.empty_url')) }}"
        selected-icon="times"
        :images="sortedAnnotations"
        :width="{{config('thumbnails.width')}}"
        :height="{{config('thumbnails.height')}}"
        :selectable="true"
        :pinnable="imagesPinnable"
        :pinned-image="pinnedImageInAnnotations ? pinnedImage : null"
        v-on:select="handleSelectedImageDismiss"
        v-on:pin="handlePinImage"
        ></dismiss-image-grid>
    <relabel-image-grid
        v-cloak
        v-else
        empty-url="{{ asset(config('thumbnails.empty_url')) }}"
        :images="dismissedAnnotations"
        :width="{{config('thumbnails.width')}}"
        :height="{{config('thumbnails.height')}}"
        :selectable="true"
        v-on:select="handleSelectedImageRelabel"
        ></relabel-image-grid>
    <div class="largo-images__alerts"  :class="{block: loading}">
        <div v-cloak v-if="loading">
            <loader :active="true" :fancy="true"></loader>
        </div>
        <div v-if="isInDismissStep && !selectedLabel && !loading" class="text-info">
            Please choose a label in the sidebar.
        </div>
        <div v-cloak v-if="isInDismissStep && hasNoAnnotations" class="text-info">
            There are no annotations with the label <strong v-text="selectedLabel.name"></strong><span v-if="hasActiveFilters"> and the selected filters</span>.
        </div>
    </div>
</div>
<sidebar v-cloak open-tab="labels" v-on:open="handleOpenTab">
    <sidebar-tab class="largo-tab" name="labels" icon="tags" title="Label trees">
        <div class="largo-tab__button">
            <button v-if="isInDismissStep" class="btn btn-success btn-block" :disabled="!hasDismissedAnnotations || null" title="Go to the relabelling step" v-on:click="goToRelabel">Continue</button>
            <div v-else class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button class="btn btn-default col-xs-6" title="Go back to dismissing annotations" :disabled="loading || null" v-on:click="goToDismiss">Back</button>
                </div>
                <div class="btn-group">
                    <button v-if="loading" class="btn col-xs-6" :class="saveButtonClass" title="Saving the changes" disabled><loader :active="true"></loader> Saving</button>
                    <button v-else class="btn col-xs-6" :class="saveButtonClass" title="Save the changes" v-on:click="save">Save</button>
                </div>
            </div>
        </div>
        @can('force-edit-in', $target)
            <div v-if="isInRelabelStep" class="largo-tab__button">
                <power-toggle :active="forceChange" type="danger" title="Delete or replace annotation labels created by other users" v-on:on="enableForceChange" :disabled="loading || null" v-on:off="disableForceChange">Force delete/relabel</power-toggle>
            </div>
        @endcan
        <label-trees class="largo-tab__label-trees" :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
    </sidebar-tab>
    @include('largo.labelList')
    <sidebar-tab :disabled="isInRelabelStep || null" name="sorting" icon="exchange-alt fa-rotate-90" title="Sort patches" :highlight="sortingIsActive">
        <sorting-tab
            :needs-similarity-reference="needsSimilarityReference"
            :sort-key="sortingKey"
            :sort-direction="sortingDirection"
            v-on:change-direction="updateSortDirection"
            v-on:change-key="updateSortKey"
            v-on:init-similarity="handleInitSimilaritySort"
            v-on:cancel-similarity="handleCancelSimilaritySort"
            ></sorting-tab>
    </sidebar-tab>
    <sidebar-tab :highlight="hasActiveFilters" :disabled="isInRelabelStep" name="filtering" icon="exchange-alt fa-filter fa-solid" title="Filter">
            <filtering-tab
                v-on:reset-filters="resetFilteringTab"
                v-on:add-filter="addNewFilter"
                v-on:set-union-logic="setUnionLogic"
                v-on:remove-filter="removeFilter"
                :active-filters="activeFilters"
                :union="union"
                ></filtering-tab>
    </sidebar-tab>
    <sidebar-tab name="settings" icon="cog" title="Settings">
        <settings-tab
            v-on:change-outlines="updateShowOutlines"
            ></settings-tab>
    </sidebar-tab>
</sidebar>
