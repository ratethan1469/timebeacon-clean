def format_date(date):
    """Format a date object into a string suitable for Google Calendar."""
    return date.isoformat()

def log_error(error_message):
    """Log an error message to a file or console."""
    with open('error.log', 'a') as log_file:
        log_file.write(f"{error_message}\n")