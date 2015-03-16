<div class="messages container-fluid">
	<div class="messages__container row">
		@if (isset($message))
			<div class="messages__message col-lg-12 bg-{{ isset($messageType) ? $messageType : 'info' }}">
				{{ $message }}
			</div>
		@endif
	</div>
</div>