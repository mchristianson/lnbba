
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
            scopes: ["https://www.googleapis.com/auth/calendar"]
        });
        //$parseProvider.unwrapPromises(true);

        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    });

    module.controller('LnbbaCtrl', function ($scope, $log, $q, $timeout, $window, $filter, googleLogin, googleCalendar) {

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
        $scope.login = function () {
            googleLogin.login().then(function() {}, function() { console.error("failed login")});
        };
        $scope.$on("google:authenticated", function(auth) {
            $scope.loggedIntoGoogle = true;
        });
        $scope.$on("googleCalendar:loaded", function() {
            googleCalendar.listCalendars().then(function(cals) {
                $scope.calendars = cals;
            });
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
        $scope.addEvent = function() {
            var randomMember = _.sample(this.members);
            var self = this;
            var lunchStart = moment(self.lunchDate + " " + self.lunchTime);
            var lunchEnd = lunchStart.clone().add("hours", 1);

            googleCalendar.createEvent({
                calendarId: self.selectedCalendar.id,
                sendNotifications: true,
                resource: event
            }).then(function(event) {
                $scope.newEvent = event;
            }, function(error) {
                $scope.eventCreationError = error;
            });
        };

        $scope.checkEmAll = function (event) {
            $('input:checkbox').attr('checked', event.currentTarget.checked);
        };

        var randomColor = function () {
            return '%23'+Math.floor(Math.random()*16777215).toString(16);
        };
        $scope.generateLink = function () {
            var checked = _.pluck($('input:checked'), 'value');
            var link = "https://calendar.google.com/calendar/embed?mode=WEEK&wkst=1&ctz=America%2FChicago";
            _.each(checked, function (id) {
                if (_.contains(id, 'group.calendar.google.com')) {
                    link += "&src=" + id + "&color=" + randomColor();
                }
            });
            $scope.generatedLink = link;
        };


        // Your Client ID can be retrieved from your project in the Google
        // Developer Console, https://console.developers.google.com
        //var CLIENT_ID = '';
        //
        //var SCOPES = ["https://www.googleapis.com/auth/calendar"];
        //
        //$window.initGapi = checkAuth;
        ///**
        // * Check if current user has authorized this application.
        // */
        //var checkAuth = function() {
        //    gapi.auth.authorize(
        //        {
        //            'client_id': CLIENT_ID,
        //            'scope': SCOPES.join(' '),
        //            'immediate': true
        //        }, handleAuthResult);
        //};
        //
        ///**
        // * Handle response from authorization server.
        // *
        // * @param {Object} authResult Authorization result.
        // */
        //var handleAuthResult = function (authResult) {
        //    var authorizeDiv = document.getElementById('authorize-div');
        //    if (authResult && !authResult.error) {
        //        // Hide auth UI, then load client library.
        //        authorizeDiv.style.display = 'none';
        //        loadCalendarApi();
        //    } else {
        //        // Show auth UI, allowing the user to initiate authorization by
        //        // clicking authorize button.
        //        authorizeDiv.style.display = 'inline';
        //    }
        //};
        //
        ///**
        // * Initiate auth flow in response to user clicking authorize button.
        // *
        // * @param {Event} event Button click event.
        // */
        //$scope.handleAuthClick = function (event) {
        //    gapi.auth.authorize(
        //        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        //        handleAuthResult);
        //    return false;
        //};

        /**
         * Load Google Calendar client library. List upcoming events
         * once client library is loaded.
        // */
        //var loadCalendarApi = function () {
        //    gapi.client.load('calendar', 'v3', function () {
        //        appendPre('Ready!');
        //    });
        //};

        /**
         * Print the summary and start datetime/date of the next ten events in
         * the authorized user's calendar. If no events are found an
         * appropriate message is printed.
         */
        var updateUpcomingEvents = function (calendarId, summary) {
            var request = gapi.client.calendar.events.list({
                'calendarId': calendarId,
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'
            });

            request.execute(function(resp) {
                var events = resp.items;
                appendPre('Checking events for: ' + summary);

                if (events.length > 0) {
                    for (var i = 0; i < events.length; i++) {
                        var event = events[i];
                        var when = event.start.dateTime;
                        if (!when) {
                            when = event.start.date;
                        }

                        if (event.summary.indexOf(summary) == -1) {
                            event.summary = summary + ' ' + event.summary;
                            var updateRequest = gapi.client.calendar.events.update({
                                'calendarId': calendarId,
                                'eventId': event.id,
                                'resource': event
                            });
                            updateRequest.execute(function(newEvent) {
                                appendPre('     Event updated: ' + newEvent.summary);
                            });
                        }
//                        appendPre('   ' + event.summary + ' (' + when + ')')
                    }
                } else {
                    appendPre('No upcoming events found.');
                }

            });
        };

        var insertEvent = function (text) {
            var request = gapi.client.calendar.events.quickAdd({
                'calendarId': 'primary',
                'text': text
            });

            request.execute(function(event) {
                console.log("event : %o", event);
                appendPre('Event created: ');
                var when = event.start.dateTime;
                if (!when) {
                    when = event.start.date;
                }
                appendPre('   ' + event.summary + ' (' + when + ')')

            });
        };

        $scope.updateAllCalendarNames = function () {
            var list = {
                'maxResults': 50
            };
            var request = gapi.client.calendar.calendarList.list({
                'resource': list
            });

            request.execute(function(resp) {
                var events = resp.items;
                appendPre('Calendars:');

                if (events.length > 0) {
                    for (var i = 0; i < events.length; i++) {
                        var event = events[i];
                        appendPre(event.summary);
                        if (event.summary.indexOf('lakevillebbschedule') == -1) {
                            updateUpcomingEvents(event.id, event.summary);
                        }
                    }
                } else {
                    appendPre('No calendars found.');
                }

            });
        };

        //$scope.quickAdd = function () {
        //    var lines = $('#quickadd').val().split('\n');
        //
        //    for (var i = 0;i < lines.length; i++) {
        //        console.log("lines[i] : %o", lines[i]);
        //        if (lines[i] !== '') {
        //            insertEvent(lines[i]);
        //        }
        //    }
        //};

        $scope.generateLinks = function () {

        };

        /**
         * Append a pre element to the body containing the given message
         * as its text node.
         *
         * @param {string} message Text to be placed in pre element.
         */
        var appendPre = function (message) {
            var pre = document.getElementById('output');
            var textContent = document.createTextNode(message + '\n');
            pre.appendChild(textContent);
        };

        $scope.quickAddText = "Monday, 3/14 LNHS South Gym      6:30 to 8:00pm";

    });

})();