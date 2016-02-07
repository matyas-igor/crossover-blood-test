import {Component, Input} from 'angular2/core';
import {User} from './../../services/user-service';

@Component({
    selector: 'top-menu',
    template: `
    <nav class="navbar navbar-default navbar-fixed-top">
        <div class="navbar-header">
            <a class="navbar-brand" href="/">BloodDonate</a>
        </div>

        <!-- Dektop -->
        <form class="navbar-form navbar-left hidden-xs" [hidden]="!user || !user.type">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" [class.active]="user && user.type == 'donor'" (click)="selectType('donor')">I am a Donor</button>
                <button type="button" class="btn btn-default" [class.active]="user && user.type == 'patient'" (click)="selectType('patient')">I am a Patient</button>
            </div>
        </form>
    </nav>

    <!-- Mobile -->
    <nav class="navbar navbar-default navbar-fixed-bottom visible-xs" [hidden]="!user || !user.type">
        <form class="navbar-form no-margins">
            <div class="btn-group btn-group-justified" role="group">
                <div class="btn-group">
                    <button type="button" class="btn btn-default" [class.active]="user && user.type == 'donor'" (click)="selectType('donor')">I am a Donor</button>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" [class.active]="user && user.type == 'patient'" (click)="selectType('patient')">I am a Patient</button>
                </div>
            </div>
        </form>
    </nav>
    `
})

export class TopMenu {

    private user:Object = null;

    _subscribe:Function = null;

    ngOnInit() {
        User.check()
            .then(user => {
                console.log('Top menu user ->', user);
                this.user = user;

                // on user change
                this._subscribe = User.subscribe(user => {
                    this.user = user;
                });
            });
    }
    ngOnDestroy() {
        // clean subscribe to user update
        this._subscribe ? this._subscribe() : null;
    }

    selectType(type:string) {
        User.setType(type);
    }
}