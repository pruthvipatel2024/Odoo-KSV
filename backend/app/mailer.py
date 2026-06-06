import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import os
from flask import current_app

def send_async_email(app_context, msg, server_config):
    """
    Worker function to send mail asynchronously
    """
    try:
        smtp_server = server_config['server']
        smtp_port = server_config['port']
        username = server_config['username']
        password = server_config['password']
        
        # Connect to server
        if smtp_server == 'localhost':
            # Local dev SMTP server
            server = smtplib.SMTP(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            if username and password:
                server.login(username, password)
                
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {msg['To']}")
    except Exception as e:
        print(f"Failed to send email to {msg['To']}: {e}")
        # Write to log file in uploads/emails.log for local verification
        try:
            basedir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            log_dir = os.path.join(basedir, 'uploads')
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, 'emails.log')
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f"--- FAILED TO SEND EMAIL TO: {msg['To']} ---\n")
                f.write(f"Subject: {msg['Subject']}\n")
                f.write(f"Body:\n{msg.get_payload(0).get_payload() if msg.is_multipart() else msg.get_payload()}\n")
                f.write(f"Error: {e}\n")
                f.write("="*40 + "\n")
        except Exception as log_err:
            print(f"Could not log failed email: {log_err}")

def send_email(to_email, subject, body_html):
    """
    Helper function to spawn email thread.
    """
    app = current_app._get_current_object()
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = app.config['SMTP_FROM_EMAIL']
    msg['To'] = to_email
    
    html_part = MIMEText(body_html, 'html')
    msg.attach(html_part)
    
    server_config = {
        'server': app.config['SMTP_SERVER'],
        'port': app.config['SMTP_PORT'],
        'username': app.config['SMTP_USERNAME'],
        'password': app.config['SMTP_PASSWORD']
    }
    
    # Run async so HTTP request completes immediately
    thread = threading.Thread(target=send_async_email, args=(app.app_context(), msg, server_config))
    thread.daemon = True
    thread.start()
    return True
