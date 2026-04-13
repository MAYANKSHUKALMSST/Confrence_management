import { createEvent, EventAttributes } from 'ics';
import { saveAs } from 'file-saver';
import { Booking } from './types';

export const downloadIcs = (booking: Booking) => {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  const event: EventAttributes = {
    start: [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes()
    ],
    end: [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes()
    ],
    title: booking.title,
    description: `Department: ${booking.department}\nAttendees: ${booking.attendees}`,
    location: `Room: ${booking.room}`,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'Room Booking System', email: 'no-reply@roombook.internal' },
  };

  createEvent(event, (error, value) => {
    if (error) {
      console.error(error);
      return;
    }

    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, `${booking.title.replace(/\s+/g, '_')}_booking.ics`);
  });
};
