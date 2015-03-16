@extends('app')

@section('title')@parent {{ trans('dias.titles.dashboard') }} @stop

@section('content')
<div class="container">
	<div class="row">
		<div class="col-md-10 col-md-offset-1">
			<h1>Dashboard</h1>
			@forelse ($mixins as $mixin)
				@include($mixin)
			@empty
				<p>
					You don't have any dashboard modules activated yet.
				</p>
			@endforelse
		</div>
	</div>
</div>
@endsection
