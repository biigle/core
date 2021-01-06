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
                    <annotation-patch v-for="(uuid, id) in exampleAnnotations" :key="id" :_id="id" :_uuid="uuid" :label="label" empty-src="{{ asset(config('thumbnails.empty_url')) }}" _url-template="{{Storage::disk(config('largo.patch_storage_disk'))->url(':prefix/:id.'.config('largo.patch_format'))}}" inline-template>
                        <img class="largo-example-annotation" :src="src" :title="title" v-on:error="showEmptyImage">
                    </annotation-patch>
                </div>
            </div>
            <p v-else class="text-muted">
                No example annotations available.
            </p>
        </div>
    </div>
</component>
