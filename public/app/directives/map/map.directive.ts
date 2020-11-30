import {Component, Input} from 'angular2/core';
import {User} from './../../services/user-service';
import {UserPoint} from './../../directives/users/user-point.directive';
import {Notifications} from "../../services/notifications-factory";
import {Socket} from "../../services/socket-factory";

declare var require:any;

@Component({
    selector: 'map-blood',
    template: `
    <div id="map" class="full-height">
        <div id="locate-button"></div>
    </div>
    <div id="search" class="block-search"></div>

    <!--Preloading pointer image-->
    <img src="http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png" style="position: fixed; left: -1000px; top: -1000px; display:none;"/>
    <img src="http://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png" style="position: fixed; left: -1000px; top: -1000px; display:none;"/>
    <img src="http://static.arcgis.com/images/Symbols/Shapes/GreenPin1LargeB.png" style="position: fixed; left: -1000px; top: -1000px; display:none;"/>

    <user-point
        [open]="showUserPoint"
        [processing]="processingUserPoint"
        [element]="elementUserPoint"
        [type]="typeUserPoint"
        [point]="pointUserPoint"
        [user]="userUserPoint"
        (close)="onCloseUserPoint($event)"
        (create)="onCreateUserPoint($event)"
        (update)="onUpdateUserPoint($event)"
        (remove)="onRemoveUserPoint($event)"
        (show)="onShowUserPoint($event)">
    </user-point>
    `,
    directives: [UserPoint]
})

export class MapBlood {

    @Input() donationId:string = '';

    private user:{} = null;
    private map:any = null;

    private userType:string = null;

    _socket:Function = null;
    _subscribe:Function = null;
    _mapUnloadEvent:Function = null;

    _addPointOnMap:Function = null;
    _removePointFromMap:Function = null;
    _getLongLatExtent:Function = null;

    _donorPointAdd:any = null;
    _donorPointCurrent:any = null;

    _patientPoints:any[] = [];
    _patientPointsUserIds:any[] = [];

    typeUserPoint:string = 'add';
    showUserPoint:boolean = false;
    processingUserPoint:boolean = false;
    elementUserPoint:any = null;
    pointUserPoint:any = null;
    userUserPoint:any = null;

    onCloseUserPoint = (e) => { console.log('close'); };
    onUpdateUserPoint = (e) => { console.log('update'); };
    onCreateUserPoint = (e) => { console.log('create'); };
    onRemoveUserPoint = (e) => { console.log('remove'); };
    onShowUserPoint = (e) => { console.log('create'); };

    ngOnInit() {
        // checking if user register
        User.check()
            .then(user => {

                this.user = user;
                this.userType = user['type'];
                this._redrawUserPoint();

                // on user change / set callback for change type
                this._subscribe = User.subscribe(user => {
                    var oldUserType = this.userType,
                        needChangeTypeCall = this.userType != user.type;
                    this.user = user;
                    this.userType = user.type;
                    if (needChangeTypeCall) {
                        this._onChangeUserType(user.type, oldUserType);
                    }
                    this._redrawUserPoint();
                });
            });

        this._socket = Socket.subscribe(data => {
            if (this.userType == 'patient') {
                if (data.type == 'remove') {
                    console.log('REMOVE POINT FROM SOCKET');
                    this._removePatientPoints(data.userId);
                }
                if (data.type == 'add') {
                    console.log('ADD POINT FROM SOCKET');
                    if (this._checkIfPointInMap(data.user.x, data.user.y)) {
                        this._addPatientPoint(data.user);
                    }
                }
            }
        });
    }

