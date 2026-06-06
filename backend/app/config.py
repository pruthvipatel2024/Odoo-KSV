import os
from dotenv import load_dotenv

# Load env variables from backend/.env if exists
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-vendorbridge-erp-2026-secure')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret-key-vendorbridge-erp-2026-secure')
    
    # DB URI defaults to MySQL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:@localhost:3306/vendorbridge_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', 'mock')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', 'mock')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', 'mock')
    
    # SMTP Config
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'localhost')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '1025'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', 'info@vendorbridge.local')
    
    # Local upload folder if Cloudinary is mocked
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
