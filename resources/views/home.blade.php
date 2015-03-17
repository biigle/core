@extends('app')

@section('title')@parent {{ trans('dias.titles.dashboard') }} @stop

@section('content')
@include('partials.messages')
<div class="container">
	<div class="col-lg-12">
		@forelse ($mixins as $module => $nestedMixins)
			@include($module.'::dashboard', array('mixins' => $nestedMixins))
		@empty
			<p class="text-muted">
				You don't have any dashboard modules activated yet.
			</p>
		@endforelse
	</div>
</div>
@endsection
