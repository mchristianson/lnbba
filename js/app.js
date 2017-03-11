
(function () {
    'use strict';

    var module = angular.module('LnbbaApp', [
        'ui.bootstrap',
        'ngAnimate',
        'googleApi'
    ]);

    module.config(function(googleLoginProvider, $parseProvider, $httpProvider) {
        googleLoginProvider.configure({
            clientId: '23987865225-s9noe4m7h79h7tegeak4qpvtb0b9r12h.apps.googleusercontent.com',
            scopes: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/calendar"]
        });
        //$parseProvider.unwrapPromises(true);

        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    });

    module.controller('LnbbaCtrl', function ($scope, $log, $q, $timeout, $window, $filter, $location, $http, googleLogin, googleCalendar, googlePlus) {

        $scope.quickAddText = "Monday, 3/14 LNHS South Gym      6:30 to 8:00pm";

        var origLocations = function () {
            return [
                {
                    name: 'LNHS South Gym',
                    address: 'Lakeville North High School, Ipava Avenue, Lakeville, MN, United States',
                    abbr: 'LNHS South'
                },

                {
                    name: 'LNHS North Gym',
                    address: 'Lakeville North High School, Ipava Avenue, Lakeville, MN, United States',
                    abbr: 'LNHS North'
                },
                {
                    name: 'Kenwood',
                    address: 'Kenwood Trail Middle School, Kenwood Trail, Lakeville, MN, United States',
                    abbr: 'KTMS'
                },
                {
                    name: 'Oak Hills',
                    address: 'Oak Hills Elementary School, 165th Street West, Lakeville, MN, United States',
                    abbr: 'OHE'
                },
                {
                    name: 'Century',
                    address: 'Century Middle School, Ipava Avenue, Lakeville, MN, United States',
                    abbr: 'CMS'
                },
                {
                    name: 'Century Aux',
                    address: 'Century Middle School, Ipava Avenue, Lakeville, MN, United States',
                    abbr: 'CMS Aux'
                },
                {
                    name: 'Crystal Lake',
                    address: 'Crystal Lake Education Center, Ipava Avenue, Lakeville, MN, United States',
                    abbr: 'CLEC'
                },
                {
                    name: 'Eastview',
                    address: 'Eastview Elementary School, Ipava Avenue, Lakeville, MN, United States',
                    abbr: 'EVE'
                },
                {
                    name: 'Cherryview',
                    address: 'Cherry View Elementary School, 175th Street West, Lakeville, MN, United States',
                    abbr: 'CVE'
                },
                {
                    name: 'Lakeview',
                    address: 'Lakeview Elementary School, Jacquard Avenue, Lakeville, MN, United States',
                    abbr: 'LVE'
                },
                {
                    name: 'Orchard Lake',
                    address: 'Orchard Lake Elementary School, Klamath Trail, Lakeville, MN, United States',
                    abbr: 'OLE'
                },
                {
                    name: 'JFK',
                    address: 'JFK Elementary, Holyoke Avenue, Lakeville, MN, United States',
                    abbr: 'JFK'
                },
                {
                    name: 'Christina Huddleston',
                    address: 'Christina Huddleston Elementary School, 175th Street West, Lakeville, MN, United States',
                    abbr: 'CHE'
                },
                {
                    name: 'WOTN',
                    address: 'Wear Out The Net, 9913 214th St W E, Lakeville, MN, United States',
                    abbr: 'WOTN'
                },
                {
                    name: 'Lake Marion',
                    address: 'Lake Marion Elementary School, Dodd Boulevard, Lakeville, MN, United States',
                    abbr: 'LME'
                }];
        };

        var locations = $scope.locations = origLocations();

        $scope.getExportTitle = function (event) {
            var loc = _.find(locations, function (location) {
                return event.summary.indexOf(location.name) > -1;
            });
            return event.description + ' Practice' + ' @ ' + loc.abbr;
        };
        $scope.logText = "";
        var appendToLog = function (string) {
            $scope.logText = string + '\n' + $scope.logText;
        };

        $scope.textOutput = "";
        var appendToTextOutput = function (string) {
            $scope.textOutput = string + '\n' + $scope.textOutput;
        };

        $scope.login = function () {
            googleLogin.login().then(function(result) { }, function() { console.error("failed login")});
        };

        $scope.$on("google:authenticated", function(auth) {
            console.log("auth : %o", auth);
            $scope.loggedIntoGoogle = true;
        });

        $scope.$on("googlePlus:loaded", function(auth) {
            console.log("google plus : %o", auth);
            googlePlus.getCurrentUser().then(function (currentUser) {
                $scope.currentUser = currentUser;
            });
        });

        $scope.$on("googleCalendar:loaded", function() {
            appendToLog("Ready...");
            $scope.loadCalendars();
        });

        $scope.loadCalendars = function() {
            this.calendars = googleCalendar.listCalendars().then(function (cals) {
                _.each(cals, function (cal) {
                    appendToLog(cal.summary + ' ' + cal.id);
                });
                console.log("cals : %o", cals);
            });
        };

        $scope.updateEventNames = function () {
            googleCalendar.listCalendars().then(function(cals) {
                _.each(cals, function (cal) {
                    if (cal.summary.indexOf('lakevillebbschedule') == -1) {
                        googleCalendar.listEvents({
                            'calendarId': cal.id,
                            'timeMin': (new Date()).toISOString(),
                            'showDeleted': false,
                            'singleEvents': true,
                            'orderBy': 'startTime'

                        }).then(function (events) {
                            appendToLog('Checking... ' + cal.summary);
                            _.each(events, function (event) {
                                event.location = _.find(locations, function (loc) {
                                    return event.summary.indexOf(loc.name) > -1;
                                }).address;

                                if (event.summary.indexOf(cal.summary) == -1) {
                                    event.summary = cal.summary + ' ' + event.summary;
                                }
                                event.description = cal.summary.split(' ')[0];
                                googleCalendar.updateEvent({
                                    'calendarId': cal.id,
                                    'eventId': event.id,
                                    'resource': event
                                }).then(function () {
                                    appendToLog('     ' + event.summary + ' ' + event.description);
                                    appendToLog('     ' + event.location);
                                });

                            });
                        });
                    }
                });
            });
        };

        $scope.quickAdd = function () {
            _.each($scope.quickAddText.split('\n'), quickAdd);
            $timeout(function () {
                $scope.updateEventNames();
            }, 1000);
        };

        var quickAdd = function (str) {
            var calendar = str.split('|')[1].trim(),
                quickAddText= str.split('|')[0].trim();
            var cal = _.find($scope.allCalendars, {summary: calendar});
            console.log("cal : %o", cal);
            googleCalendar.createEvent({
                calendarId: cal.googleCalendarId,
                text: quickAddText
            }).then(function(event) {
                console.log("event : %o", event);
                appendToLog('Event created: ');
                var when = event.start.dateTime;
                if (!when) {
                    when = event.start.date;
                }
                appendToLog('   ' + event.summary + ' (' + when + ')');
            }, function(error) {
                $scope.eventCreationError = error;
            });

        };
        $scope.checkEmAll = function (event) {
            $('input:checkbox').attr('checked', event.currentTarget.checked);
        };

        $scope.exportOpenTimes = function () {
            $scope.displayEvents = [];
            $scope.changePage('openTimes');

            googleCalendar.listEvents({
                'calendarId': 'lakevillebbschedule@gmail.com',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'

            }).then(function (events) {
                _.each(events, function (event) {
                    console.log("event : %o", event);
                    $scope.displayEvents.push(event);
                });
            });
        };
        $scope.exportToSportNgin = function () {
            $scope.displayEvents = [];
            $scope.changePage('sportNgin');

            googleCalendar.listCalendars().then(function(cals) {
                _.each(cals, function (cal) {
                    if (cal.summary.indexOf('lakevillebbschedule') == -1) {

                        googleCalendar.listEvents({
                            'calendarId': cal.id,
                            'timeMin': (new Date()).toISOString(),
                            'showDeleted': false,
                            'singleEvents': true,
                            'orderBy': 'startTime'

                        }).then(function (events) {
                            console.log("cal.summary : %o", cal.summary);
                            console.log("events : %o", events);

                            _.each(events, function (event) {
                                $scope.displayEvents.push(event);
                            });

                        });
                    }
                });
            });

        };

        $scope.getLocation = function (calName, summary) {
            var location = event.summary.split(calName)[1];
            if (!location) location = event.summary;
            return location;
        };

        $scope.getSummary = function (event, location) {
            var summary = event.summary.split(location)[0];
            return !!summary ? summary : 'Open: ';
        };

        var addEvents = function (calName, events) {
            _.each(events, function (event) {
                var eventDate = moment(event.start.dateTime).format('MMDDYYYY');
                console.log("event : %o", event);
                console.log("event : %o", event.summary);
                console.log("calName : %o", calName);
                var location = event.summary.split(calName)[1];
                console.log("location : %o", location);
                if (!location) location = event.summary;
                console.log("location 2: %o", location);
                if (!!location) {
                    var locObj = _.find(locations, function (loc) {
                        return loc.name === location.trim();
                    });
                    if (!!locObj) {
                        if (!!locObj[eventDate]) {
                            locObj[eventDate].push(event);
                        } else {
                            locObj[eventDate] = [event];
                        }
                    }
                }
            });
        };

        var daysOfWeek = [];
        for (var i = 1; i < 8; i++) {
            daysOfWeek.push({
                key: moment().day(i).format('MMDDYYYY'),
                value: moment().day(i).format('dddd, MMM D')
            });
        }
        $scope.daysOfWeek = daysOfWeek;

        $scope.week = 7;
        $scope.previousWeek = function (success) {
            $scope.week = $scope.week - 7;
            success();
        };
        $scope.nextWeek = function (success) {
            $scope.week = $scope.week + 7;
            success();
        };
        var getEvents = function (cal) {

            console.log("cal : %o", cal.summary);
            googleCalendar.listEvents({
                'calendarId': cal.id,
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'

            }).then(function (events) {
                addEvents(cal.summary, events);
            });
        };

        var hasExported = false;
        $scope.exportFullSchedule = function () {
            $scope.changePage('fullSchedule');
            console.log("exporting full schedule : %o");
            //if (!hasExported) {
            locations = $scope.locations = origLocations();
            googleCalendar.listCalendars().then(function(cals) {
                _.each(cals, _.partial(getEvents));
            });
            //}
            hasExported = true;
        };

        var sunday = moment().day($scope.week).format('YYYYMMDD'),
            saturday = moment().day($scope.week + 6).format('YYYYMMDD'),
            datesParam = '&dates=' + sunday + '%2F' + saturday;

        $scope.nextWeekSchedule = 'https://calendar.google.com/calendar/embed?title=Lakeville%20North%20Basketball%20Schedule&mode=WEEK&height=600&wkst=1&bgcolor=  #FFFFFF&src=lakevillebbschedule%40gmail.com&color=  #ffffff&src=175th89oaa2jv895lhvr901l5c%40group.calendar.google.com&color=  #2F6309&src=7sg33utncqffm35mprq106p50k%40group.calendar.google.com&color=  #6B3304&src=g6lccaup2fqmnne5velmn1h06c%40group.calendar.google.com&color=  #AB8B00&src=8m1rb8je401jtajnp48inalqak%40group.calendar.google.com&color=  #28754E&src=0n31vkpkpo5arg2hb43use6nps%40group.calendar.google.com&color=  #5F6B02&src=6u1bif4vfi2531o53vrq5hte20%40group.calendar.google.com&color=  #28754E&src=uapge6e7ktifet5o6n5cd6lj58%40group.calendar.google.com&color=  #8D6F47&src=6839kiho0o4v334p42tmkevar4%40group.calendar.google.com&color=  #125A12&src=usoanmeifcgf210p481l9td4g4%40group.calendar.google.com&color=  #875509&src=v75qgghiakpuo1l31valcnuk04%40group.calendar.google.com&color=  #23164E&src=7fj0hi35sdrgceo84gu22g3qlc%40group.calendar.google.com&color=  #5229A3&src=j74lst0uve4ma8m0rt3ip20ee8%40group.calendar.google.com&color=  #AB8B00&ctz=America%2FChicago' + datesParam;

        $scope.exportData = function (tableId) {
            var blob = new Blob([document.getElementById(tableId).innerHTML], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
            });
            saveAs(blob, "lakeville_schedule_export.xls");
        };
        $scope.displayPage = {
            'quickAdd': true,
            'sportNgin': false,
            'openTimes': false,
            'fullSchedule': false
        };

        $scope.changePage = function (pageName) {
            _.each(Object.keys($scope.displayPage), function (key) {
                $scope.displayPage[key] = false;
            });
            $scope.displayPage[pageName] = true;
        };

        var calendar = $('#calendar');

        var selectedTeam = $scope.selectedTeam = $location.search().team;
        var selectedGym = $location.search().gym;
        if (!!selectedGym) {
            selectedGym = _.find($scope.locations, {name: selectedGym});
        }

        $scope.allCalendars = [
            {  abbr: '4A', summary: '4A Kolander', googleCalendarId: '7sg33utncqffm35mprq106p50k@group.calendar.google.com', color: '#6B3304', visible: !selectedTeam},
            {  abbr: '4B', summary: '4B Knight', googleCalendarId: '175th89oaa2jv895lhvr901l5c@group.calendar.google.com', color: '#2F6309', visible: !selectedTeam},
            {  abbr: '4C', summary: '4C Smith-Larkin', googleCalendarId: 'pdal4d6bhle6fg8cs17pdegi6k@group.calendar.google.com', color: '#5A6986', visible: !selectedTeam},
            {  abbr: '5A', summary: '5A Robison', googleCalendarId: '8m1rb8je401jtajnp48inalqak@group.calendar.google.com', color: '#28754E', visible: !selectedTeam},
            {  abbr: '5B', summary: '5B Olson', googleCalendarId: '0n31vkpkpo5arg2hb43use6nps@group.calendar.google.com', color: '#5F6B02', visible: !selectedTeam},
            {  abbr: '5C', summary: '5C Trish', googleCalendarId: 'g6lccaup2fqmnne5velmn1h06c@group.calendar.google.com', color: '#AB8B00', visible: !selectedTeam},
            {  abbr: '6A', summary: '6A Nolan', googleCalendarId: '6u1bif4vfi2531o53vrq5hte20@group.calendar.google.com', color: '#28754E', visible: !selectedTeam},
            {  abbr: '6BR', summary: '6BR Laufenberger', googleCalendarId: '0c080o6vq617ft17qihrnjr45k@group.calendar.google.com', color: '#28754E', visible: !selectedTeam},
            {  abbr: '6BW', summary: '6BW Ritz', googleCalendarId: 'f3run7pjddhgcpd352j4m4v9i0@group.calendar.google.com', color: '#28754E', visible: !selectedTeam},
            {  abbr: '6C', summary: '6C Angell', googleCalendarId: 'uapge6e7ktifet5o6n5cd6lj58@group.calendar.google.com', color: '#8D6F47', visible: !selectedTeam},
            {  abbr: '7A', summary: '7A Winter', googleCalendarId: '6839kiho0o4v334p42tmkevar4@group.calendar.google.com', color: '#125A12', visible: !selectedTeam},
            {  abbr: '7B', summary: '7B Falter', googleCalendarId: 'usoanmeifcgf210p481l9td4g4@group.calendar.google.com', color: '#875509', visible: !selectedTeam},
            {  abbr: '7C', summary: '7C Hunhoff', googleCalendarId: 'v75qgghiakpuo1l31valcnuk04@group.calendar.google.com', color: '#23164E', visible: !selectedTeam},
            {  abbr: '8A', summary: '8A Blasziek', googleCalendarId: '7fj0hi35sdrgceo84gu22g3qlc@group.calendar.google.com', color: '#dd8899', visible: !selectedTeam},
            {  abbr: '8B', summary: '8B Winship', googleCalendarId: 'j74lst0uve4ma8m0rt3ip20ee8@group.calendar.google.com', color: '#5229A3', visible: !selectedTeam},
            {  abbr: '8C', summary: '8C Schetnan', googleCalendarId: 'vf4fpo5ti39u2ulehcde8505ks@group.calendar.google.com', color: '#5229A3', visible: !selectedTeam},

            {  abbr: '', summary: 'Open', googleCalendarId: 'lakevillebbschedule@gmail.com', color: '#eeeeee', visible: !selectedTeam},

            {  abbr: '4red', summary: 'Girls - 4R', googleCalendarId: 'hkt2l85spp1mqu065n03cuol2s@group.calendar.google.com', color: '#f691b2', visible: !selectedTeam},
            {  abbr: '4black', summary: 'Girls - 4B', googleCalendarId: 'qubn2mgect3dh51h5i0u3iapgs@group.calendar.google.com', color: '#f691b2', visible: !selectedTeam},
            {  abbr: '5a16', summary: 'Girls - 5A', googleCalendarId: 'rlj3ce7fchvmc61aot14lh7aa4@group.calendar.google.com', color: '#f691b2', visible: !selectedTeam},
            {  abbr: '5b16', summary: 'Girls - 5B', googleCalendarId: '6ecodd1g5ecckcrv4t7b743bak@group.calendar.google.com', color: '#ac725e', visible: !selectedTeam},
            {  abbr: '5c16', summary: 'Girls - 5C', googleCalendarId: '3c4iega731hmopmf53vifaphrs@group.calendar.google.com', color: '#cabdbf', visible: !selectedTeam},
            {  abbr: '6a16', summary: 'Girls - 6A', googleCalendarId: 'ldu2chdjrmj5jmkmhrlvlfomk8@group.calendar.google.com', color: '#cabdbf', visible: !selectedTeam},
            {  abbr: '6b16', summary: 'Girls - 6B', googleCalendarId: 'sse6kis823j766n367buqaclsg@group.calendar.google.com', color: '#cabdbf', visible: !selectedTeam},
            {  abbr: '7a16', summary: 'Girls - 7A Galles', googleCalendarId: 'lmp1l5qma837cf79v0vk0sgfak@group.calendar.google.com', color: '#fa573c', visible: !selectedTeam},
            {  abbr: '8a16', summary: 'Girls - 8A', googleCalendarId: 'bud272ubu8dupc1o0le7m2up6s@group.calendar.google.com', color: '#ff7537', visible: !selectedTeam},
            {  abbr: '8b16', summary: 'Girls - 8B', googleCalendarId: 'lmp1l5qma837cf79v0vk0sgfak@group.calendar.google.com', color: '#fa573c', visible: !selectedTeam}
        ];
        var visibleCalendars = _.pick( $scope.allCalendars, 'googleCalendarId');

        $scope.toggleCalendar = function (cal) {
            cal.visible = !cal.visible;
            if (!!cal.visible) {
                calendar.fullCalendar('addEventSource',  cal);
            } else {
                calendar.fullCalendar('removeEventSource',  cal);
            }

        };

        $scope.initCalendarView = function () {
            var events = [];
            $http.get('http://lnbba.smd-test.com/calendar_data.php').success(function (data) {
                _.each(data, function (row) {
                    var calendar = _.find($scope.allCalendars, function (cal) {
                        return cal.abbr === row[4];
                    });
                    //if (!!calendar && (!selectedTeam || selectedTeam === calendar.summary)) {
                    if (!!calendar) {
                        events.push({
                            start: moment(row[0]),
                            end: moment(row[1]),
                            title: row[2],
                            backgroundColor: calendar.color,
                            calendar: calendar
                        });
                    }
                });
                console.log(events);
                calendar.fullCalendar({
                    googleCalendarApiKey: 'AIzaSyB3ry0B-bKSXl45V29ac1bferwySUC8d80',
                    header: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'month,agendaWeek,agendaDay'
                    },
                    defaultView: 'agendaWeek',
                    buttonText: {
                        today: 'today',
                        month: 'month',
                        week: 'week',
                        day: 'day'
                    },
                    minTime: '08:00:00',
                    maxTime: '24:00:00',
                    scrollTime: '16:00:00',
                    slotDuration: '00:15:00',
//                eventSources: getEventSources($scope.allCalendars),
                    events: events,
                    eventRender: function(event, element) {
                        var returnValue = true;
                        if (!!selectedGym) {
                            if (event.title.indexOf(selectedGym.name) === -1) {
                                returnValue = false;
                            }
                        }
                        if (!!selectedTeam && selectedTeam !== event.calendar.summary) {
                            returnValue = false;
                        }
                        return returnValue;
                    }
                });
            });
        };

        var getEventSourcesFromCsv = function () {
            console.log(events);
            return events;
        };

        var getEventSources = function () {
            if (!!selectedTeam) {
                var cal = _.find($scope.allCalendars, {summary: selectedTeam});
                cal.visible = true;
                return cal;
            } else {
                return $scope.allCalendars;
            }

        };
        $scope.showOnly = function (cal) {
            window.location.href = '/#/?team=' + cal.summary;
            window.location.reload();
            //
            //_.each($scope.allCalendars, function (theCal) {
            //    theCal.visible = false;
            //    calendar.fullCalendar('removeEventSource',  theCal);
            //});
            //cal.visible = true;
            //calendar.fullCalendar('addEventSource',  cal);
        };

        $scope.showGym = function (gym) {
            console.log("gym : %o", gym);
            window.location.href = '/#/?gym=' + gym.name;
            window.location.reload();
        };

        $scope.isCalActive = function (calId) {
            return (visibleCalendars.indexOf(calId) > -1);
        };

        $scope.showIcal = function (cal) {
            var calAddress = 'https://calendar.google.com/calendar/ical/'+cal.googleCalendarId.replace('@', '%40')+'/public/basic.ics';
            window.prompt("Please use the following address to access your calendar from other applications. You can copy and paste this into any calendar product that supports the iCal format.",
                calAddress, "OK");
        };

        $scope.sortType     = 'start.dateTime'; // set the default sort type
        // $scope.sortType     = 'description'; // set the default sort type
        $scope.sortReverse  = false;  // set the default sort order

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        $scope.format = 'MM/dd/yyyy';
        $scope.fromDate = new Date();
        var nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 6);
        $scope.toDate = nextWeek;
        $scope.fromDatePopup = {
            opened: false
        };

        $scope.toDatePopup = {
            opened: false
        };
        $scope.openFromDate = function () {
            $scope.fromDatePopup.opened = true;
        };
        $scope.openToDate = function () {
            $scope.toDatePopup.opened = true;
        };
    });

})();
