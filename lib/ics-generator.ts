/**
 * iCalendar (.ics) Generator for Meetings and Calendar Appointments
 */

export type ICSEventData = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendees?: string[];
};

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateICSString(event: ICSEventData): string {
  const nowStr = formatDateToICS(new Date());
  const startStr = formatDateToICS(new Date(event.startTime));
  const endStr = formatDateToICS(new Date(event.endTime));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UKRBA CMS//Business Calendar Module//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${event.id}@ukrba.org`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${event.location.replace(/\n/g, " ")}`);
  }

  if (event.organizerEmail) {
    lines.push(`ORGANIZER;CN=${event.organizerName || "UKRBA Staff"}:mailto:${event.organizerEmail}`);
  }

  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach((email) => {
      if (email && email.includes("@")) {
        lines.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email.trim()}`);
      }
    });
  }

  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
