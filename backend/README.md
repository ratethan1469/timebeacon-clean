# Google Calendar Integration

This project provides a backend integration with Google Calendar, allowing users to manage their calendar events programmatically. 

## Project Structure

```
backend
├── src
│   ├── calendar_integration
│   │   ├── __init__.py
│   │   ├── google_calendar.py
│   │   └── utils.py
│   └── main.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

To start the application, run the following command:

```bash
python src/main.py
```

## Features

- **Authentication**: Securely authenticate with Google Calendar API.
- **Event Management**: Create, retrieve, and manage calendar events.
- **Utility Functions**: Helper functions for date formatting and error logging.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.