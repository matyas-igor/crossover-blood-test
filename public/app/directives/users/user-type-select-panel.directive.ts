import {Component, Input, OnChanges} from 'angular2/core';
import {User} from './../../services/user-service';
import {Fade} from './../utils/fade.directive';
import {Notifications} from "../../services/notifications-factory";

@Component({
    selector: 'user-type-select-panel',
    template: `
    <fade-panel [open]="showPanel">
        <div class="aligner">
            <div class="container">
                <div class="row">
                    <div class="col-lg-6 col-lg-offset-3 col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 text-center">
                        <h1 class="text-thin margin-bottom-lg">Blood donation welcomes you!</h1>
                        <h3 class="text-thin margin-bottom-md">Please select your role</h3>
                        <div class="btn-group btn-group-lg hidden-xs" role="group">
                            <button type="button" class="btn btn-default" (click)="selectType('donor')">I am a Donor</button>
                            <button type="button" class="btn btn-default" (click)="selectType('patient')">I am a Patient</button>
                        </div>
                        <div class="btn-group visible-xs-inline-block" role="group">
                            <button type="button" class="btn btn-default" (click)="selectType('donor')">I am a Donor</button>
                            <button type="button" class="btn btn-default" (click)="selectType('patient')">I am a Patient</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </fade-panel>
    `,
    directives: [Fade]
})

export class UserTypeSelectPanel implements OnChanges {
    showPanel:boolean = false;

    _subscribe:Function = null;

    ngOnInit() {
        User.check()
            .then(user => {
                console.log('User panel ->', user);
                this.showPanel = user.type === null;

                // on user change type
                this._subscribe = User.subscribe(user => {
                    this.showPanel = user.type === null;
                });
            })
    }
    ngOnDestroy() {
        // clean subscribe to user update
        this._subscribe ? this._subscribe() : null;
    }
    ngOnChanges(changes) {
        //console.log('Changes', changes, this.play);
        return null;
    }

    selectType(type:string) {
        User.setType(type);
        Notifications.add({text: `
            <p><strong>Instructions:</strong></p>
            <ul>
                <li><em>As a Donor</em> – click on the map to create a donation offer</li>
                <li><em>As a Patient</em> – find green markers and click on them to see the offer</li>
            </ul>
        `, type: 'info', delay: 15000});
    }
}