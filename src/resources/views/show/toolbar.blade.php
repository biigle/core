@inject('modules', 'Dias\Services\Modules')

@if ($modules->getMixins('projectsShowToolbar'))
    <div class="col-md-12 form">
        <div class="form-group">
            @foreach ($modules->getMixins('projectsShowToolbar') as $module => $nestedMixins)
                @include($module.'::projectsShowToolbar')
            @endforeach
        </div>
    </div>
@endif
