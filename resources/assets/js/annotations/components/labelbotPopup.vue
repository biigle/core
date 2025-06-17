<template>
  <ul class="labelbot-labels">
    <li class="labelbot-labels-label" v-for="(label, index) in labelbotLabels" :key="index" @mouseover="handleLabelbotFocus(index)" @click="selectLabelbotLabel(label)">
      <div v-if="index === 0" class="labelbot-labels-label__nameProgress">
        <!-- Progress bar -->
          <div v-show="progressBarWidth > -1" class="labelbot-labels-label__progress-bar" :style="{ width: progressBarWidth + '%' }" @transitionend="closeLabelbotPopup"></div>
        <!-- Label name -->
        <div class="labelbot-labels-label__nameProgressColor" :class="{ 'labelbot-labels-label__highlightedProgress': index === highlightedLabel && isFocused}">
          <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
          <span>{{ label.name }}</span>
          <!-- keyboard icon -->
          <span class="labelbot-labels-label__keyboard" :class="{ 'labelbot-labels-label__keyboardHighlighted' : index === highlightedLabel && isFocused}">
            <span class="fa fa-keyboard" aria-hidden="true"></span>
            <span v-text="index + 1"></span>
          </span>
        </div>
      </div>
      <div v-else class="labelbot-labels-label__name" :class="{ 'labelbot-labels-label__highlighted': index === highlightedLabel && isFocused}">
        <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
        <span>{{ label.name }}</span>
        <!-- keyboard icon -->
        <span class="labelbot-labels-label__keyboard" :class="{ 'labelbot-labels-label__keyboardHighlighted' : index === highlightedLabel && isFocused}">
          <span class="fa fa-keyboard" aria-hidden="true"></span>
          <span v-text="index + 1"></span>
        </span>
      </div>
    </li>
    <li class="labelbot-labels-label">
      <typeahead :key="popupKey" ref="popupTypeahead" :style="{ width: '100%' }" :items="labels" @focus="handleTypeaheadFocus" more-info="tree.versionedName" @select="selectLabelbotLabel" placeholder="Find label"></typeahead>
    </li>
  </ul>
</template>

<script>
import Typeahead from '../../label-trees/components/labelTypeahead.vue';
import Keyboard from '../../core/keyboard';

export default {
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
        this.$emit('update-labelbot-label', {"label": label, "popupKey" : this.popupKey});
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

      this.$emit('delete-labelbot-labels', this.popupKey);
    },
    handleTypeaheadFocus() {
      this.highlightedLabel = this.labelbotLabels.length; // We don't set it to -1 because this will not trigger the highlightedLabel watcher at start.
      this.typeaheadFocused = true;

      if (!this.isFocused) {
        this.$emit('change-labelbot-focused-popup', this.popupKey);
      }
    },
    handleLabelbotFocus(hoveredLabel) {
      this.highlightedLabel = hoveredLabel;

      if (!this.isFocused) {
        this.$emit('change-labelbot-focused-popup', this.popupKey);
      }
    },
    labelClose() {
      this.$nextTick(() => {
        if (!this.isFocused) return;

        this.closeLabelbotPopup();
      });
    },
    labelUp() {
      this.$nextTick(() => {
        if (!this.isFocused) return;

        this.highlightedLabel = this.highlightedLabel > 0 ? this.highlightedLabel - 1 : 0;
      });
    },
    labelDown() {
      this.$nextTick(() => {
        if (!this.isFocused) return;

        this.highlightedLabel = this.highlightedLabel < this.labelbotLabels.length - 1 ? this.highlightedLabel + 1 : this.labelbotLabels.length - 1;
      });
    },
    labelEnter() {
      this.$nextTick(() => {
        if (!this.isFocused || this.highlightedLabel > this.labelbotLabels.length - 1) return;

        // At the start the highlighted label is -1 so we need to check it before selecting the label.
        this.selectLabelbotLabel(this.labelbotLabels[this.highlightedLabel < 0 ? 0 : this.highlightedLabel]);
      });
    },
    handleTab(e) {
      if (e.key === "Tab") {
        e.preventDefault();
        this.labelTab();
      }
    },
    labelTab() {
      this.$nextTick(() => {
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
      });
    },
    deleteLabelAnnotation() {
      this.$nextTick(() => {
        if (!this.isFocused) return;

        this.resetPopup();

        this.$emit('delete-labelbot-labels-annotation', this.popupKey);
      });
    },
  },
  mounted() {
    // So the user can leave the focused input
    this.$refs.popupTypeahead?.$refs.input?.addEventListener("keydown", (e) => {
      this.handleTab(e);  
    });

    for (let key = 1; key <= 3; key++) {
      Keyboard.on(`${key}`, () => {
        this.$nextTick(() => {
          if (this.labelbotLabels[key - 1] && this.isFocused) {
            this.selectLabelbotLabel(this.labelbotLabels[key - 1]);
          }
        })
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