@extends('app')

@section('title')@parent {{ trans('dias.titles.dashboard') }} @stop

@section('content')
<div class="container">
	<div class="row">
		<div class="col-md-10 col-md-offset-1">
			<h1>Dashboard</h1>
			<p>
				You are logged in!
			</p>
		</div>
	</div>
</div>
@endsection
