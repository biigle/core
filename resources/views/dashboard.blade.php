@extends('app')

@section('title', 'Dashboard')

@push('styles')
    @mixin('dashboardStyles')
@endpush

@push('scripts')
    @mixin('dashboardScripts')
@endpush

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-5">
            @mixin('dashboardHotBoxLeft')
        </div>
        <div class="col-md-5">
            @mixin('dashboardHotBoxRight')
        </div>
        <div class="col-md-2">
            @mixin('dashboardButtons')
        </div>
    </div>
    @mixin('dashboardMain')
</div>
@endsection
