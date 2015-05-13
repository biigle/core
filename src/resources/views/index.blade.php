@extends('app')

@section('title'){{ $transect->name }}@stop

@section('scripts')
<script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
@append

@section('styles')
<link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
@append

@section('content')
<div class="transect-container" data-ng-app="dias.transects" data-ng-controller="TransectsController">
	
	@include('transects::index.images')
	@include('transects::index.sidebar')
</div>
@endsection
