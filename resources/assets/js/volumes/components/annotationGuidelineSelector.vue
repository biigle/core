<template>
    <div v-if="hasGuidelines" class="annotation-guideline-selector well well-sm">
        <button
            v-if="hasSingleGuideline"
            type="button"
            class="btn btn-default btn-block"
            :class="{'btn-info active': modelValue}"
            :disabled="hasSingleEnforcedGuideline"
            :title="toggleTitle"
            v-on:click="toggle"
            >
            <i class="fa fa-clipboard-list fa-fw"></i> Use Guideline
        </button>
        <!-- Any tag other than "div" prevents the .btn-group class, which can't hold a full-width button. -->
        <dropdown
            v-else
            tag="section"
            class="annotation-guideline-selector__dropdown"
            >
            <button
                type="button"
                class="btn btn-default btn-block dropdown-toggle"
                :class="{'btn-info active': modelValue}"
                title="Choose an annotation guideline"
                >
                <i class="fa fa-clipboard-list fa-fw"></i> Use Guideline <span class="caret"></span>
            </button>
            <template #dropdown>
                <li
                    v-for="guideline in guidelines"
                    :key="guideline.id"
                    :class="{active: guideline.id === modelValue?.id}"
                    >
                    <a
                        href="#"
                        v-on:click.prevent="handleClick(guideline.id)"
                        v-text="getOptionText(guideline)"
                        ></a>
                </li>
            </template>
        </dropdown>
        <div v-if="modelValue" class="annotation-guideline-selector__info">
            <p v-text="getOptionText(modelValue)"></p>
            <p v-if="modelValue.description" v-text="modelValue.description"></p>
            <p v-else class="text-muted">The guideline has no description.</p>
        </div>
    </div>
</template>

<script>
import {Dropdown} from 'uiv';

/**
 * Select one of the annotation guidelines that are available for a volume.
 *
 * The choice is remembered per volume so it is shared by all views of the volume.
 */
export default {
    emits: ['update:modelValue'],
    components: {
        dropdown: Dropdown,
    },
    props: {
        modelValue: {
            type: Object,
            default: null,
        },
        // Guidelines must include their project with name.
        guidelines: {
            type: Array,
            default: () => [],
        },
        mustUseGuideline: {
            type: Boolean,
            default: false,
        },
        volumeId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        hasGuidelines() {
            return this.guidelines.length > 0;
        },
        storageKey() {
            return `biigle.volumes.${this.volumeId}.annotation-guideline`;
        },
        selectableGuidelines() {
            return this.guidelines.filter(this.isSelectable);
        },
        hasSingleEnforcedGuideline() {
            return this.mustUseGuideline && this.selectableGuidelines.length === 1;
        },
        hasSingleGuideline() {
            return this.guidelines.length === 1;
        },
        toggleTitle() {
            if (this.hasSingleEnforcedGuideline) {
                return 'The annotation guideline is enforced';
            }

            return this.modelValue ? 'Disable the annotation guideline' : 'Enable the annotation guideline';
        },
    },
    methods: {
        // Only enforced guidelines of projects where the user can annotate can be sent
        // as guideline_id. All other guidelines are informational for the user.
        isSelectable(guideline) {
            return guideline?.enforced && guideline?.can_annotate;
        },
        getOptionText(guideline) {
            if (this.isSelectable(guideline)) {
                return `Project: ${guideline.project.name} (enforced)`;
            }

            return `Project: ${guideline.project.name} (not enforced)`;
        },
        choose(id) {
            localStorage.setItem(this.storageKey, JSON.stringify(id));
            this.select(id);
        },
        toggle() {
            this.choose(this.modelValue ? null : this.guidelines[0].id);
        },
        handleClick(id) {
            if (id !== this.modelValue?.id) {
                this.choose(id);
            } else if (!this.mustUseGuideline) {
                this.choose(null);
            }
        },
        select(id) {
            let guideline = this.guidelines.find(g => g.id === id) || null;
            this.$emit('update:modelValue', guideline);
        },
        getStoredId() {
            let stored = localStorage.getItem(this.storageKey);
            if (stored === null) {
                return undefined;
            }

            let id = JSON.parse(stored);
            if (id === null && !this.mustUseGuideline) {
                return null;
            }

            if (this.guidelines.some(g => g.id === id)) {
                return id;
            }

            localStorage.removeItem(this.storageKey);

            return undefined;
        },
    },
    created() {
        if (!this.hasGuidelines) {
            return;
        }

        // The stored choice is ignored because the toggle can't be used to change it.
        if (this.hasSingleGuideline && this.hasSingleEnforcedGuideline) {
            this.select(this.selectableGuidelines[0].id);
            return;
        }

        let id = this.getStoredId();
        if (id !== undefined) {
            this.select(id);
            return;
        }

        // A guideline must be used even if there are informational guidelines of
        // projects where the user is a guest, as these don't count for mustUseGuideline.
        if (this.mustUseGuideline || this.selectableGuidelines.length === this.guidelines.length) {
            this.select(this.selectableGuidelines[0]?.id ?? null);
            return;
        }

        this.select(null);
    },
};
</script>
