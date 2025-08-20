import requests
import sys
import json
from datetime import datetime
import uuid

class IslamicAppAPITester:
    def __init__(self, base_url="https://deen-assistant-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = str(uuid.uuid4())

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, ensure_ascii=False)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_api(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_quran_surahs(self):
        """Test getting Quran surahs"""
        return self.run_test("Get Quran Surahs", "GET", "quran/surahs", 200)

    def test_create_bookmark(self):
        """Test creating a bookmark"""
        bookmark_data = {
            "surah_id": 1,
            "surah_name": "الفاتحة",
            "ayah_number": 1,
            "user_id": self.test_user_id
        }
        success, response = self.run_test("Create Bookmark", "POST", "bookmark", 200, data=bookmark_data)
        return success, response.get('id') if success else None

    def test_get_bookmarks(self):
        """Test getting bookmarks"""
        return self.run_test("Get Bookmarks", "GET", "bookmarks", 200, params={"user_id": self.test_user_id})

    def test_create_settings(self):
        """Test creating user settings"""
        settings_data = {
            "user_id": self.test_user_id,
            "dark_mode": True,
            "font_size": 28,
            "prayer_notifications": True,
            "azkar_reminder_time": "09:00"
        }
        return self.run_test("Create Settings", "POST", "settings", 200, data=settings_data)

    def test_get_settings(self):
        """Test getting user settings"""
        return self.run_test("Get Settings", "GET", f"settings/{self.test_user_id}", 200)

    def test_status_check(self):
        """Test status check functionality"""
        status_data = {
            "client_name": "test_client"
        }
        return self.run_test("Create Status Check", "POST", "status", 200, data=status_data)

    def test_get_status_checks(self):
        """Test getting status checks"""
        return self.run_test("Get Status Checks", "GET", "status", 200)

    def test_delete_bookmark(self, bookmark_id):
        """Test deleting a bookmark"""
        if bookmark_id:
            return self.run_test("Delete Bookmark", "DELETE", f"bookmark/{bookmark_id}", 200)
        else:
            print("⚠️  Skipping delete test - no bookmark ID available")
            return False, {}

def main():
    print("🚀 Starting Islamic App API Tests")
    print("=" * 50)
    
    tester = IslamicAppAPITester()
    
    # Test basic API endpoints
    print("\n📋 Testing Basic APIs...")
    tester.test_root_api()
    tester.test_quran_surahs()
    
    # Test bookmark functionality
    print("\n🔖 Testing Bookmark APIs...")
    bookmark_success, bookmark_id = tester.test_create_bookmark()
    tester.test_get_bookmarks()
    tester.test_delete_bookmark(bookmark_id)
    
    # Test settings functionality
    print("\n⚙️  Testing Settings APIs...")
    tester.test_create_settings()
    tester.test_get_settings()
    
    # Test status functionality
    print("\n📊 Testing Status APIs...")
    tester.test_status_check()
    tester.test_get_status_checks()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())