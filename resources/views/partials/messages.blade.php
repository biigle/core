<div id="messages-display" class="messages container-fluid">
    @if (session()->has('message'))
        <message inline-template>
            <div class="messages__message alert @if (session()->has('messageType')) alert-{{session('messageType')}} @else alert-info @endif">
                <a v-on:click="close()" href="#" class="close">&times;</a>
                {{ session('message') }}
            </div>
        </message>
    @endif
    <transition-group name="scale-up">
        <message v-for="message in messages" v-bind:message="message" v-bind:key="message.id" inline-template v-cloak>
            <div class="messages__message alert" v-bind:class="typeClass">
                <a v-on:click="close()" href="#" class="close">&times;</a>
                <span v-text="message.text"></span>
            </div>
        </message>
    </transition-group>
</div>
