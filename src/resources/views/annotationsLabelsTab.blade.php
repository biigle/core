<component :is="plugins.exampleAnnotations" :volume-id="{!! $volume->id !!}" :label="selectedLabel" inline-template>
    <div v-if="isShown" class="largo-example-annotations">
        <div v-if="loading" class="alert alert-info">
            Loading example annotations...
        </div>
        <div v-else>
            <div class="largo-example-annotations__images" v-if="hasAnnotations">
                <annotation-patch v-for="id in exampleAnnotations" :id="id" :label="label" empty-src="{{ asset(config('thumbnails.empty_url')) }}" inline-template>
                    <img class="largo-example-annotation" :src="src" :title="title">
                </annotation-patch>
            </div>
            <div v-else class="alert alert-info">
                No example annotations available.
            </div>
        </div>
    </div>
</component>
