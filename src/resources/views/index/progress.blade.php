<div class="transect__progress" data-ng-controller="ProgressController">
    <div class="btn-group-vertical progress__buttons--top">
        <button type="button" class="btn btn-default btn-xs" title="Go to top 𝗛𝗼𝗺𝗲" data-ng-click="top()" data-ng-disabled="isAtTop()">
            <span class="glyphicon glyphicon-fast-backward"></span>
        </button>
        <button type="button" class="btn btn-default btn-xs" title="Previous page 𝗣𝗮𝗴𝗲 𝘂𝗽/𝗔𝗿𝗿𝗼𝘄 𝗹𝗲𝗳𝘁" data-ng-click="prevPage()" data-ng-disabled="isAtTop()">
            <span class="glyphicon glyphicon-step-backward"></span>
        </button>
        <button type="button" class="btn btn-default btn-xs" title="Previous row 𝗔𝗿𝗿𝗼𝘄 𝘂𝗽" data-ng-click="prevRow()" data-ng-disabled="isAtTop()">
            <span class="glyphicon glyphicon-triangle-left"></span>
        </button>
    </div>

    <div class="transect__progress-bar" data-ng-mousedown="beginScrolling()" data-ng-mouseup="stopScrolling($event)" data-ng-mouseleave="stopScrolling($event)" data-ng-mousemove="scroll($event)" data-ng-click="scrollOnce($event)">
        <div class="progress-bar__wrapper">
            <div class="progress-bar__progress" data-ng-style="{height: progress()}"></div>
        </div>
    </div>

    <div class="btn-group-vertical progress__buttons--bottom">
        <button type="button" class="btn btn-default btn-xs" title="Next row 𝗔𝗿𝗿𝗼𝘄 𝗱𝗼𝘄𝗻" data-ng-click="nextRow()" data-ng-disabled="isAtBottom()">
            <span class="glyphicon glyphicon-triangle-right"></span>
        </button>
        <button type="button" class="btn btn-default btn-xs" title="Next page 𝗣𝗮𝗴𝗲 𝗱𝗼𝘄𝗻/𝗔𝗿𝗿𝗼𝘄 𝗿𝗶𝗴𝗵𝘁" data-ng-click="nextPage()" data-ng-disabled="isAtBottom()">
            <span class="glyphicon glyphicon-step-forward"></span>
        </button>
        <button type="button" class="btn btn-default btn-xs" title="Go to bottom 𝗘𝗻𝗱" data-ng-click="bottom()" data-ng-disabled="isAtBottom()">
            <span class="glyphicon glyphicon-fast-forward"></span>
        </button>
    </div>
</div>
