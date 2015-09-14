<div data-ng-controller="MessagesController" class="messages container-fluid">
	<div data-alert="" data-ng-repeat="alert in alerts" data-type="@{{alert.type}}" data-close="close($index)" class="messages__message"><span data-ng-bind="alert.message"></span></div>
	@if (session()->has('message'))
		<div data-alert="" data-type="@if (session()->has('messageType')) {{session('messageType')}} @endif" class="messages__message" data-ng-hide="hide" data-close="hide = true">{{ session('message') }}</div>
	@endif
</div>
