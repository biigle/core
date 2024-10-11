<template>
    <li class="list-group-item invitation-list-item">
        <h4 class="list-group-item-heading">
            <span :class="classObject">
                Invitation for role <span v-text="role.name"></span>
            </span>
            <small v-if="expired">
                (expired)
            </small>
            <small v-else :title="expiresDateTitle">
                (expires in <span v-text="expiresInHoursText"></span>)
            </small>
            <span class="pull-right invitation-list-buttons">
                <button
                    class="btn btn-sm btn-default"
                    title="Show QR code"
                    @click="handleShowQrCode"
                    >
                    <i class="fa fa-qrcode"></i>
                </button>
                <button
                    class="btn btn-sm btn-default"
                    title="Copy link to clipboard"
                    @click="handleCopyLink"
                    :disabled="clipboardWriteSuccess"
                    >
                    <span v-if="clipboardWriteSuccess">Link copied!</span>
                    <i v-else class="fa fa-link"></i>
                </button>
                <button
                    class="btn btn-sm btn-default"
                    title="Delete invitation"
                    @click="handleDelete"
                    >
                    <i class="fa fa-trash"></i>
                </button>
            </span>
        </h4>
        <p class="list-group-item-text text-muted">
            <span v-if="invitation.add_to_sessions">Add to annotation sessions.</span>
            <span>
                Used: <span v-text="uses"></span><span v-if="invitation.max_uses"> of <span v-text="invitation.max_uses"></span></span> times.
            </span>
        </p>
    </li>
</template>

<script>
import Messages from '@/core/messages/store.vue';

export default {
    props: {
        invitation: {
            type: Object,
            required: true,
        },
        roles: {
            type: Array,
            required: true,
        },
        baseUrl: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            clipboardWriteSuccess: false,
        };
    },
    computed: {
        role() {
            return this.roles.find((role) => {
                return this.invitation.role_id === role.id;
            });
        },
        uses() {
            // current_uses can be undefined if the invitation was just created.
            return this.invitation.current_uses || 0;
        },
        expired() {
            let expiresDate = new Date(this.invitation.expires_at);
            let now = new Date();

            return expiresDate < now || (this.invitation.max_uses && this.invitation.current_uses >= this.invitation.max_uses);
        },
        classObject() {
            return {
                'text-muted': this.expired,
            };
        },
        expiresDateTitle() {
            let date = new Date(this.invitation.expires_at);

            return `Expires on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
        },
        link() {
            return `${this.baseUrl}/${this.invitation.uuid}`;
        },
        expiresInHours() {
            let expiresDate = new Date(this.invitation.expires_at);
            let now = new Date();

            // Subtraction returns the difference in ms. We want h.
            return (expiresDate - now) / 3600000;
        },
        expiresInHoursText() {
            if (this.expiresInHours < 1) {
                let minutes = Math.round(this.expiresInHours * 60);

                return `${minutes} minutes`;
            }

            return `${Math.round(this.expiresInHours)} hours`;
        },
    },
    methods: {
        handleCopyLink() {
            navigator.permissions.query({name: "clipboard-write"})
                .then((result) => {
                    if (result.state === "granted" || result.state === "prompt") {
                        this.writeLinkToClipboard();
                    }
                // If the permission could not be requested, maybe we are in Firefox
                // and it works without permission, so try anyway.
                }, this.writeLinkToClipboard)
                .catch(() => Messages.danger('Could not write to clipboard.'));
        },
        writeLinkToClipboard() {
            return navigator.clipboard.writeText(this.link).then(() => {
               this.clipboardWriteSuccess = true;
            });
        },
        handleShowQrCode() {
            this.$emit('show', this.invitation);
        },
        handleDelete() {
            if (confirm('Do you really want to delete the invitation?')) {
                this.$emit('delete', this.invitation.id);
            }
        },
    },
    watch: {
        clipboardWriteSuccess(success) {
            if (success) {
                window.setTimeout(() => this.clipboardWriteSuccess = false, 3000);
            }
        }
    }
};
</script>
