@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ trans('dias.titles.dashboard') }}@stop

@section('styles')
	@foreach ($modules->getMixins('dashboardStyles') as $module => $nestedMixins)
		@include($module.'::dashboardStyles')
	@endforeach
@append

@section('scripts')
	@foreach ($modules->getMixins('dashboardScripts') as $module => $nestedMixins)
		@include($module.'::dashboardScripts')
	@endforeach
@append

@section('content')
<div class="container">
	<div class="col-lg-12">
		@forelse ($modules->getMixins('dashboard') as $module => $nestedMixins)
			@include($module.'::dashboard', array('mixins' => $nestedMixins))
		@empty
			<p class="alert alert-info col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
				You don't have any dashboard modules activated yet.
			</p>
		@endforelse
	</div>
</div>
@endsection
