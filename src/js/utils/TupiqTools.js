var moment = require('moment');

function NumbersToWords(num) {
	var ones = new Array('', ' one', ' two', ' three', ' four', ' five', ' six', ' seven', ' eight', ' nine', ' ten', ' eleven', ' twelve', ' thirteen', ' fourteen', ' fifteen', ' sixteen', ' seventeen', ' eighteen', ' nineteen');
	var tens = new Array('', '', ' twenty', ' thirty', ' forty', ' fifty', ' sixty', ' seventy', ' eighty', ' ninety');
	var hundred = ' hundred';
	var output = '';
	var numString = num.toString();

	if (num == 0) {
		return 'zero';
	}
	//the case of 10, 11, 12 ,13, .... 19
	if (num < 20) {
		output = ones[num];
		return output;
	}

	//100 and more
	if (numString.length == 3) {
		output = ones[parseInt(numString.charAt(0))] + hundred;
		output += tens[parseInt(numString.charAt(1))];
		output += ones[parseInt(numString.charAt(2))];
		return output;
	}

	output += tens[parseInt(numString.charAt(0))];
	output += ones[parseInt(numString.charAt(1))];

	return output;
}

var TupiqTools = {

	agenda: function(upcomingEvents) {
		if (upcomingEvents && upcomingEvents.length > 0) {
			var momentNow = moment(),
				primaryNote,
				secondaryNote,
				nextEvent = upcomingEvents[0],
				eventsRemaining,
				isNextEventToday,
				isNextEventTomorrow,
				isNextEventRightNow,
				eventsRemainingToday,
				eventsRemainingTomorrow;

			nextEvent.momentStart = moment(nextEvent.start.dateTime || nextEvent.start.date);
			nextEvent.momentEnd = moment(nextEvent.end.dateTime || nextEvent.end.date);
			nextEvent.fromNow = nextEvent.momentStart.fromNow();

			if (nextEvent.location !== undefined) {
				nextEvent.actualLocation = ' at ' + nextEvent.location;
			} else {
				nextEvent.actualLocation = '';
			}

			isNextEventToday = nextEvent.momentStart.isSame(momentNow, 'day');
			isNextEventTomorrow = nextEvent.momentStart.isAfter(momentNow, 'day');
			isNextEventRightNow = nextEvent.momentStart.isBefore(momentNow) && nextEvent.momentEnd.isAfter(momentNow);

			eventsRemaining = upcomingEvents.slice(1).filter(function(event) {
				return moment(event.start.dateTime || event.start.date).isSame(momentNow, 'day');
			});

			eventsRemainingToday = NumbersToWords(eventsRemaining.length);
			eventsRemainingTomorrow = NumbersToWords(upcomingEvents.length - 1);

			// If upcoming event is today...
			if (isNextEventToday) {

			  // The event is happening right now
			  if (isNextEventRightNow) {
			    primaryNote = `${nextEvent.summary} started about ${nextEvent.fromNow}${nextEvent.actualLocation}.`;
			    secondaryNote = `Plus ${eventsRemainingToday} other upcoming events today.`;

			  // The event is yet to happen
			  } else {
			    primaryNote = `Youve got ${nextEvent.summary} ${nextEvent.fromNow}${nextEvent.actualLocation}.`;
			    secondaryNote = `Plus ${eventsRemainingToday} other upcoming events today.`;
			  }

			// If upcoming event is tomorrow...
			} else if (isNextEventTomorrow) {
			  primaryNote = `Tomorrow your day starts at ${nextEvent.momentStart.format('h:mma')} with ${nextEvent.summary}${nextEvent.actualLocation}.`;
			  secondaryNote = `Plus ${eventsRemainingTomorrow} other events.`;
			}

		// No upcoming events today or tomorrow
		} else {
			primaryNote = `Today and tomorrow look clear.`,
			secondaryNote = `Your next event is Sprint Review in 3 days.`;
		}

		return {
			primaryNote: primaryNote,
			secondaryNote: secondaryNote
		}
	}

}

module.exports = TupiqTools;
