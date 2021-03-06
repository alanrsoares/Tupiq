var AppDispatcher = require('../dispatcher/AppDispatcher');
var AppConstants = require('../constants/AppConstants');
var moment = require('moment');
var _ = require('underscore');
var Analytics = require('../utils/Analytics');

function calendarConnect() {
  fetchToken(true, function(err, token) {
    if (err) {
      dispatchError(AppConstants.CALENDAR_CONNECT_ERROR, 'CalendarActions: Calendar Connect - Fetch Token Error');
      return;
    }

    AppDispatcher.dispatch({
      actionType: AppConstants.CALENDAR_CONNECT_SUCCESS
    });

    setTimeout(CalendarActions.refresh);
  });
}

function calendarRefresh(retry) {
  // Fetch the token
  fetchToken(false, function(err, token) {
    if (err) {
      dispatchError(AppConstants.CALENDAR_REFRESH_ERROR, 'CalendarActions: Calendar Refresh - Fetch Token Error');
      return;
    }

    // Request upcoming events
    requestEvents(token, function(err, upcomingEvents) {
      if (err) {
        // Remove the current token to request a new one
        chrome.identity.removeCachedAuthToken({
          token: token
        }, function() {
          // Retry fetching a token without displaying prompt
          if (retry) {
            calendarRefresh(false);
          } else {
            // Give up
            dispatchError(AppConstants.CALENDAR_REFRESH_ERROR, 'CalendarActions: Calendar Refresh - Request Events Error');
          }
        });
        return;
      }

      // Filter out cancelled events or ones user has declined
      upcomingEvents = upcomingEvents.filter(function(event) {
      	var selfDeclined = _.findWhere(event.attendees, {
      		self: true,
      		responseStatus: 'declined'
      	});

      	return event.status !== 'cancelled' && selfDeclined === undefined;
      });

      // Dispatch upcoming events
      AppDispatcher.dispatch({
        actionType: AppConstants.CALENDAR_REFRESH_SUCCESS,
        upcomingEvents: upcomingEvents
      });
    });
  });
}

function requestEvents(token, callback, searchFuture) {
  var today = moment();

  var params = {
    timeMin: today.format('YYYY-MM-DD[T]HH:mm:ssZ'),
    timeMax: (!searchFuture) ? today.add(1, 'days').endOf('day').format('YYYY-MM-DD[T]HH:mm:ssZ') : today.add(1, 'year').endOf('day').format('YYYY-MM-DD[T]HH:mm:ssZ'),
    fields: 'items(status,description,attendees,htmlLink,hangoutLink,summary,location,start,end,id)',
    singleEvents: true,
    orderBy: 'startTime',
    alt: 'json',
    access_token: token
  };

  if (searchFuture) {
  	params.maxResults = 3;
  }

  var req = new XMLHttpRequest();
  req.open('GET', 'https://www.googleapis.com/calendar/v3/calendars/primary/events?' + serialize(params));
  req.onload = function() {
    var res = JSON.parse(req.response),
        upcomingEvents = res.items;

    if (req.status !== 200 || upcomingEvents === null || upcomingEvents === undefined) {
      callback(new Error());
    } else {
      if (upcomingEvents.length === 0 && !searchFuture) {
      	requestEvents(token, callback, true);
      } else {
      	callback(null, upcomingEvents);
      }
    }
  };
  req.send();
}

function fetchToken (interactive, callback) {
  // chrome://identity-internals/
  chrome.identity.getAuthToken({
    'interactive': interactive,
    'scopes': ['https://www.googleapis.com/auth/calendar']
  }, function(token) {
    if (chrome.runtime.lastError) {
      callback(chrome.runtime.lastError);
    } else {
      callback(null, token);
    }
  });
}

function serialize (obj, prefix) {
  var str = [];
  for(var p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
      str.push(typeof v == "object" ?
        serialize(v, k) :
        encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
  }
  return str.join("&");
}

function dispatchError(actionType, desc, fatal) {
  Analytics.trackException(desc, fatal);

  AppDispatcher.dispatch({
    actionType: actionType
  });
}

var CalendarActions = {
  connect: function() {
    AppDispatcher.dispatch({
      actionType: AppConstants.CALENDAR_CONNECT
    });

    calendarConnect();
  },

  disconnect: function() {
    AppDispatcher.dispatch({
      actionType: AppConstants.CALENDAR_DISCONNECT
    });
  },

  refresh: function() {
    AppDispatcher.dispatch({
      actionType: AppConstants.CALENDAR_REFRESH
    });

    calendarRefresh(true);
  }
};

module.exports = CalendarActions;
