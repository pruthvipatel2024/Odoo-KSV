import os
import uuid
from werkzeug.utils import secure_filename
import cloudinary
import cloudinary.uploader
from flask import current_app

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'}

ALLOWED_MIME_TYPES = {
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_cloudinary(app):
    cloud_name = app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key = app.config.get('CLOUDINARY_API_KEY')
    api_secret = app.config.get('CLOUDINARY_API_SECRET')
    
    if cloud_name and cloud_name != 'mock' and api_key and api_key != 'mock':
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        return True
    return False

def upload_file(file, folder="vendorbridge"):
    """
    Upload file. If Cloudinary is configured, upload there.
    Otherwise, save locally in current_app.config['UPLOAD_FOLDER'] and return relative URL.
    """
    if not file or file.filename == '':
        return None
        
    if not allowed_file(file.filename):
        raise ValueError("File extension not allowed")
        
    # File size validation (5MB max)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer to beginning
    if file_size > 5 * 1024 * 1024:
        raise ValueError("File size exceeds 5MB limit")
        
    # MIME-type validation
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Invalid file type (MIME type not allowed)")
        
    filename = secure_filename(file.filename)
    # Append unique prefix to avoid naming collisions
    unique_filename = f"{uuid.uuid4()}_{filename}"
    
    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
    if cloud_name and cloud_name != 'mock':
        try:
            init_cloudinary(current_app)
            response = cloudinary.uploader.upload(
                file,
                folder=folder,
                resource_type="auto"
            )
            return {
                "url": response.get("secure_url"),
                "public_id": response.get("public_id"),
                "filename": filename
            }
        except Exception as e:
            # Fallback to local upload if cloudinary upload fails
            current_app.logger.warning(f"Cloudinary upload failed, falling back to local storage: {e}")
            
    # Local fallback
    upload_dir = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
        
    file_path = os.path.join(upload_dir, unique_filename)
    file.save(file_path)
    
    # Return local relative URL
    return {
        "url": f"/api/uploads/{unique_filename}",
        "public_id": unique_filename,
        "filename": filename
    }
