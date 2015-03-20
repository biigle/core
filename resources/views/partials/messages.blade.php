<div data-ng-controller="MessagesController" class="messages container-fluid">
	<div class="row">
		<div data-alert="" data-ng-repeat="alert in alerts" data-type="@{{alert.type}}" data-close="close($index)" class="messages__message"><span data-ng-bind-html="alert.message"></span></div>
		@if (isset($message))
			<div data-alert="" data-type="{{ isset($messageType) ? $messageType : 'info' }}" class="messages__message" data-ng-hide="hide" data-close="hide = true">{{ $message }}</div>
		@endif
	</div>
</div>