import {Component, Input, OnChanges} from 'angular2/core';

@Component({
    selector: 'popover',
    template: `
    <div class="popover {{direction}}" [style.left.px]="left" [style.top.px]="top" *ngIf="open" style="display: block; max-width: 300px; width: 300px;">
        <div class="arrow"></div>
        <h3 class="popover-title">{{title}}</h3>
        <div class="popover-content">
            <ng-content></ng-content>
        </div>
    </div>
    `
})

export class Popover implements OnChanges {

    @Input() title:string = '';
    @Input() open:boolean = false;
    @Input() element = null;

    @Input() shiftY = 0;
    @Input() shiftX = 0;

    private direction = 'top';

    top = 0;
    left = 0;

    ngOnInit() {

    }
    ngOnDestroy() {

    }
    ngOnChanges(changes) {
        if (changes.element && this.open) {
            this._positionizePopover(changes);
        }
        return null;
    }

    _positionizePopover(changes) {
        // 300x284

        var w = window.innerWidth;
        var h = window.innerHeight;

        var element = changes.element.currentValue;
        // clientX: 372
        // clientY: 343
        console.log('Popup show ->', this.shiftX, this.shiftY);

        this.left = element.clientX + this.shiftX;
        this.top = element.clientY + this.shiftY;

        if (element.clientY < 310) {
            this.direction = 'bottom';
        } else if ((element.clientX < 150 && window.innerWidth > 650) || (element.clientX < 35 && window.innerWidth <= 650)) {
            this.direction = 'right';
        } else if ((w - element.clientX) < 150 && window.innerWidth > 650 || ((w - element.clientX) < 35 && window.innerWidth <= 650)) {
            this.direction = 'left';
        } else {
            this.direction = 'top';
        }
    }
}