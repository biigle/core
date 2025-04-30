<component
    :is="plugins.exampleAnnotations"
    :volume-id="{!! $volume->id !!}"
    :label="selectedLabel"
    empty-src="{{ asset(config('thumbnails.empty_url')) }}"
    url-template="{{Storage::disk(config('largo.patch_storage_disk'))->url(':prefix/:id.'.config('largo.patch_format'))}}"
    ></component>
