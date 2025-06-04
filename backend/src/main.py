from __future__ import print_function
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
import datetime
import os.path
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle
import requests
import os

def classify_meeting(event):
    summary = (event.get('summary') or '').lower()
    description = (event.get('description') or '').lower()
    if 'customer' in summary or 'client' in summary or 'customer' in description or 'client' in description:
        return 'Customer Meeting'
    if '1:1' in summary or 'one on one' in summary or '1:1' in description or 'one on one' in description:
        return '1:1'
    if 'team' in summary or 'standup' in summary or 'scrum' in summary:
        return 'Team Meeting'
    return 'Other'

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

TOKEN_PATH = os.path.expanduser('~/.autotime_token.pickle')

def get_calendar_service():
    creds = None
    # The file token.pickle stores the user's access and refresh tokens.
    if os.path.exists(TOKEN_PATH):
        with open(TOKEN_PATH, 'rb') as token:
            creds = pickle.load(token)
    # If there are no (valid) credentials, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                '../credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(TOKEN_PATH, 'wb') as token:
            pickle.dump(creds, token)
    service = build('calendar', 'v3', credentials=creds)
    return service

@app.route('/events')
def get_events():
    service = get_calendar_service()
    # Get year and month from query params, default to current
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    now = datetime.datetime.utcnow()
    if year and month:
        start_of_month = datetime.datetime(year, month, 1)
    else:
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year = start_of_month.year
        month = start_of_month.month
    if month == 12:
        next_month = start_of_month.replace(year=year+1, month=1, day=1)
    else:
        next_month = start_of_month.replace(month=month+1, day=1)
    time_min = start_of_month.isoformat() + 'Z'
    time_max = next_month.isoformat() + 'Z'
    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        timeMax=time_max,
        maxResults=100,
        singleEvents=True,
    ).execute()
    events = events_result.get('items', [])
    output = []
    for event in events:
        start_raw = event['start'].get('dateTime', event['start'].get('date'))
        try:
            if 'T' in start_raw:
                dt = datetime.datetime.fromisoformat(start_raw.replace('Z', '+00:00'))
                start_formatted = dt.strftime('%Y-%m-%d')
            else:
                dt = datetime.datetime.fromisoformat(start_raw)
                start_formatted = dt.strftime('%Y-%m-%d')
        except Exception:
            start_formatted = start_raw
        output.append({
            'start': start_formatted,
            'summary': event.get('summary', ''),
            'location': event.get('location', ''),
            'description': event.get('description', ''),
            'htmlLink': event.get('htmlLink', '')
        })
    return jsonify(events=output)

@app.route('/recurring-events')
def get_recurring_events():
    service = get_calendar_service()
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    events_result = service.events().list(
        calendarId='primary', timeMin=now,
        maxResults=50, singleEvents=False,
        ).execute()
    events = events_result.get('items', [])
    recurring = []
    for event in events:
        summary = (event.get('summary') or '').lower()
        if 'recurrence' in event and 'birthday' not in summary:
            start = event['start'].get('dateTime', event['start'].get('date'))
            recurring.append({
                'id': event.get('id'),
                'start': start,
                'summary': event.get('summary', ''),
                'recurrence': event['recurrence'],
                'location': event.get('location', ''),
                'description': event.get('description', ''),
                'classification': classify_meeting(event)
            })
    return jsonify(events=recurring)

@app.route('/status')
def status():
    connected = os.path.exists('../token.pickle')
    return jsonify({'connected': connected})

@app.route('/disconnect', methods=['POST'])
def disconnect():
    try:
        if os.path.exists('../token.pickle'):
            os.remove('../token.pickle')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/create-event', methods=['POST'])
def create_event():
    service = get_calendar_service()
    data = request.json
    event = {
        'summary': data.get('summary', ''),
        'description': data.get('description', ''),
        'start': {
            'dateTime': data.get('start'),
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': data.get('end'),
            'timeZone': 'UTC',
        },
    }
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    return jsonify({'success': True, 'event': created_event})

@app.route('/set-integration', methods=['POST'])
def set_integration():
    data = request.json
    event_id = data['event_id']
    integration = data['integration']
    enabled = data['enabled']

    # Find the event in recurring events
    service = get_calendar_service()
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    events_result = service.events().list(
        calendarId='primary', timeMin=now,
        maxResults=50, singleEvents=False,
       ).execute()
    events = events_result.get('items', [])
    event = next((e for e in events if e.get('id') == event_id), None)

    if enabled and event:
        classification = classify_meeting(event)
        if classification == 'Customer Meeting':
            create_time_entry(event, integration)

    print(f"Integration {integration} for event {event_id} set to {enabled}")
    return jsonify(success=True)

def create_time_entry(event, integration):
    if integration == 'wrike':
        folder_id = 'IEAGTQMWI5R3UUXH'  # Replace with your actual folder ID
        url = f'https://www.wrike.com/api/v4/folders/IEAGTQMWI5R3UUXH/tasks'
        headers = {
            'Authorization': 'Bearer eyJ0dCI6InAiLCJhbGciOiJIUzI1NiIsInR2IjoiMiJ9.eyJkIjoie1wiYVwiOjY5MzA4MzgsXCJpXCI6OTQxODU1NixcImNcIjo0Njk0MzQzLFwidVwiOjIyMzM2MTI4LFwiclwiOlwiVVNcIixcInNcIjpbXCJXXCIsXCJGXCIsXCJJXCIsXCJVXCIsXCJLXCIsXCJDXCIsXCJEXCIsXCJNXCIsXCJBXCIsXCJMXCIsXCJQXCJdLFwielwiOltdLFwidFwiOjB9IiwiaWF0IjoxNzQ4OTYzODM2fQ.abiz3IUCwLHC68KJq1ZN3B3TAKjayW7VVcSyks9Mvrs',
            'Content-Type': 'application/json'
        }
        
        data = {
            "title": event.get('summary', 'Untitled Meeting'),
            "description": event.get('description', ''),
        }
        try:
            response = requests.post(url, headers=headers, json=data)
            print(f"Wrike API response: {response.status_code} {response.text}")
        except Exception as e:
            print(f"Error calling Wrike API: {e}")
    else:
        print(f"[SIMULATION] Creating time entry for '{event.get('summary')}' in {integration}")
    return True

@app.route('/')
def serve_index():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    return send_from_directory(root_dir, 'index.html')

@app.route('/timehub')
def timehub():
    return render_template('timehub.html')