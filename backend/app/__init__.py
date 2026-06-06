import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.database import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    migrate.init_app(app, db)
    # Import all models so SQLAlchemy metadata is registered
    from app import models
    
    jwt = JWTManager(app)

    # Custom claims mapping or error handlers for JWT (optional but good practice)
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "The token has expired", "error": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"msg": "Signature verification failed", "error": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"msg": "Request does not contain an access token", "error": "authorization_required"}), 401

    @app.errorhandler(Exception)
    def handle_exception(e):
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return jsonify({"msg": e.description}), e.code
        app.logger.exception(f"Unhandled exception: {e}")
        return jsonify({"msg": "An internal server error occurred", "error": str(e)}), 500

    # Ensure local upload directories exist
    upload_dir = app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(os.path.join(upload_dir, 'invoices'), exist_ok=True)
    os.makedirs(os.path.join(upload_dir, 'rfqs'), exist_ok=True)
    os.makedirs(os.path.join(upload_dir, 'quotations'), exist_ok=True)

    # Serve uploads locally (fallback static route)
    @app.route('/api/uploads/<path:filename>', methods=['GET'])
    def serve_uploads(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.vendor_routes import vendor_bp
    from app.routes.rfq_routes import rfq_bp
    from app.routes.quotation_routes import quotation_bp
    from app.routes.po_routes import po_bp
    from app.routes.invoice_routes import invoice_bp
    from app.routes.dashboard_routes import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(vendor_bp)
    app.register_blueprint(rfq_bp)
    app.register_blueprint(quotation_bp)
    app.register_blueprint(po_bp)
    app.register_blueprint(invoice_bp)
    app.register_blueprint(dashboard_bp)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "vendorbridge-erp-backend"}), 200

    return app
