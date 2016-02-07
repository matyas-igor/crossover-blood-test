import {RouteConfig, Router, RouteParams, ROUTER_DIRECTIVES, ROUTER_PROVIDERS, Location, LocationStrategy} from 'angular2/router';
import {Component, Inject} from 'angular2/core';
import {User} from './../services/user-service';
import {TopMenu} from './../directives/navigation/top-menu.directive';
import {Inform} from './../directives/navigation/inform.directive';
import {Fade} from './../directives/utils/fade.directive';
import {MapBlood} from './../directives/map/map.directive';
import {UserTypeSelectPanel} from './../directives/users/user-type-select-panel.directive';
import {Socket} from "../services/socket-factory";

@Component({
    selector: 'blood-app',
    template: `
    <top-menu></top-menu>
    <inform></inform>
    <user-type-select-panel></user-type-select-panel>

    <div class="full-height sub-top-menu">
        <map-blood [donationId]="donationId"></map-blood>
    </div>

    `,
    directives: [TopMenu, Fade, UserTypeSelectPanel, MapBlood, Inform]
})
@RouteConfig([
    {path: '...', name: 'BloodComponentIndex', component: BloodComponent}
])

export class BloodComponent {

    donationId:string = null;

    constructor() {
        var parameters = window.location.pathname.split('/');
        if (parameters.length == 3 && parameters[1] == 'donation' && parameters[2]) {
            this.donationId = parameters[2];
        }
    }

    ngOnInit() {
        User.check()
            .then(user => {
                console.log('User ->', user);
            });

        Socket.init();
    }

    ngOnDestroy() {

    }
}