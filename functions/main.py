import datetime
from firebase_functions import scheduler_fn
from firebase_admin import initialize_app, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from garminconnect import Garmin

# App initialization is done lazily inside the function to avoid DefaultCredentialsError during Firebase CLI deployment

# The cron schedule "0 10,21 * * *" triggers at exactly 10:00 AM and 9:00 PM every day
@scheduler_fn.on_schedule(schedule="0 10,21 * * *")
def sync_all_garmin_users(event: scheduler_fn.ScheduledEvent) -> None:
    """Iterates through all registered Garmin users and syncs their daily health data."""
    import firebase_admin
    if not firebase_admin._apps:
        initialize_app()
    db = firestore.client()
    
    # 1. Query Firestore for all users who have linked their Garmin accounts
    users_ref = db.collection("users").where(filter=FieldFilter("garmin_connected", "==", True)).stream()
    
    today = datetime.date.today().isoformat()
    
    for user in users_ref:
        user_data = user.to_dict()
        email = user_data.get("garmin_email")
        
        # Security Note: Passwords should NEVER be saved in plain text.
        # This assumes you have a separate function to decrypt the stored password.
        encrypted_password = user_data.get("garmin_password") 
        password = decrypt_user_password(encrypted_password) # Placeholder for your decryption logic
        
        try:
            # 2. Authenticate with Garmin Connect as the specific user
            client = Garmin(email, password)
            client.login()
            
            # 3. Fetch the daily metrics
            steps_data = client.get_daily_steps_data(today)
            sleep_data = client.get_sleep_data(today)
            
            # 4. Save the processed data back to the user's Firestore subcollection
            db.collection("users").document(user.id).collection("health_data").document(today).set({
                "date": today,
                "steps": steps_data,
                "sleep": sleep_data,
                "last_sync": firestore.SERVER_TIMESTAMP
            }, merge=True)
            
            print(f"Successfully synced Garmin data for user: {user.id}")
            
        except Exception as e:
            # Log the error but allow the loop to continue for the next user
            print(f"Error syncing data for user {user.id}: {e}")

def decrypt_user_password(encrypted_str):
    """
    Placeholder: You must implement actual decryption here (e.g., using Google Cloud KMS 
    or a standard AES-256 decryption library) before passing it to the Garmin client.
    """
    return encrypted_str
