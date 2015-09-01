<nav class="navbar navbar-inverse navbar-static-top">
	<div class="container">
		<div class="navbar-header">
			<a class="navbar-brand logo logo-inverse" href="{{ route('home') }}">
				<span class="logo__biigle">BIIGLE</span><sup class="logo__dias">DIAS</sup>
			</a>
		</div>
        <div class="navbar-right">
            <ul class="nav navbar-nav">
                <li>
                    <a href="{{ route('documentation') }}" title="{{ trans('dias.titles.doc') }}"><i class="glyphicon glyphicon-book"></i></a>
                </li>
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><i class="glyphicon glyphicon-menu-hamburger"></i> <span class="caret"></span></a>
                    <ul class="dropdown-menu">
                        <li class="dropdown-header">
                            Signed in as <strong>{{ Auth::user()->name }}</strong>
                        </li>
                        <li role="separator" class="divider"></li>
                        <li>
                            <a href="{{ route('home') }}" title="Dashboard">Dashboard</a>
                        </li>
                        <li role="separator" class="divider"></li>
                        <li>
                            <a href="{{ route('settings') }}" title="{{ trans('dias.titles.settings') }}">{{ trans('dias.titles.settings') }}</a>
                        </li>
                        <li>
                            <a href="{{ url('auth/logout') }}" title="{{ trans('dias.titles.logout') }}">{{ trans('dias.titles.logout') }}</a>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
	</div>
</nav>
