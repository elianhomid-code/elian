from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# النماذج للتطبيق الإسلامي
class Bookmark(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    surah_id: int
    surah_name: str
    ayah_number: Optional[int] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookmarkCreate(BaseModel):
    surah_id: int
    surah_name: str
    ayah_number: Optional[int] = None
    user_id: Optional[str] = None

class UserSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    dark_mode: bool = False
    font_size: int = 24
    prayer_notifications: bool = True
    azkar_reminder_time: str = "08:00"
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSettingsCreate(BaseModel):
    user_id: str
    dark_mode: Optional[bool] = False
    font_size: Optional[int] = 24
    prayer_notifications: Optional[bool] = True
    azkar_reminder_time: Optional[str] = "08:00"
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class PrayerTime(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    fajr: str
    sunrise: str
    dhuhr: str
    asr: str
    maghrib: str
    isha: str
    location_lat: float
    location_lng: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# APIs للتطبيق الإسلامي

# API للإشارات المرجعية
@api_router.post("/bookmark", response_model=Bookmark)
async def create_bookmark(bookmark: BookmarkCreate):
    bookmark_dict = bookmark.dict()
    bookmark_obj = Bookmark(**bookmark_dict)
    await db.bookmarks.insert_one(bookmark_obj.dict())
    return bookmark_obj

@api_router.get("/bookmarks", response_model=List[Bookmark])
async def get_bookmarks(user_id: Optional[str] = None):
    query = {"user_id": user_id} if user_id else {}
    bookmarks = await db.bookmarks.find(query).sort("timestamp", -1).to_list(100)
    return [Bookmark(**bookmark) for bookmark in bookmarks]

@api_router.delete("/bookmark/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    result = await db.bookmarks.delete_one({"id": bookmark_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted successfully"}

# API للإعدادات
@api_router.post("/settings", response_model=UserSettings)
async def create_or_update_settings(settings: UserSettingsCreate):
    existing_settings = await db.user_settings.find_one({"user_id": settings.user_id})
    
    if existing_settings:
        # تحديث الإعدادات الموجودة
        update_dict = settings.dict(exclude_unset=True)
        update_dict["timestamp"] = datetime.now(timezone.utc)
        await db.user_settings.update_one(
            {"user_id": settings.user_id},
            {"$set": update_dict}
        )
        updated_settings = await db.user_settings.find_one({"user_id": settings.user_id})
        return UserSettings(**updated_settings)
    else:
        # إنشاء إعدادات جديدة
        settings_dict = settings.dict()
        settings_obj = UserSettings(**settings_dict)
        await db.user_settings.insert_one(settings_obj.dict())
        return settings_obj

@api_router.get("/settings/{user_id}", response_model=UserSettings)
async def get_user_settings(user_id: str):
    settings = await db.user_settings.find_one({"user_id": user_id})
    if not settings:
        # إنشاء إعدادات افتراضية
        default_settings = UserSettings(user_id=user_id)
        await db.user_settings.insert_one(default_settings.dict())
        return default_settings
    return UserSettings(**settings)

# API لمواقيت الصلاة
@api_router.post("/prayer-times", response_model=PrayerTime)
async def save_prayer_times(prayer_times: PrayerTime):
    # حفظ مواقيت الصلاة المحسوبة
    await db.prayer_times.insert_one(prayer_times.dict())
    return prayer_times

@api_router.get("/prayer-times/{user_id}")
async def get_prayer_times(user_id: str, date: str):
    prayer_times = await db.prayer_times.find_one({
        "user_id": user_id,
        "date": date
    })
    if not prayer_times:
        raise HTTPException(status_code=404, detail="Prayer times not found for this date")
    return PrayerTime(**prayer_times)

# API للإحصائيات
@api_router.get("/stats/{user_id}")
async def get_user_stats(user_id: str):
    bookmarks_count = await db.bookmarks.count_documents({"user_id": user_id})
    
    # حساب إجمالي الأيام المستخدمة
    first_bookmark = await db.bookmarks.find_one(
        {"user_id": user_id},
        sort=[("timestamp", 1)]
    )
    
    days_using = 0
    if first_bookmark:
        first_date = first_bookmark.get("timestamp", datetime.now(timezone.utc))
        if isinstance(first_date, str):
            first_date = datetime.fromisoformat(first_date.replace('Z', '+00:00'))
        days_using = (datetime.now(timezone.utc) - first_date).days + 1
    
    return {
        "bookmarks_count": bookmarks_count,
        "days_using": days_using,
        "last_activity": datetime.now(timezone.utc).isoformat()
    }

# APIs الأساسية
@api_router.get("/")
async def root():
    return {"message": "التطبيق الإسلامي الشامل - API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# إضافة البيانات الأساسية للقرآن الكريم (يمكن توسيعها لاحقاً)
@api_router.get("/quran/surahs")
async def get_quran_surahs():
    # بيانات أساسية لسور القرآن الكريم
    surahs = [
        {"id": 1, "name": "الفاتحة", "english_name": "Al-Fatiha", "ayah_count": 7, "revelation_type": "مكية"},
        {"id": 2, "name": "البقرة", "english_name": "Al-Baqarah", "ayah_count": 286, "revelation_type": "مدنية"},
        {"id": 3, "name": "آل عمران", "english_name": "Aal-e-Imran", "ayah_count": 200, "revelation_type": "مدنية"},
        {"id": 4, "name": "النساء", "english_name": "An-Nisa", "ayah_count": 176, "revelation_type": "مدنية"},
        {"id": 5, "name": "المائدة", "english_name": "Al-Maidah", "ayah_count": 120, "revelation_type": "مدنية"},
        # يمكن إضافة المزيد من السور هنا
        {"id": 112, "name": "الإخلاص", "english_name": "Al-Ikhlas", "ayah_count": 4, "revelation_type": "مكية"},
        {"id": 113, "name": "الفلق", "english_name": "Al-Falaq", "ayah_count": 5, "revelation_type": "مكية"},
        {"id": 114, "name": "الناس", "english_name": "An-Nas", "ayah_count": 6, "revelation_type": "مكية"},
    ]
    return {"surahs": surahs}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()