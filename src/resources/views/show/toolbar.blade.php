@inject('modules', 'Biigle\Services\Modules')

@if ($modules->getMixins('labelTreesShowToolbar'))
    <div class="col-md-12 form">
        <div class="form-group">
            @mixin('labelTreesShowToolbar')
        </div>
    </div>
@endif
