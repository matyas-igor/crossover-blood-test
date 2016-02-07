declare var SETTINGS:any;

export const Settings = {
    apiUrl: SETTINGS["server-api"].apiUrl + '/',
    bloodGroups: ['O−',	'O+',	'A−',	'A+',	'B−',	'B+',	'AB−',	'AB+']
};