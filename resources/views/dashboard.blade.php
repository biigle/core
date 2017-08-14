@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title', trans('biigle.titles.dashboard'))

@push('styles')
    @foreach ($modules->getMixins('dashboardStyles') as $module => $nestedMixins)
        @include($module.'::dashboardStyles')
    @endforeach
@endpush

@push('scripts')
    @foreach ($modules->getMixins('dashboardScripts') as $module => $nestedMixins)
        @include($module.'::dashboardScripts')
    @endforeach
@endpush

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-5">
            @foreach ($modules->getMixins('dashboardHotBoxLeft') as $module => $nestedMixins)
                @include($module.'::dashboardHotBoxLeft')
            @endforeach
        </div>
        <div class="col-md-5">
            @foreach ($modules->getMixins('dashboardHotBoxRight') as $module => $nestedMixins)
                @include($module.'::dashboardHotBoxRight')
            @endforeach
        </div>
        <div class="col-md-2">
            @foreach ($modules->getMixins('dashboardButtons') as $module => $nestedMixins)
                @include($module.'::dashboardButtons')
            @endforeach
        </div>
    </div>
    @foreach ($modules->getMixins('dashboardMain') as $module => $nestedMixins)
        @include($module.'::dashboardMain', ['mixins' => $nestedMixins])
    @endforeach
</div>
@endsection
