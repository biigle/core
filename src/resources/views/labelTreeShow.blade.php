<div id="largo-example-annotations" class="panel panel-default">
    <div class="panel-body" v-cloak>
        <annotation-patch v-for="id in exampleAnnotations" :key="id" :id="id" :label="selectedLabel" empty-src="{{ asset(config('thumbnails.empty_url')) }}" inline-template v-if="hasSelectedLabel">
            <img class="largo-example-annotation" :src="src" :title="title">
        </annotation-patch>
        <span class="text-muted" v-if="!hasSelectedLabel">Select a label to see example annotations.</span>
        <span class="text-muted" v-else v-if="!hasExampleAnnotations">No example annotations available for label <strong v-text="selectedLabelName"></strong>.</span>
    </div>
</div>
