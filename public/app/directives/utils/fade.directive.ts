import {Component, Input, OnChanges} from 'angular2/core';

@Component({
    selector: 'fade-panel',
    template: `
    <div class="splash-outer" *ngIf="open">
        <div class="splash-fade"></div>
        <div class="splash-inner">
            <ng-content></ng-content>
        </div>
    </div>
    `
})

export class Fade implements OnChanges {
    @Input()open:boolean;

    ngOnInit() {

    }
    ngOnDestroy() {

    }
    ngOnChanges(changes) {
        console.log('Panel open', this.open);
        return null;
    }
}