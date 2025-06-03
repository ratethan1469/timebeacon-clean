from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import pytz

class GoogleCalendar:
    def __init__(self, credentials_file):
        self.credentials_file = credentials_file
        self.service = self.authenticate()

    def authenticate(self):
        credentials = service_account.Credentials.from_service_account_file(
            self.credentials_file,
            scopes=["https://www.googleapis.com/auth/calendar"]
        )
        return build('calendar', 'v3', credentials=credentials)

    def create_event(self, calendar_id, event_details):
        event = self.service.events().insert(calendarId=calendar_id, body=event_details).execute()
        return event

    def get_events(self, calendar_id, time_min=None, time_max=None):
        events_result = self.service.events().list(calendarId=calendar_id, timeMin=time_min, timeMax=time_max).execute()
        return events_result.get('items', [])

    def update_event(self, calendar_id, event_id, updated_details):
        event = self.service.events().update(calendarId=calendar_id, eventId=event_id, body=updated_details).execute()
        return event

    def delete_event(self, calendar_id, event_id):
        self.service.events().delete(calendarId=calendar_id, eventId=event_id).execute()

def format_event_details(summary, start_time, end_time, description=None, location=None):
    event = {
        'summary': summary,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'UTC',
        },
        'description': description,
        'location': location,
    }
    return event

def get_time_range(days=1):
    now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days)).isoformat()
    return time_min, time_max