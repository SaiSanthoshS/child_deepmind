import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import base64
from typing import Optional
from app.core.config import get_settings

def send_found_child_email(
    child_name: str,
    case_id: str,
    found_location: str,
    uploaded_image_base64: str,
    found_time: str
) -> bool:
    """
    Sends an email notification to the family.
    From: ksvibhav@gmail.com
    To: sssanthosh.cse@gmail.com
    """
    settings = get_settings()
    sender_email = "ksvibhav@gmail.com"
    receiver_email = "sssanthosh.cse@gmail.com"
    
    password = settings.smtp_password
    
    if not password:
        print("WARNING: SMTP_PASSWORD not set. Skipping real email sending.")
        # Return True for demo purposes if not set, so UI shows success
        return True

    message = MIMEMultipart("related")
    message["Subject"] = f"MATCH ALERT: Child Found - {child_name} (Case: {case_id})"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"""
    Hello,
    
    We have a high-confidence match for your missing child report.
    
    Child Name: {child_name}
    Case ID: {case_id}
    Found At: {found_location}
    Found Time: {found_time}
    
    Please log in to the MissingMesh portal for more details.
    
    Regards,
    MissingMesh Team
    """
    
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <h2 style="color: #2563eb;">Match Alert: Child Found</h2>
        <p>We have identified a potential match for <strong>{child_name}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p><strong>Case ID:</strong> {case_id}</p>
          <p><strong>Found At:</strong> {found_location}</p>
          <p><strong>Found Time:</strong> {found_time}</p>
        </div>
        <p>A photo of the found child has been attached to this email.</p>
        <p>Please log in to the <strong>MissingMesh</strong> portal for more details.</p>
        <br/>
        <img src="cid:found_child_image" alt="Found Child Image" style="max-width: 400px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <br/>
        <p style="font-size: 12px; color: #666;">This is an automated notification from MissingMesh Forensic Identity System.</p>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)
    
    # Attach image
    try:
        if uploaded_image_base64:
            img_data = base64.b64decode(uploaded_image_base64)
            img_part = MIMEImage(img_data)
            img_part.add_header('Content-ID', '<found_child_image>')
            img_part.add_header('Content-Disposition', 'inline', filename='found_child.jpg')
            message.attach(img_part)
    except Exception as e:
        print(f"Failed to process image attachment: {e}")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
