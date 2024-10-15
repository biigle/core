<div id="messages-display" class="messages container-fluid">
    <transition-group name="scale-up">
        <message
            v-for="message in messages"
            v-bind:key="message.id"
            v-bind:id="message.id"
            v-bind:text="message.text"
            v-bind:type="message.type"
            inline-template
            v-cloak
            >
            <div
                class="messages__message alert"
                v-bind:class="typeClass"
                v-on:mouseenter="cancelTimeout"
                >
                <a v-on:click="close" href="#" class="close">&times;</a>
                <span v-text="text"></span>
            </div>
        </message>
    </transition-group>
</div>

@if (session()->has('message'))
    @push('scripts')
        <script type="module">
            biigle.$declare('staticMessage', {
                text: "{!! session('message') !!}",
                type: "{!! session('messageType', 'info') !!}",
            });
        </script>
    @endpush
@endif
