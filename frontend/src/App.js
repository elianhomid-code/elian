import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { BookOpen, Home, Moon, Sun, Settings, Bookmark, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// بيانات القرآن الكريم (نموذج للسور الأولى)
const quranData = {
  surahs: [
    {
      id: 1,
      name: "الفاتحة",
      englishName: "Al-Fatiha",
      ayahCount: 7,
      revelationType: "مكية",
      ayahs: [
        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        "الرَّحْمَٰنِ الرَّحِيمِ",
        "مَالِكِ يَوْمِ الدِّينِ",
        "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
        "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ"
      ]
    },
    {
      id: 2,
      name: "البقرة",
      englishName: "Al-Baqarah",
      ayahCount: 286,
      revelationType: "مدنية",
      ayahs: [
        "الم",
        "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ",
        "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ",
        "وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ",
        "أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ"
      ]
    },
    {
      id: 3,
      name: "آل عمران",
      englishName: "Aal-e-Imran",
      ayahCount: 200,
      revelationType: "مدنية",
      ayahs: [
        "الم",
        "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
        "نَزَّلَ عَلَيْكَ الْكِتَابَ بِالْحَقِّ مُصَدِّقًا لِّمَا بَيْنَ يَدَيْهِ وَأَنزَلَ التَّوْرَاةَ وَالْإِنجِيلَ"
      ]
    },
    {
      id: 112,
      name: "الإخلاص",
      englishName: "Al-Ikhlas",
      ayahCount: 4,
      revelationType: "مكية",
      ayahs: [
        "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "اللَّهُ الصَّمَدُ",
        "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ"
      ]
    },
    {
      id: 113,
      name: "الفلق",
      englishName: "Al-Falaq",
      ayahCount: 5,
      revelationType: "مكية",
      ayahs: [
        "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
        "مِن شَرِّ مَا خَلَقَ",
        "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
        "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
        "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
      ]
    },
    {
      id: 114,
      name: "الناس",
      englishName: "An-Nas",
      ayahCount: 6,
      revelationType: "مكية",
      ayahs: [
        "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        "مَلِكِ النَّاسِ",
        "إِلَٰهِ النَّاسِ",
        "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
        "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
        "مِنَ الْجِنَّةِ وَالنَّاسِ"
      ]
    }
  ]
};

// مكون الصفحة الرئيسية
const HomePage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 to-teal-100'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* الهيدر */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-emerald-800'} font-arabic`}>
            التطبيق الإسلامي الشامل
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-emerald-600'} font-arabic`}>
            {new Date().toLocaleDateString('ar-SA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* الميزات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className={`hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <CardHeader className="text-center">
              <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-arabic`}>القرآن الكريم</CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-arabic`}>
                اقرأ سور القرآن الكريم بخط جميل
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className={`hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <CardHeader className="text-center">
              <Settings className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-arabic`}>مواقيت الصلاة</CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-arabic`}>
                معرفة أوقات الصلاة حسب موقعك
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className={`hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <CardHeader className="text-center">
              <Bookmark className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <CardTitle className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-arabic`}>الأذكار</CardTitle>
              <CardDescription className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-arabic`}>
                أذكار الصباح والمساء والتسبيح
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* زر الوضع الليلي */}
        <div className="text-center">
          <Button
            onClick={() => setIsDarkMode(!isDarkMode)}
            variant="outline"
            className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-slate-800' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// صفحة قائمة السور
