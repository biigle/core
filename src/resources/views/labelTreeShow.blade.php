<div id="largo-example-annotations" class="panel panel-default largo-example-annotations">
    <div class="panel-body">
        <span class="text-muted" v-if="loading" v-cloak>Fetching example annotations</span>
        <div v-else>
            <div class="largo-example-annotations__images" v-if="hasExampleAnnotations" v-cloak>
                <annotation-patch v-for="id in exampleAnnotations" :key="id" :id="id" :label="selectedLabel" empty-src="{{ asset(config('thumbnails.empty_url')) }}" inline-template v-if="hasSelectedLabel">
                    <img class="largo-example-annotation" :src="src" :title="title">
                </annotation-patch>
            </div>
            <div v-else>
                <span class="text-muted" v-if="hasSelectedLabel" v-cloak>No example annotations available for label <strong v-text="selectedLabelName"></strong>.</span>
                <span class="text-muted" v-else>Select a label to see example annotations.</span>
            </div>
        </div>
    </div>
</div>
