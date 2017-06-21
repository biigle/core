<component :is="plugins.exampleAnnotations" :volume-id="{!! $volume->id !!}" :label="selectedLabel" inline-template>
    <div v-if="isShown" class="largo-example-annotations">
        <p v-if="loading" class="text-muted">
            Loading example annotations...
        </p>
        <div v-else>
            <div v-if="hasExamples">
                <p class="text-muted" v-if="label.id !== exampleLabel.id">
                    Examples with label <strong v-text="exampleLabel.name"></strong>, may be similar to <strong v-text="label.name"></strong>:
                </p>
                <div class="largo-example-annotations__images">
                    <annotation-patch v-for="id in exampleAnnotations" :id="id" :label="label" empty-src="{{ asset(config('thumbnails.empty_url')) }}" inline-template>
                        <img class="largo-example-annotation" :src="src" :title="title">
                    </annotation-patch>
                </div>
            </div>
            <p v-else class="text-muted">
                No example annotations available.
            </p>
        </div>
    </div>
</component>