    ngAfterContentInit() {

        // map code
        var map, openStreetMapLayer;

        var MapBloodComponent = this;

        require([
            "esri/map",
            "esri/dijit/Search",
            "esri/geometry/Point",
            "esri/Color",
            "esri/geometry/webMercatorUtils",
            "esri/dijit/PopupMobile",
            "esri/dijit/LocateButton",
            "esri/layers/OpenStreetMapLayer",
            "esri/dijit/Scalebar",
            "dojo/dom-construct",

            "esri/symbols/SimpleMarkerSymbol",
            "esri/symbols/PictureMarkerSymbol",
            "esri/graphic", "esri/layers/GraphicsLayer",

            "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"
        ], (Map, Search, Point, Color,
                     webMercatorUtils, PopupMobile, LocateButton, OpenStreetMapLayer, Scalebar,
                     domConstruct,
                     SimpleMarkerSymbol, PictureMarkerSymbol,
                     Graphic, GraphicsLayer) => {

            // Creating the map
            map = new Map("map", {
                basemap: "streets",  //For full list of pre-defined basemaps, navigate to http://arcg.is/1JVo6Wd
                center: [-122.45, 37.75], // longitude, latitude
                zoom: 7
                //infoWindow: popup
            });

            // disable popups
            map.infoWindow.set("popupWindow", false);

            // Mobile popops (decided not to use)
            //var popup = new PopupMobile(null, domConstruct.create("div", null, null, map.root));
            //map.setInfoWindow(popup);

            // Search box add
            var search = new Search({
                map: map
            }, "search");
            search.startup();

            // Geo locate button add
            var geoLocate = new LocateButton({
                map: map
            }, "locate-button");
            geoLocate.startup();

            // Scalebar
            var scalebar = new Scalebar({
                map: map,
                // "dual" displays both miles and kilmometers
                // "english" is the default, which displays miles
                // use "metric" for kilometers
                scalebarUnit: "dual"
            });

            // Open street map (decided not to use)
            //openStreetMapLayer = new OpenStreetMapLayer();
            //map.addLayer(openStreetMapLayer);

            this.map = map;

            var gl = new GraphicsLayer({id: "points"});
            map.addLayer(gl);


            // set points function to class scope
            this._addPointOnMap = (evt, user, type, color = 'Blue') => {
                var symbol = new PictureMarkerSymbol("http://static.arcgis.com/images/Symbols/Shapes/"+color+"Pin1LargeB.png", 32, 32).setOffset(0, 12);
                var graphic;

                if (evt && evt.mapPoint) {
                    graphic = new Graphic(evt.mapPoint, symbol);
                } else {
                    var coords = webMercatorUtils.xyToLngLat(user.x, user.y);
                    graphic = new Graphic(new Point(coords[0], coords[1]), symbol);
                }

                if (user) {
                    graphic.data_user = user;
                }
                if (type) {
                    graphic.data_type = type;
                }

                gl.add(graphic);
                return graphic;
            };
            this._removePointFromMap = (graphic) => {
                gl.remove(graphic);
            };
            this._getLongLatExtent = (xmin, xmax, ymin, ymax) => {
                var coordmin = webMercatorUtils.lngLatToXY(xmin, ymin),
                    coordmax = webMercatorUtils.lngLatToXY(xmax, ymax);

                return [parseFloat(coordmin[0]), parseFloat(coordmax[0]), parseFloat(coordmin[1]), parseFloat(coordmax[1])];
            };

            // After updating map reload all points
            var onMapUpdatedHandler = (evt) => {
                    var extent = evt.extent,
                        zoomed = evt.levelChange;

                    this.showUserPoint = false;

                    this._onUpdateMap(evt);
                },
                onMapLoadedHandler = (evt) => {
                    console.log("Map loaded ->", evt);
                    //console.log(map.geographicExtent);
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(zoomToLocation, onLocationError);
                    }
                },
                onMapLClickHandler = (evt) => {
                    this.showUserPoint = false;
                    var point = null;
                    if (evt.graphic && evt.graphic) {
                        // if clicked on existed point
                        point = evt.graphic;
                    }
                    //this._addPointOnMap(evt, point);

                    this._onClick(evt, point);
                };

            var mapLoad = map.on("load", onMapLoadedHandler);
            var mapExtentChange = map.on("extent-change", onMapUpdatedHandler);
            var mapClick = map.on("click", onMapLClickHandler);

            this._mapUnloadEvent = () => {
                mapLoad.remove();
                mapExtentChange.remove();
                mapClick.remove();
            };

            function onLocationError(error) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.error("Location not provided");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.error("Current location not available");
                        break;
                    case error.TIMEOUT:
                        console.error("Timeout");
                        break;
                    default:
                        console.error("Unknown error");
                        break;
                }
            }

            function zoomToLocation(location) {
                var pt = webMercatorUtils.geographicToWebMercator(new Point(location.coords.longitude, location.coords.latitude));
                map.centerAndZoom(pt, 15);
            }

