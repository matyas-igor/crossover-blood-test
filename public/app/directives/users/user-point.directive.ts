import {FORM_DIRECTIVES, NgForm} from 'angular2/common'
import {Component, Input, OnChanges, ViewChild, DoCheck, Output, EventEmitter} from 'angular2/core';
import {Popover} from './../utils/popover.directive';
import {Settings} from './../../services/settings-factory';
import {User} from "../../services/user-service";

@Component({
    selector: 'user-point',
    template: `
    <popover [open]="open" [element]="element"
        [shiftY]="type == 'add' || type == 'update' ? -12 : 0"
        [title]="type == 'add' ? 'Create donation' : (type == 'edit' || type == 'update' ? 'Update donation' : 'Donation offering')">

        <form class="no-margin" style="margin-bottom: 0;" [hidden]="type != 'add' && type != 'edit' && type != 'update'" (submit)="onSubmit($event)">
            <label for="input-blood-group">Contact information</label>
            <div class="row">
                <div class="col-xs-6">
                    <div class="form-group form-group-sm">
                        <input type="text" [value]="userForm.firstName" (keyup)="userForm.firstName = $event.target.value" class="form-control" id="input-first-name" placeholder="First name" required>
                    </div>
                </div>
                <div class="col-xs-6">
                  <div class="form-group form-group-sm">
                    <input type="text" [value]="userForm.lastName" (keyup)="userForm.lastName = $event.target.value" class="form-control" id="input-last-name" placeholder="Last name" required>
                  </div>
                </div>
            </div>
            <div class="row">
                <div class="col-xs-6">
                  <div class="form-group form-group-sm">
                    <input type="text" [value]="userForm.phoneNumber" [pattern]="phonePattern"  title="+xx xxx xxxx xxx or 00xx xxx xxxx xxx" (keyup)="userForm.phoneNumber = $event.target.value" class="form-control" id="input-number" placeholder="Contact number" required>
                  </div>
                </div>
                <div class="col-xs-6">
                  <div class="form-group form-group-sm">
                    <input type="email" [value]="userForm.email" (keyup)="userForm.email = $event.target.value" class="form-control" id="input-email" placeholder="E-mail address" required>
                  </div>
                </div>
            </div>
            <div class="form-group form-group-sm">
                <input type="text" [value]="userForm.address" (keyup)="userForm.address = $event.target.value" class="form-control" id="input-address" placeholder="Address" required>
            </div>

          <div class="form-group form-group-sm">
            <label for="input-blood-group">Blood group</label>
            <select class="form-control" id="input-blood-group" #selectBloodGroup (change)="onBloodGroupChange(selectBloodGroup.value)">
                <option [value]="'O−'" [selected]="userForm.bloodGroup == 'O−'">O−</option>
                <option [value]="'O+'" [selected]="userForm.bloodGroup == 'O+'">O+</option>
                <option [value]="'A−'" [selected]="userForm.bloodGroup == 'A−'">A−</option>
                <option [value]="'A+'" [selected]="userForm.bloodGroup == 'A+'">A+</option>
                <option [value]="'B−'" [selected]="userForm.bloodGroup == 'B−'">B−</option>
                <option [value]="'B+'" [selected]="userForm.bloodGroup == 'B+'">B+</option>
                <option [value]="'AB−'" [selected]="userForm.bloodGroup == 'AB−'">AB−</option>
                <option [value]="'AB+'" [selected]="userForm.bloodGroup == 'AB+'">AB+</option>
            </select>
          </div>

          <hr class="no-margin" style="margin-top: 5px; margin-bottom: 10px;" />

          <div [hidden]="type != 'add'">
              <div [hidden]="processing">
                <button type="submit" class="btn btn-primary">Create</button>
                <button class="btn btn-danger" (click)="closePopover($event)">Cancel</button>
              </div>
              <div [hidden]="!processing">
                <a class="btn btn-link disabled" href="#">Processing...</a>
              </div>
          </div>
          <div [hidden]="type != 'edit' && type != 'update'">
            <div [hidden]="processing">
                <button type="submit" class="btn btn-success">Save</button>
                <span [hidden]="type == 'update'">
                    <button type="submit" class="btn btn-danger" (click)="removePoint($event)">Delete</button>
                </span>
                <button type="submit" class="btn btn-default" (click)="closePopover($event)">Close</button>
            </div>
            <div [hidden]="!processing">
                <a class="btn btn-link disabled" href="#">Processing...</a>
            </div>
          </div>
        </form>

        <div [hidden]="type != 'show'">

            <dl style="margin-top: 5px; margin-bottom: 16px;">
              <dt>Address</dt>
              <dd>{{userForm.address}}</dd>
            </dl>

            <dl style="margin-bottom: 16px;">
              <dt>Blood group</dt>
              <dd>{{userForm.bloodGroup}}</dd>
            </dl>
            <dl style="margin-bottom: 16px;">
              <dt>Name</dt>
              <dd>{{userForm.firstName + ' ' + userForm.lastName}}</dd>
            </dl>

            <dl style="margin-bottom: 18px;">
              <dt>Contacts</dt>
              <dd [class.text-muted]="!(userForm.email && userForm.phoneNumber)">{{userForm.email && userForm.phoneNumber ? userForm.email + ' / ' + userForm.phoneNumber : 'Hidden due to security reason'}}</dd>
            </dl>

            <hr class="no-margin" style="margin-top: 5px; margin-bottom: 10px;" />

            <div [hidden]="processing">
                <span [hidden]="userForm.email && userForm.phoneNumber">
                    <button class="btn btn-primary" (click)="showContacts($event)">Show contacts</button>
                </span>
                <button class="btn btn-default" (click)="closePopover($event)">Close</button>
              </div>
        </div>

    </popover>
    `,
    directives: [Popover, NgForm],
})

// 300x284

export class UserPoint implements OnChanges  {
    @Input() type:string = '';
    @Input() open:boolean = false;
    @Input() processing:boolean = false;
    @Input() element:any = null;
    @Input() point:any = null;
    @Input() user:{} = null;

    @Output() create: EventEmitter<any> = new EventEmitter();
    @Output() update: EventEmitter<any> = new EventEmitter();
    @Output() remove: EventEmitter<any> = new EventEmitter();
    @Output() close: EventEmitter<any> = new EventEmitter();
    @Output() show: EventEmitter<any> = new EventEmitter();

    bloodGroups:string[] = Settings.bloodGroups;

    phonePattern = '(\\+|00)\\d{2} \\d{3} \\d{4} \\d{3}';

    userForm = {
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        address: '',
        bloodGroup: Settings.bloodGroups[0]
    };

    onBloodGroupChange(newBloodGroup) {
        this.userForm.bloodGroup = newBloodGroup;
    }

    ngOnInit() {

    }
    ngOnDestroy() {

    }

    ngOnChanges(changes) {
        if (changes.user) {
            Object.assign(this.userForm, changes.user.currentValue);
        }
        return null;
    }

    showContacts(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        this.show.emit({point: this.point, user: this.user});
    }

    removePoint(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        this.remove.emit({point: this.point});
    }

    closePopover(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        this.userForm = {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: '',
            address: '',
            bloodGroup: Settings.bloodGroups[0]
        };

        this.close.emit(null);
    }
    onSubmit(evt) {
        evt.preventDefault();

        console.log('Submit', this.userForm, this.point);
        if (this.type == 'add') {
            this.create.emit({user: this.userForm, point: this.point});
        } else if (this.type == 'edit' || this.type == 'update') {
            this.update.emit({user: this.userForm, point: this.point});
        }
    }
}