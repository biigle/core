<div class="col-sm-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            <a href="{{route('admin-volumes')}}" title="Volumes"><h3 class="panel-title">Volumes</h3></a>
        </div>
        <div class="panel-body">
            <p class="h1 text-center">{{ Biigle\Volume::count() }}</p>
        </div>
    </div>
</div>
<div class="col-sm-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">Images</h3>
        </div>
        <div class="panel-body">
            <p class="h1 text-center">{{ number_format(Biigle\Image::count()) }}</p>
        </div>
    </div>
</div>