            this._redrawUserPoint();
        });
    }

    ngOnDestroy() {
        // clean subscribe to user update
        this._subscribe ? this._subscribe() : null;
        this._socket ? this._socket() : null;
        this._mapUnloadEvent ? this._mapUnloadEvent() : null;
    }

    _onChangeUserType(newType, oldType) {
        if (newType == 'patient' && oldType == 'donor') {
            // removing old donor point if exists
            this._clearDonorEditPoint();
            this._clearDonorCurrentPoint();
            this._loadPatientPoints();
        } else if (newType == 'donor' && oldType == 'patient') {
            this._clearPatientPoints();
            this._redrawUserPoint();
        }
    }

    _onClick(evt, point) {
        if (this.user) {
            if (this.userType == 'donor') {
                if (this.user['donation']) {
                    // already made a blood donation

                    if (point && point.data_type == 'current' && point.data_user && point.data_user.user_id == this.user['user_id']) {
                        // clicked on his donation - show edit screen
                        this._clearDonorEditPoint();

                        // set user popup options
                        this.elementUserPoint = evt;
                        this.showUserPoint = true;
                        this.typeUserPoint = 'edit';
                        this.userUserPoint = this.user;
                        this.pointUserPoint = this._donorPointCurrent;
                        this.onCloseUserPoint = () => { this._clearDonorEditPoint(); };
                        this.onUpdateUserPoint = (evt) => {
                            console.log('User to update ->', evt.user);
                            this.processingUserPoint = true;
                            User.update(evt.user)
                                .then((user) => {
                                    Notifications.add({text: 'Donation request has been successfully updated', type: 'success'});
                                    this._clearPopup();
                                })
                                .catch((err) => {
                                    Notifications.add({text: err, type: 'danger'});
                                    this._clearPopup();
                                });
                        };
                        this.onRemoveUserPoint = (evt) => {
                            this.processingUserPoint = true;
                            User.update({donation: false})
                                .then((user) => {
                                    Notifications.add({text: 'Donation request has been successfully removed', type: 'success'});
                                    this._clearDonorEditPoint();
                                })
                                .catch((err) => {
                                    Notifications.add({text: err, type: 'danger'});
                                    this._clearDonorEditPoint();
                                });
                        };
                    } else {
                        // removing old donor point if exists
                        this._clearDonorEditPoint();
                        // clicked on map
                        this._donorPointAdd = this._addPointOnMap(evt, this.user, 'edit');

                        // set user popup options
                        this.elementUserPoint = evt;
                        this.showUserPoint = true;
                        this.typeUserPoint = 'update';
                        this.userUserPoint = this.user;
                        this.pointUserPoint = this._donorPointAdd;
                        this.onCloseUserPoint = () => { this._clearDonorEditPoint(); };
                        this.onUpdateUserPoint = (evt) => {
                            console.log('User to create ->', evt.user, evt.point);
                            this.processingUserPoint = true;
                            User.update(evt.user, evt.point)
                                .then((user) => {
                                    Notifications.add({text: 'Donation request has been successfully updated', type: 'success'});
                                    this._clearDonorEditPoint();
                                })
                                .catch((err) => {
                                    Notifications.add({text: err, type: 'danger'});
                                    this._clearDonorEditPoint();
                                });
                        };
                    }
                } else { // no donation
                    // removing old donor point if exists
                    this._clearDonorEditPoint();
                    this._clearPatientPoints();

                    // clicked on map
                    this._donorPointAdd = this._addPointOnMap(evt, this.user, 'edit');

                    // set user popup options
                    this.elementUserPoint = evt;
                    this.showUserPoint = true;
                    this.typeUserPoint = 'add';
                    this.userUserPoint = this.user;
                    this.pointUserPoint = this._donorPointAdd;
                    this.onCloseUserPoint = () => { this._clearDonorEditPoint(); };
                    this.onCreateUserPoint = (evt) => {
                        console.log('User to create ->', evt.user, evt.point);
                        this.processingUserPoint = true;
                        User.update(evt.user, evt.point)
                            .then((user) => {
                                Notifications.add({text: 'Donation request has been successfully created', type: 'success'});
                                this._clearDonorEditPoint();
                            })
                            .catch((err) => {
                                Notifications.add({text: err, type: 'danger'});
                                this._clearDonorEditPoint();
                            });
                    };
                }
            } else if (this.userType == 'patient') {
                if (point && point.data_type == 'patient' && point.data_user && point.data_user.user_id != this.user['user_id']) {
                    // clicked on other donor point

                    // set user popup options
                    this.elementUserPoint = evt;
                    this.showUserPoint = true;
                    this.typeUserPoint = 'show';
                    this.userUserPoint = point.data_user;
                    this.pointUserPoint = point;
                    this.onCloseUserPoint = () => { this._clearPopup(); };
                    this.onShowUserPoint = (evt) => {
                        console.log('User to show ->', evt.user, evt.point);
                        this.processingUserPoint = true;
                        User.getUser(evt.user['user_id'])
                            .then((res) => {
                                if (res && res.user) {
                                    var user = res.user;
                                    point.data_user = user;
                                    this.userUserPoint = user;
                                    this.processingUserPoint = false;
                                }
                            })
                            .catch((err) => {
                                Notifications.add({text: err, type: 'danger'});
                                this._clearDonorEditPoint();
                            });
                    };
                }
            }
        }
    }

    _clearPopup() {
        this.showUserPoint = false;
        this.processingUserPoint = false;
        this.userUserPoint = null;

        this.onCloseUserPoint = (e) => { console.log('close'); };
        this.onUpdateUserPoint = (e) => { console.log('update'); };
        this.onCreateUserPoint = (e) => { console.log('create'); };
        this.onShowUserPoint = (e) => { console.log('create'); };
        this.onRemoveUserPoint = (e) => { console.log('create'); };
    }

    _clearDonorCurrentPoint() {
        if (this._donorPointCurrent) {
            this._removePointFromMap(this._donorPointCurrent);
            this._donorPointCurrent = null;
        }
        this._clearPopup();
    }

    _clearDonorEditPoint() {
        if (this._donorPointAdd) {
            this._removePointFromMap(this._donorPointAdd);
            this._donorPointAdd = null;
        }
        this._clearPopup();
    }

    _addPatientPoint(user) {
        var userIndex = this._patientPointsUserIds.findIndex(userId => userId == user['user_id']);
        if (userIndex >= 0) {
            // already exists
            return;
        }
        var point = this._addPointOnMap(null, user, 'patient', 'Green');
        this._patientPoints.push(point);
        this._patientPointsUserIds.push(user['user_id']);
    }

    _removePatientPoints(id) {
        var userIndex = this._patientPointsUserIds.findIndex(userId => userId == id);
        if (userIndex => 0) {
            this._patientPointsUserIds.splice(userIndex, 1);
        }
        var pointIndex = this._patientPoints.findIndex(point => point['data_user'].user_id == id);
        if (pointIndex >= 0) {
            this._removePointFromMap(this._patientPoints[pointIndex]);
            this._patientPoints.splice(pointIndex, 1);
        }
    }
    _clearPatientPoints() {
        this._patientPoints.forEach(point => {
            this._removePointFromMap(point);
        });
        this._patientPoints = [];
        this._patientPointsUserIds = [];
    }

    _onUpdateMap(evt) {
        if (this.userType == 'donor') {
            this._clearDonorEditPoint();
        } else {
            console.log("Map updated ->", this.map.geographicExtent);
            this._loadPatientPoints();
        }
    }

    _checkIfPointInMap(x, y) {
        var extent = this.map.geographicExtent;
        var coords = this._getLongLatExtent(extent.xmin, extent.xmax, extent.ymin, extent.ymax);

        return parseFloat(coords[0]) <= parseFloat(x) && parseFloat(coords[1]) >= parseFloat(x) &&
            parseFloat(coords[2]) <= parseFloat(y) && parseFloat(coords[3]) >= parseFloat(y);
    }

    _loadPatientPoints() {
        var extent = this.map.geographicExtent;
        var coords = this._getLongLatExtent(extent.xmin, extent.xmax, extent.ymin, extent.ymax);
        User.getPoints(coords[0], coords[1], coords[2], coords[3])
            .then((res) => {
                if (res.users && res.users.length > 0) {
                    res.users.forEach(user => {
                        this._addPatientPoint(user);
                    });
                }
            })
            .catch((err) => {
                Notifications.add({text: err, type: 'danger'});
            });
    }

    _redrawUserPoint() {
        if (this._addPointOnMap) {
            this._clearDonorCurrentPoint();
            if (this.userType == 'donor' && this.user['donation']) {
                this._donorPointCurrent = this._addPointOnMap(null, this.user, 'current', 'Red');
            }
        }
    }
}