import {FORM_DIRECTIVES, NgForm} from 'angular2/common'
import {Component, Input} from 'angular2/core';
import {Notifications} from './../../services/notifications-factory';

declare var window:any;

@Component({
    selector: 'inform',
    template: `
    <div class="inform inform-fixed">
        <div *ngFor="#MessageEntity of messages; #i=index" class="inform-message-wrap">
            <div class="inform-message alert alert-{{MessageEntity.type}} alert-dismissible" role="alert" (mouseenter)="cancelTimeout(MessageEntity)" (mouseleave)="setTimeout(MessageEntity)">
                <button type="button" class="close" (click)="remove(MessageEntity)"><span>&times;</span></button>
                <div class="inform-message-content">
                    <span class="badge inform-badge" [hidden]="MessageEntity.count <= 0">{{MessageEntity.count}}</span>
                    <span [innerHTML]="MessageEntity.text"></span>
                </div>
            </div>
        </div>
    </div>
    `,
    directives: [FORM_DIRECTIVES, NgForm]
})

export class Inform {

    _subscribe:Function = null;
    messages:any = [];

    setTimeout(message) {
        this.cancelTimeout(message);
        if (message.delay > 0) {
            message.timeout = window.setTimeout(() => {
                var messageIndex = this.messages.findIndex(x => x == message);
                if (messageIndex >= 0) {
                    delete message.timeout;
                    this.messages.splice(messageIndex, 1);
                }
            }, message.delay);
        }
    }

    cancelTimeout(message) {
        if (message.timeout) {
            window.clearTimeout(message.timeout);
            delete message.timeout;
        }
    }

    remove(message) {
        var messageIndex = this.messages.findIndex(x => x == message);
        if (messageIndex >= 0) {
            this.messages.splice(messageIndex, 1);
            this.cancelTimeout(message);
        }
    }
    add(message) {
        var messageToAdd = Object.assign({delay: 5000, type: 'default'}, message);
        this.messages.push(messageToAdd);
        this.setTimeout(messageToAdd);
    }

    ngOnInit() {
        this._subscribe = Notifications.subscribe((message) => {
            console.log('Add ->', message);
            this.add(message);
        });
    }
    ngOnDestroy() {
        // clean subscribe to user update
        this._subscribe ? this._subscribe() : null;
    }
}