@inject('modules', 'Biigle\Services\Modules')

@if ($modules->getMixins('projectsShowToolbar'))
    <div class="col-md-12 form">
        <div class="form-group">
            @mixin('projectsShowToolbar')
        </div>
    </div>
@endif
