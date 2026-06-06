from flask_jwt_extended import create_access_token
from app.database import db
from app.models.user import User
from app.models.vendor import VendorProfile
from app.repositories.user_repository import UserRepository
from app.repositories.vendor_repository import VendorRepository
from app.services.audit_service import AuditService

class AuthService:

    @staticmethod
    def register_user(data):
        """
        Registers a new user. If the role is VENDOR, a VendorProfile is created simultaneously.
        """
        email = data['email']
        if UserRepository.get_by_email(email):
            raise ValueError("Email address already registered")
            
        role = data['role'].upper()
        
        # If VENDOR, validate that company details are present
        if role == 'VENDOR':
            company_name = data.get('company_name')
            gst_number = data.get('gst_number')
            
            if not company_name or not gst_number:
                raise ValueError("Company Name and GST Number are required for vendor registration")
                
            # Check GST uniqueness
            if VendorRepository.get_by_gst(gst_number):
                raise ValueError("GST Number already registered")

        # Create user
        user = User(
            email=email,
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=role,
            is_active=True
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush() # Get user.id
        
        # If VENDOR, create VendorProfile linked to user
        if role == 'VENDOR':
            vendor = VendorProfile(
                user_id=user.id,
                company_name=company_name,
                gst_number=gst_number,
                contact_email=email,
                category=data.get('category'),
                status='PENDING', # Default state is Pending admin/manager approval
                rating=5.00
            )
            db.session.add(vendor)
            
        db.session.commit()
        
        # Log action
        AuditService.log_activity(
            user_id=user.id,
            action="USER_REGISTERED",
            details=f"User registered with email {email} and role {role}"
        )
        
        return user

    @staticmethod
    def authenticate_user(email, password):
        """
        Authenticates user and returns JWT token and user profile
        """
        user = UserRepository.get_by_email(email)
        if not user or not user.is_active or not user.check_password(password):
            return None
            
        # Additional claims in token
        additional_claims = {
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
        
        # Access token
        token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        AuditService.log_activity(
            user_id=user.id,
            action="USER_LOGIN",
            details=f"User logged in successfully"
        )
        
        user_data = user.to_dict()
        if user.role == 'VENDOR' and user.vendor_profile:
            user_data['vendor_id'] = user.vendor_profile.id
            user_data['vendor_status'] = user.vendor_profile.status
            
        return {
            "token": token,
            "user": user_data
        }

    @staticmethod
    def forgot_password(email):
        """
        Handles forgot password request. Logs audit and mock outputs token for security resetting.
        """
        user = UserRepository.get_by_email(email)
        if not user:
            # Prevent enumeration, return True silently
            return True
            
        # In production, send a password reset link via email.
        # Here we mock it by logging and returning success.
        AuditService.log_activity(
            user_id=user.id,
            action="PASSWORD_RESET_REQUESTED",
            details=f"Password reset request received for {email}"
        )
        return True
