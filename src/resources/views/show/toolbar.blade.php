@inject('modules', 'Biigle\Services\Modules')

@if ($modules->getMixins('labelTreesShowToolbar'))
    <div class="col-md-12 form">
        <div class="form-group">
            @foreach ($modules->getMixins('labelTreesShowToolbar') as $module => $nestedMixins)
                @include($module.'::labelTreesShowToolbar')
            @endforeach
        </div>
    </div>
@endif
