<nav class="navbar navbar-inverse navbar-noradius">
	<div class="container">
		<div class="navbar-header">
			<a class="navbar-brand logo logo-inverse" href="{{ route('home') }}">
				<span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup>
			</a>
		</div>
		<div class="navbar-right">
			<p class="navbar-text">
				{{ Auth::user()->name }}
			</p>
			<ul class="nav navbar-nav">
				<li>
					<a href="{{ route('settings') }}" title="{{ trans('dias.titles.settings') }}"><i class="glyphicon glyphicon-cog"></i></a>
				</li>
				<li>
					<a href="{{ url('auth/logout') }}" title="{{ trans('dias.titles.logout') }}"><i class="glyphicon glyphicon-log-out"></i></a>
				</li>
			</ul>
		</div>
	</div>
</nav>