const QuranList = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(null);

  if (selectedSurah) {
    return <SurahReader surah={selectedSurah} onBack={() => setSelectedSurah(null)} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 to-teal-100'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* الهيدر */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-800'} font-arabic`}>
            القرآن الكريم
          </h1>
          <Button
            onClick={() => setIsDarkMode(!isDarkMode)}
            variant="outline"
            size="sm"
            className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-slate-800' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* قائمة السور */}
        <div className="space-y-4">
          {quranData.surahs.map((surah) => (
            <Card 
              key={surah.id} 
              className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white hover:bg-emerald-25'}`}
              onClick={() => setSelectedSurah(surah)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-emerald-700' : 'bg-emerald-600'} text-white font-bold`}>
                      {surah.id}
                    </div>
                    <div className="text-right">
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} font-arabic mb-1`}>
                        {surah.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {surah.englishName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse text-right">
                    <div>
                      <Badge variant={surah.revelationType === 'مكية' ? 'default' : 'secondary'} className="mb-2">
                        {surah.revelationType}
                      </Badge>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {surah.ayahCount} آية
                      </p>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// مكون قارئ السورة
const SurahReader = ({ surah, onBack, isDarkMode, setIsDarkMode }) => {
  const [fontSize, setFontSize] = useState(24);
  const [bookmarked, setBookmarked] = useState(false);

  const increaseFontSize = () => {
    if (fontSize < 36) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 16) setFontSize(fontSize - 2);
  };

  const saveBookmark = async () => {
    try {
      await axios.post(`${API}/bookmark`, {
        surahId: surah.id,
        surahName: surah.name,
        timestamp: new Date()
      });
      setBookmarked(true);
    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 to-teal-100'}`}>
      <div className="container mx-auto px-4 py-6">
        {/* شريط التحكم */}
        <div className="flex justify-between items-center mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-4">
          <Button
            onClick={onBack}
            variant="outline"
            className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-slate-700' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
          >
            عودة
          </Button>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              onClick={decreaseFontSize}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-emerald-300 text-emerald-700'}`}
            >
              ص-
            </Button>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fontSize}px</span>
            <Button
              onClick={increaseFontSize}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-emerald-300 text-emerald-700'}`}
            >
              ص+
            </Button>
            
            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-emerald-300 text-emerald-700'}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={saveBookmark}
              variant={bookmarked ? "default" : "outline"}
              size="sm"
              className={bookmarked ? "bg-emerald-600 hover:bg-emerald-700" : `${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-emerald-300 text-emerald-700'}`}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* عنوان السورة */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-800'} font-arabic mb-2`}>
            سورة {surah.name}
          </h1>
          <div className="flex justify-center items-center space-x-4 space-x-reverse">
            <Badge variant={surah.revelationType === 'مكية' ? 'default' : 'secondary'}>
              {surah.revelationType}
            </Badge>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {surah.ayahCount} آية
            </span>
          </div>
        </div>

        {/* البسملة */}
        {surah.id !== 1 && (
          <div className="text-center mb-8">
            <p className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'} font-arabic text-2xl`}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        )}

        {/* آيات السورة */}
        <Card className={`${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80'} backdrop-blur-sm`}>
          <CardContent className="p-8">
            <div className="space-y-6">
              {surah.ayahs.map((ayah, index) => (
                <div key={index} className="text-center">
                  <p 
                    className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-arabic leading-loose`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {ayah}
                    <span className={`inline-block mr-2 text-sm px-2 py-1 rounded-full ${isDarkMode ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      {index + 1}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// مكون التنقل السفلي
const BottomNavigation = ({ currentPath }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/quran', icon: BookOpen, label: 'القرآن' },
    { path: '/qibla', icon: Settings, label: 'القبلة' },
    { path: '/azkar', icon: Bookmark, label: 'الأذكار' },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} z-50`}>
      <div className="flex justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center py-2 px-4 ${
              currentPath === path 
                ? `${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}` 
                : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
            } transition-colors duration-200 hover:${isDarkMode ? 'text-emerald-300' : 'text-emerald-500'}`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-arabic">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// مكون التطبيق الرئيسي
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

// مكون محتوى التطبيق
function AppContent() {
  const location = useLocation();

  return (
    <div className="App" dir="rtl">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quran" element={<QuranList />} />
      </Routes>
      <BottomNavigation currentPath={location.pathname} />
      <div className="pb-20"> {/* مساحة للتنقل السفلي */}
      </div>
    </div>
  );
}

export default App;