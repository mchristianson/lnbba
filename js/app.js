
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

        var locations = {
            'LNHS': 'Lakeville North High School, Ipava Avenue, Lakeville, MN, United States',
            'Kenwood': 'Kenwood Trail Middle School, Kenwood Trail, Lakeville, MN, United States',
            'Oak Hills': 'Oak Hills Elementary School, 165th Street West, Lakeville, MN, United States',
            'Century': 'Century Middle School, Ipava Avenue, Lakeville, MN, United States',
            'Crystal': 'Crystal Lake Education Center, Ipava Avenue, Lakeville, MN, United States',
            'Eastview': 'Eastview Elementary School, Ipava Avenue, Lakeville, MN, United States',
            'Cherry': 'Cherry View Elementary School, 175th Street West, Lakeville, MN, United States',
            'Lakeview': 'Lakeview Elementary School, Jacquard Avenue, Lakeville, MN, United States',
            'Orchard': 'Orchard Lake Elementary School, Klamath Trail, Lakeville, MN, United States',
            'JKK': 'JFK Elementary, Holyoke Avenue, Lakeville, MN, United States'
        };
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
                                _.each(Object.keys(locations), function(loc) {
                                    if (event.summary.indexOf(loc) > -1) {
                                        event.location = locations[loc];
                                    }
                                });
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
            $scope.displayQuickAdd = false;
            $scope.displaySportNginExport = false;
            $scope.displayOpenTimesExport = true;

            googleCalendar.listEvents({
                'calendarId': 'lakevillebbschedule@gmail.com',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'

            }).then(function (events) {
                console.log("event : %o", events);
                _.each(events, function (event) {
                    $scope.displayEvents.push(event);
                });
            });
        };
        $scope.exportToSportNgin = function () {
            $scope.displayEvents = [];
            $scope.displayQuickAdd = false;
            $scope.displaySportNginExport = true;
            $scope.displayOpenTimesExport = false;

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
                            console.log("events : %o", events);
                            _.each(events, function (event) {
                                $scope.displayEvents.push(event);
                            });

                        });
                    }
                });
            });

        };

        $scope.exportData = function (tableId) {
            var blob = new Blob([document.getElementById(tableId).innerHTML], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
            });
            saveAs(blob, "lakeville_schedule_export.xls");
        };
        $scope.displayQuickAdd = true;
        $scope.displaySportNginExport = false;
        $scope.displayOpenTimesExport = false;

    });

})();