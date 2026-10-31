# Project structure for Subscription Management System
# Hackathon Project - Brightloop Software

import os

# Create project directories
os.makedirs('backend/app/api', exist_ok=True)
os.makedirs('backend/app/core', exist_ok=True)
os.makedirs('backend/app/models', exist_ok=True)
os.makedirs('backend/app/schemas', exist_ok=True)
os.makedirs('backend/app/services', exist_ok=True)
os.makedirs('backend/app/db', exist_ok=True)
os.makedirs('backend/tests', exist_ok=True)
os.makedirs('frontend/src/components', exist_ok=True)
os.makedirs('frontend/src/pages', exist_ok=True)
os.makedirs('frontend/src/services', exist_ok=True)
os.makedirs('frontend/src/types', exist_ok=True)

print("Project structure created!")
