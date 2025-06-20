<template>
  <ul class="labelbot-labels">
    <li
      v-for="(label, index) in labelbotLabels"
      class="labelbot-label" :class="{ 'labelbot-label--highlighted': index === highlightedLabel}"
      :key="index"
      @mouseover="handleLabelbotFocus(index)"
      @click="selectLabelbotLabel(label)"
      :title="`Choose label ${label.name}`"
      >
        <div
          v-if="index === 0"
          v-show="progressBarWidth > -1"
          class="labelbot-label__progress-bar"
          :style="{ width: progressBarWidth + '%' }"
          @transitionend="closeLabelbotPopup"
          ></div>
        <div class="labelbot-label__name">
          <span class="labelbot-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
          <span>{{ label.name }}</span>
          <span class="labelbot-label__keyboard">
            <span class="fa fa-keyboard" aria-hidden="true"></span>
            <span v-text="index + 1"></span>
          </span>
        </div>
    </li>
    <li>
      <typeahead
        :items="labels"
        :key="popupKey"
        class="typeahead--block"
        more-info="tree.versionedName"
        placeholder="Find label"
        ref="popupTypeahead"
        title="Choose a different label"
        @focus="handleTypeaheadFocus"
        @select="selectLabelbotLabel"
        ></typeahead>
    </li>
  </ul>
</template>

<script>
import Typeahead from '../../label-trees/components/labelTypeahead.vue';
import Keyboard from '../../core/keyboard';

export default {
  emits: [
    'update',
    'close',
    'delete',
  ],
  components: {
    typeahead: Typeahead,
  },
  props: {
    labelbotLabels: {
      type: Array,
      required: true,
    },
    popupKey: {
      type: Number,
      required: true,
    },
    focusedPopupKey: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      progressBarWidth: -1,
      highlightedLabel: -1,
      typeaheadFocused: false,
      selectedLabel: null,
      trees: [],
    };
  },
  computed: {
    localeCompareSupportsLocales() {
      try {
        'foo'.localeCompare('bar', 'i');
      } catch (e) {
          return e.name === 'RangeError';
      }

      return false;
    },
    labels() {
        let labels = [];
        this.trees.forEach(function (tree) {
            Array.prototype.push.apply(labels, tree.labels);
        });

        if (this.localeCompareSupportsLocales) {
            let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
            labels.sort(function (a, b) {
                return collator.compare(a.name, b.name);
            });
        } else {
            labels.sort(function (a, b) {
                return a.name < b.name ? -1 : 1;
            });
        }

        return labels;
    },
    isFocused() {
      return this.popupKey === this.focusedPopupKey;
    }
  },
  watch: {
    labelbotLabels() {
      this.progressBarWidth = 0;
      if (this.labelbotLabels.length > 0) {
        this.selectedLabel = this.labelbotLabels[0];
        setTimeout(() => this.progressBarWidth = 100, 10);
      }
    },
    highlightedLabel() {
      if (this.progressBarWidth > 0) {
        this.progressBarWidth = -1; // setting it to 0 will cause backward transition for the Top 1 Label.
      }
    },
  },
  methods: {
    selectLabelbotLabel(label) {
      // Top 1 label is already attached/selected
      if (this.selectedLabel.id !== label.id) {
        this.$emit('update', {label: label, popupKey: this.popupKey});
      }

      this.closeLabelbotPopup();
    },
    resetPopup() {
      this.$refs.popupTypeahead?.clear();
      this.highlightedLabel = -1;
      this.typeaheadFocused = false;
    },
    closeLabelbotPopup() {
      this.resetPopup();

      this.$emit('close', this.popupKey);
    },
    handleTypeaheadFocus() {
      this.highlightedLabel = this.labelbotLabels.length; // We don't set it to -1 because this will not trigger the highlightedLabel watcher at start.
      this.typeaheadFocused = true;
    },
    handleLabelbotFocus(hoveredLabel) {
      this.highlightedLabel = hoveredLabel;
    },
    labelClose() {
      if (!this.isFocused) return;

      this.closeLabelbotPopup();
    },
    labelUp() {
      if (!this.isFocused) return;

        this.highlightedLabel = this.highlightedLabel > 0 ? this.highlightedLabel - 1 : 0;
    },
    labelDown() {
      if (!this.isFocused) return;

        this.highlightedLabel = this.highlightedLabel < this.labelbotLabels.length - 1 ? this.highlightedLabel + 1 : this.labelbotLabels.length - 1;
    },
    labelEnter() {
      if (!this.isFocused || this.highlightedLabel > (this.labelbotLabels.length - 1)) {
        return;
      }

      // At the start the highlighted label is -1 so we need to check it before selecting the label.
      this.selectLabelbotLabel(this.labelbotLabels[this.highlightedLabel < 0 ? 0 : this.highlightedLabel]);
    },
    handleTab(e) {
      if (e.key === "Tab") {
        e.preventDefault();
        this.labelTab();
      }
    },
    labelTab() {
      if (!this.isFocused) return;

      if (!this.typeaheadFocused) {
        this.$refs.popupTypeahead?.$refs.input.focus();
        this.highlightedLabel = this.labelbotLabels.length;
        this.typeaheadFocused = true;
      } else {
        this.$refs.popupTypeahead?.$refs.input.blur();
        this.highlightedLabel = this.labelbotLabels.length - 1;
        this.typeaheadFocused = false;
      }
    },
    deleteLabelAnnotation() {
      if (!this.isFocused) return;

      this.resetPopup();

      this.$emit('delete', this.popupKey);
    },
  },
  mounted() {
    // So the user can leave the focused input
    this.$refs.popupTypeahead?.$refs.input?.addEventListener("keydown", (e) => {
      this.handleTab(e);
    });

    for (let key = 1; key <= 3; key++) {
      Keyboard.on(`${key}`, () => {
        if (this.labelbotLabels[key - 1] && this.isFocused) {
          this.selectLabelbotLabel(this.labelbotLabels[key - 1]);
        }
      }, 0, 'labelbot');
    }
  },
  created() {
    this.trees = biigle.$require('annotations.labelTrees');

    Keyboard.on('Escape', this.labelClose, 0, 'labelbot');
    Keyboard.on('arrowup', this.labelUp, 0, 'labelbot');
    Keyboard.on('arrowdown', this.labelDown, 0, 'labelbot');
    Keyboard.on('Enter', this.labelEnter, 0, 'labelbot');
    Keyboard.on('delete', this.deleteLabelAnnotation, 0, 'labelbot');
    Keyboard.on('tab', this.labelTab, 0, 'labelbot');
  },
};
</script>
