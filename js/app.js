
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

    module.controller('LnbbaCtrl', function ($scope, $log, $q, $timeout, $window, $filter, googleLogin, googleCalendar, googlePlus) {

        $scope.quickAddText = "Monday, 3/14 LNHS South Gym      6:30 to 8:00pm";

        var locations = $scope.locations = [
            {
                name: 'LNHS South Gym',
                address: 'Lakeville North High School, Ipava Avenue, Lakeville, MN, United States'
            },

            {
                name: 'LNHS North Gym',
                address: 'Lakeville North High School, Ipava Avenue, Lakeville, MN, United States'
            },
            {
                name: 'Kenwood',
                address: 'Kenwood Trail Middle School, Kenwood Trail, Lakeville, MN, United States'
            },
            {
                name: 'Oak Hills',
                address: 'Oak Hills Elementary School, 165th Street West, Lakeville, MN, United States'
            },
            {
                name: 'Century',
                address: 'Century Middle School, Ipava Avenue, Lakeville, MN, United States'
            },
            {
                name: 'Century Aux',
                address: 'Century Middle School, Ipava Avenue, Lakeville, MN, United States'
            },
            {
                name: 'Crystal Lake',
                address: 'Crystal Lake Education Center, Ipava Avenue, Lakeville, MN, United States'
            },
            {
                name: 'Eastview',
                address: 'Eastview Elementary School, Ipava Avenue, Lakeville, MN, United States'
            },
            {
                name: 'Cherryview',
                address: 'Cherry View Elementary School, 175th Street West, Lakeville, MN, United States'
            },
            {
                name: 'Lakeview',
                address: 'Lakeview Elementary School, Jacquard Avenue, Lakeville, MN, United States'
            },
            {
                name: 'Orchard Lake',
                address: 'Orchard Lake Elementary School, Klamath Trail, Lakeville, MN, United States'
            },
            {
                name: 'JFK',
                address: 'JFK Elementary, Holyoke Avenue, Lakeville, MN, United States'
            }];
        $scope.logText = "";
        var appendToLog = function (string) {
            $scope.logText += '\n' + string;
        };

        $scope.textOutput = "";
        var appendToTextOutput = function (string) {
            $scope.textOutput += '\n' + string;
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
            appendToLog("Ready...")
        });

        $scope.loadCalendars = function() {
            this.calendars = googleCalendar.listCalendars();
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
        };

        var quickAdd = function (str) {
            googleCalendar.createEvent({
                calendarId: 'primary',
                text: str
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
                            _.each(events, function (event) {
                                $scope.displayEvents.push(event);
                            });

                        });
                    }
                });
            });

        };

        var addEvents = function (calName, events) {
            _.each(events, function (event) {
                var eventDate = moment(event.start.dateTime).format('MMDDYYYY');
                //console.log("event : %o", event);
                //console.log("event : %o", event.summary);
                //console.log("calName : %o", calName);
                var location = event.summary.split(calName)[1];
                //console.log("location : %o", location);
                if (!!location) {
                    var locObj = _.find(locations, function (loc) {
                        return loc.name === location.trim();
                    });
                    if (!!locObj[eventDate]) {
                        locObj[eventDate].push(event);
                    } else {
                        locObj[eventDate] = [event];
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

        var getEvents = function (cal) {
            googleCalendar.listEvents({
                'calendarId': cal.id,
                'timeMin': (moment().day(0)).toISOString(),
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
            if (!hasExported) {
                googleCalendar.listCalendars().then(function(cals) {
                    _.each(cals, _.partial(getEvents));
                });
            }
            hasExported = true;
        };

        var sunday = moment().day(7).format('YYYYMMDD'),
            saturday = moment().day(13).format('YYYYMMDD'),
            datesParam = '&dates=' + sunday + '%2F' + saturday;

        $scope.nextWeekSchedule = 'https://calendar.google.com/calendar/embed?title=Lakeville%20Basketball%20Practice%20Schedule&mode=WEEK&height=600&wkst=1&bgcolor=%23FFFFFF&src=lakevillebbschedule%40gmail.com&color=%23ffffff&src=7sg33utncqffm35mprq106p50k%40group.calendar.google.com&color=%236B3304&src=g6lccaup2fqmnne5velmn1h06c%40group.calendar.google.com&color=%23AB8B00&src=8m1rb8je401jtajnp48inalqak%40group.calendar.google.com&color=%2328754E&src=0n31vkpkpo5arg2hb43use6nps%40group.calendar.google.com&color=%235F6B02&src=6u1bif4vfi2531o53vrq5hte20%40group.calendar.google.com&color=%2328754E&src=msd7sbakh6g0pflbm9eo4qskhs%40group.calendar.google.com&color=%236B3304&src=uapge6e7ktifet5o6n5cd6lj58%40group.calendar.google.com&color=%238D6F47&src=6839kiho0o4v334p42tmkevar4%40group.calendar.google.com&color=%23125A12&src=usoanmeifcgf210p481l9td4g4%40group.calendar.google.com&color=%23875509&src=v75qgghiakpuo1l31valcnuk04%40group.calendar.google.com&color=%2323164E&src=rpub6jv4uobso7hgqua4qdlda8%40group.calendar.google.com&color=%2328754E&src=qft4f3s8tninudi4derahdv9fk%40group.calendar.google.com&color=%23B1440E&src=7fj0hi35sdrgceo84gu22g3qlc%40group.calendar.google.com&color=%235229A3&src=e9pvighpcg9gfrjna9joemjhu8%40group.calendar.google.com&color=%2328754E&ctz=America%2FChicago' + datesParam;

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

    });

})();