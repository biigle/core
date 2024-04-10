<template>
<div class="label-tree-label label-mapping-item">
    <div class="label-mapping-item-column">
        <div class="label-tree-label__name">
            <span class="label-tree-label__color" :style="colorStyle"></span>
            <span v-text="label.name"></span>
        </div>
    </div>
    <div class="label-mapping-item-chevron" :class="chevronClass">
        <i class="fas fa-chevron-right"></i>
    </div>
    <div class="label-mapping-item-column">
        <div v-if="mappedLabel" class="label-tree-label__name clearfix">
            <button
                class="btn btn-default pull-right"
                title="Change mapped label"
                type="button"
                :disabled="loading"
                @click="handleChange"
                ><i class="fa fa-pen fa-fw"></i></button>

            <span class="label-tree-label__color" :style="mappedLabelColorStyle"></span>
            {{mappedLabel.name}}<br>
            <span class="text-muted">{{mappedLabel.labelTreeName}}</span>
        </div>
        <div v-else class="clearfix">
            <div v-if="creating" class="create-form">
                <div class="row">
                    <div class="col-xs-8">
                        <input
                            class="form-control"
                            type="text"
                            name="name"
                            placeholder="New label name"
                            v-model="selectedName"
                            >
                    </div>
                    <div class="col-xs-4">
                        <input
                            class="form-control"
                            type="color"
                            name="color"
                            v-model="selectedColor"
                            >
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-8">
                        <select
                            class="form-control"
                            v-model="selectedTree"
                            >
                            <option value="" disabled selected>-- label tree --</option>
                            <option
                                v-for="tree in trees"
                                :value="tree.id"
                                :key="tree.id"
                                >{{tree.name}}</option>
                        </select>
                    </div>
                    <div class="col-xs-4 clearfix">
                        <span class="pull-right">
                            <button
                                class="btn btn-default"
                                type="button"
                                title="Cancel creating a new label"
                                :disabled="loading"
                                @click="cancelCreating"
                                ><i class="fa fa-times fa-fw"></i></button>
                            <button
                                class="btn btn-success"
                                type="button"
                                title="Create the new label"
                                :disabled="cantCreate"
                                @click="emitCreate"
                                ><i class="fa fa-check fa-fw"></i></button>
                        </span>
                    </div>
                </div>
            </div>
            <div v-else>
                <button
                    class="btn btn-default pull-right"
                    title="Create a new label"
                    type="button"
                    :disabled="loading"
                    @click="handleCreate"
                    ><i class="fa fa-plus fa-fw"></i></button>

                <typeahead
                    :items="labels"
                    :clear-on-select="true"
                    more-info="labelTreeName"
                    placeholder="Label name"
                    @select="handleSelect"
                    ></typeahead>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Typeahead from '../../label-trees/components/labelTypeahead';
import {randomColor} from '../../label-trees/utils';

export default {
    components: {
        Typeahead,
    },
    data() {
        return {
            creating: false,
            selectedTree: '',
            selectedColor: '',
            selectedName: '',
        };
    },
    props: {
        label: {
            required: true,
            type: Object,
        },
        labels: {
            default: () => [],
            type: Array,
        },
        trees: {
            default: () => [],
            type: Array,
        },
        loading: {
            default: false,
            type: Boolean,
        },
    },
    computed: {
        colorStyle() {
            return {
                'background-color': '#' + this.label.color,
            };
        },
        mappedLabelColorStyle() {
            if (!this.mappedLabel) {
                return '';
            }

            return {
                'background-color': '#' + this.mappedLabel.color,
            };
        },
        mappedLabel() {
            return this.labels.find(l => l.id === this.label.mappedLabel) || null;
        },
        chevronClass() {
            return this.label.mappedLabel ? 'text-muted' : 'text-info';
        },
        cantCreate() {
            return this.loading || !this.selectedTree || !this.selectedColor || !this.selectedName;
        },
    },
    methods: {
        handleSelect(label) {
            this.$emit('select', this.label, label.id);
        },
        handleChange() {
            this.$emit('select', this.label, null);
        },
        handleCreate() {
            this.creating = true;
            if (!this.selectedColor) {
                this.initializeColor();
            }

            if (!this.selectedName) {
                this.selectedName = this.label.name;
            }
        },
        cancelCreating() {
            this.creating = false;
        },
        initializeColor() {
            if ((typeof this.label.color === 'string') && /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(this.label.color)) {
                this.selectedColor = this.label.color.replace(/^#*/, '#');
            } else {
                this.selectedColor = randomColor();
            }
        },
        emitCreate() {
            this.$emit('create', this.label, this.selectedTree, {
                name: this.selectedName,
                color: this.selectedColor,
            });
        },
    },
    watch: {
        mappedLabel(label, oldLabel) {
            if (this.creating && label && !oldLabel) {
                this.creating = false;
            }
        },
    },
};
</script>
