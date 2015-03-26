@extends('app')

@section('title'){{ $transect->name }}@stop

@section('content')
<div class="container">
	<h2 class="col-lg-12 clearfix">
		{{ $transect->name }} <small title="Transect ID {{ $transect->id }}">#{{ $transect->id }}</small>
	</h2>

	@foreach ($mixins as $module => $nestedMixins)
		@include($module.'::transects', array('mixins' => $nestedMixins, 'transect' => $transect))
	@endforeach
</div>
@endsection
