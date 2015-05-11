@extends('app')

@section('title'){{ trans('dias.titles.dashboard') }}@stop

@section('styles')
	@foreach ($mixinStyles as $module => $nestedMixins)
		@include($module.'::dashboardStyles')
	@endforeach
@append

@section('scripts')
	@foreach ($mixinScripts as $module => $nestedMixins)
		@include($module.'::dashboardScripts')
	@endforeach
@append

@section('content')
<div class="container">
	<div class="col-lg-12">
		@forelse ($mixins as $module => $nestedMixins)
			@include($module.'::dashboard', array('mixins' => $nestedMixins))
		@empty
			<p class="alert alert-info">
				You don't have any dashboard modules activated yet.
			</p>
		@endforelse
	</div>
</div>
@endsection
