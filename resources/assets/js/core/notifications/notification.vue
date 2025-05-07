<template>
<div class="panel" :class="classObject">
    <div class="panel-heading">
        <span class="pull-right">
            <span :title="item.created_at" v-text="item.created_at_diff"></span>
            <button
                v-if="isUnread"
                class="btn btn-default btn-xs"
                title="Mark as read"
                @click="markRead"
                :disabled="isLoading || null"
                >
                <i class="fa fa-check"></i>
            </button>
        </span>
        <h3 class="panel-title" v-text="item.data.title"></h3>
    </div>
    <div class="panel-body">
        {{item.data.message}}
        <p class="notification__action" v-if="item.data.action">
            <a
                :href="item.data.actionLink"
                v-text="item.data.action"
                @click.prevent="markReadAndOpenLink"
                :title="item.data.action"
                ></a>
        </p>
    </div>
</div>
</template>
<script>
import NotificationsApi from '../api/notifications.js';
import Store from './store.js';
import Messages from '../messages/store.js';

export default {
    emits: ['mark-read'],
    props: ['item', 'removeItem'],
    data() {
        return {
            isLoading: false
        };
    },
    computed: {
        classObject() {
            if (this.item.data.type) {
                return `panel-${this.item.data.type}`;
            }

            return 'panel-default';
        },
        isUnread() {
            return this.item.read_at === null;
        }
    },
    methods: {
        markRead() {
            this.isLoading = true;
            return NotificationsApi.markRead({id: this.item.id}, {})
                .then(() => {
                    this.$emit('mark-read', this.item);
                    if (this.removeItem) {
                        Store.remove(this.item.id);
                    }
                })
                .catch(Messages.handleErrorResponse)
                .finally(() => {
                    this.isLoading = false;
                });
        },
        markReadAndOpenLink() {
            let link = this.item.data.actionLink;
            if (this.item.read_at) {
                window.location = link;
            } else {
                this.markRead().finally(function () {
                    window.location = link;
                });
            }
        },
    },
};
</script>
