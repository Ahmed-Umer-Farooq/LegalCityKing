import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';
import api from '../../utils/api';
import GoogleLogin from './GoogleLogin';

const AuthForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [userType, setUserType] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '', username: '', address: '', city: '', state: '', zipCode: '',
    country: '', countryCode: '+1', mobileNumber: '', email: '', password: '',
    registrationId: '', firm: '', specialty: '', acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const lawFirms = [
    'Solo Practice', 'Baker McKenzie', 'DLA Piper', 'Latham & Watkins', 'Clifford Chance',
    'Kirkland & Ellis', 'Skadden Arps', 'White & Case', 'Freshfields', 'Linklaters',
    'Allen & Overy', 'Cleary Gottlieb', 'Sullivan & Cromwell', 'Davis Polk', 'Cravath Swaine',
    'Simpson Thacher', 'Wachtell Lipton', 'Paul Weiss', 'Debevoise & Plimpton', 'Milbank',
    'Gibson Dunn', 'Sidley Austin', 'Jones Day', 'Covington & Burling', 'Wilmer Hale',
    'Ropes & Gray', 'Goodwin Procter', 'Orrick Herrington', 'Wilson Sonsini', 'Fenwick & West',
    'Other'
  ];

  const specialties = [
    'Corporate Law', 'Criminal Law', 'Family Law', 'Personal Injury', 'Real Estate Law',
    'Employment Law', 'Immigration Law', 'Intellectual Property', 'Tax Law', 'Environmental Law',
    'Healthcare Law', 'Securities Law', 'Bankruptcy Law', 'Civil Rights Law', 'Contract Law',
    'Constitutional Law', 'Administrative Law', 'International Law', 'Maritime Law', 'Aviation Law',
    'Entertainment Law', 'Sports Law', 'Energy Law', 'Insurance Law', 'Antitrust Law',
    'Privacy Law', 'Cybersecurity Law', 'Medical Malpractice', 'Product Liability', 'Workers Compensation',
    'Other'
  ];
  const countryCodes = [
    { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
    { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
    { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
    { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
    { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
    { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
    { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
    { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
    { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
    { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
    { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
    { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
    { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
    { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
    { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
    { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
    { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  ];

  const countries = [
    'United States', 'China', 'Japan', 'Germany', 'India', 'United Kingdom', 'France', 'Italy', 'Brazil', 'Canada',
    'Russia', 'South Korea', 'Australia', 'Spain', 'Mexico', 'Indonesia', 'Netherlands', 'Saudi Arabia', 'Turkey', 'Taiwan',
    'Belgium', 'Argentina', 'Bangladesh', 'Ireland', 'Israel', 'Thailand', 'Nigeria', 'Egypt', 'South Africa', 'Philippines',
    'Finland', 'Chile', 'Malaysia', 'Pakistan', 'Czech Republic', 'New Zealand', 'Romania', 'Vietnam', 'Peru', 'Greece',
    'Portugal', 'Iraq', 'Algeria', 'Kazakhstan', 'Qatar', 'Kuwait', 'Ukraine', 'Morocco', 'Ecuador', 'Angola', 'Other'
  ];

  const statesByCountry = {
    'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'],
    'Germany': ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
    'France': ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'],
    'India': ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'],
    'China': ['Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou', 'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hubei', 'Hunan', 'Inner Mongolia', 'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Ningxia', 'Qinghai', 'Shaanxi', 'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'],
    'Brazil': ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
    'Pakistan': ['Balochistan', 'Khyber Pakhtunkhwa', 'Punjab', 'Sindh', 'Islamabad Capital Territory', 'Azad Kashmir', 'Gilgit-Baltistan'],
    'Bangladesh': ['Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'],
    'Japan': ['Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'],
    'Italy': ['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont', 'Puglia', 'Sardinia', 'Sicily', 'Trentino-Alto Adige', 'Tuscany', 'Umbria', 'Aosta Valley', 'Veneto'],
    'Spain': ['Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands', 'Cantabria', 'Castile and León', 'Castile-La Mancha', 'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencia'],
    'South Korea': ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Ulsan', 'Sejong', 'Gyeonggi', 'Gangwon', 'North Chungcheong', 'South Chungcheong', 'North Jeolla', 'South Jeolla', 'North Gyeongsang', 'South Gyeongsang', 'Jeju'],
    'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh', 'Volgograd'],
    'Mexico': ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', 'Mexico City'],
    'Indonesia': ['Aceh', 'North Sumatra', 'West Sumatra', 'Riau', 'Jambi', 'South Sumatra', 'Bengkulu', 'Lampung', 'Bangka Belitung', 'Riau Islands', 'Jakarta', 'West Java', 'Central Java', 'Yogyakarta', 'East Java', 'Banten', 'Bali', 'West Nusa Tenggara', 'East Nusa Tenggara', 'West Kalimantan', 'Central Kalimantan', 'South Kalimantan', 'East Kalimantan', 'North Kalimantan', 'North Sulawesi', 'Central Sulawesi', 'South Sulawesi', 'Southeast Sulawesi', 'Gorontalo', 'West Sulawesi', 'Maluku', 'North Maluku', 'Papua', 'West Papua'],
    'Netherlands': ['Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'North Brabant', 'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland'],
    'Saudi Arabia': ['Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 'Tabuk', 'Qassim', 'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Bahah', 'Al Jawf'],
    'Turkey': ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta', 'Mersin', 'Istanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'],
    'Taiwan': ['Taipei', 'New Taipei', 'Taoyuan', 'Taichung', 'Tainan', 'Kaohsiung', 'Keelung', 'Hsinchu', 'Chiayi', 'Yilan', 'Hsinchu County', 'Miaoli', 'Changhua', 'Nantou', 'Yunlin', 'Chiayi County', 'Pingtung', 'Taitung', 'Hualien', 'Penghu', 'Kinmen', 'Lienchiang'],
    'Belgium': ['Antwerp', 'East Flanders', 'Flemish Brabant', 'Limburg', 'West Flanders', 'Brussels', 'Hainaut', 'Liège', 'Luxembourg', 'Namur', 'Walloon Brabant'],
    'Argentina': ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Buenos Aires City'],
    'Ireland': ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'],
    'Israel': ['Central District', 'Haifa District', 'Jerusalem District', 'Northern District', 'Southern District', 'Tel Aviv District'],
    'Thailand': ['Bangkok', 'Amnat Charoen', 'Ang Thong', 'Bueng Kan', 'Buriram', 'Chachoengsao', 'Chai Nat', 'Chaiyaphum', 'Chanthaburi', 'Chiang Mai', 'Chiang Rai', 'Chonburi', 'Chumphon', 'Kalasin', 'Kamphaeng Phet', 'Kanchanaburi', 'Khon Kaen', 'Krabi', 'Lampang', 'Lamphun', 'Loei', 'Lopburi', 'Mae Hong Son', 'Maha Sarakham', 'Mukdahan', 'Nakhon Nayok', 'Nakhon Pathom', 'Nakhon Phanom', 'Nakhon Ratchasima', 'Nakhon Sawan', 'Nakhon Si Thammarat', 'Nan', 'Narathiwat', 'Nong Bua Lamphu', 'Nong Khai', 'Nonthaburi', 'Pathum Thani', 'Pattani', 'Phang Nga', 'Phatthalung', 'Phayao', 'Phetchabun', 'Phetchaburi', 'Phichit', 'Phitsanulok', 'Phrae', 'Phuket', 'Prachinburi', 'Prachuap Khiri Khan', 'Ranong', 'Ratchaburi', 'Rayong', 'Roi Et', 'Sa Kaeo', 'Sakon Nakhon', 'Samut Prakan', 'Samut Sakhon', 'Samut Songkhram', 'Sara Buri', 'Satun', 'Sing Buri', 'Sisaket', 'Songkhla', 'Sukhothai', 'Suphan Buri', 'Surat Thani', 'Surin', 'Tak', 'Trang', 'Trat', 'Ubon Ratchathani', 'Udon Thani', 'Uthai Thani', 'Uttaradit', 'Yala', 'Yasothon'],
    'Nigeria': ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Federal Capital Territory'],
    'Egypt': ['Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef', 'Cairo', 'Dakahlia', 'Damietta', 'Fayyum', 'Gharbia', 'Giza', 'Ismailia', 'Kafr el-Sheikh', 'Luxor', 'Matrouh', 'Minya', 'Monufia', 'New Valley', 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia', 'Sohag', 'South Sinai', 'Suez'],
    'South Africa': ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'],
    'Philippines': ['Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique', 'Apayao', 'Aurora', 'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol', 'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu', 'Compostela Valley', 'Cotabato', 'Davao del Norte', 'Davao del Sur', 'Davao Oriental', 'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga', 'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'La Union', 'Leyte', 'Maguindanao', 'Marinduque', 'Masbate', 'Mindoro Occidental', 'Mindoro Oriental', 'Misamis Occidental', 'Misamis Oriental', 'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'Northern Samar', 'Nueva Ecija', 'Nueva Vizcaya', 'Palawan', 'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Romblon', 'Samar', 'Sarangani', 'Siquijor', 'Sorsogon', 'South Cotabato', 'Southern Leyte', 'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay', 'Metro Manila'],
    'Finland': ['Lapland', 'North Ostrobothnia', 'Kainuu', 'North Karelia', 'Northern Savo', 'Southern Savo', 'South Karelia', 'Kymenlaakso', 'Päijät-Häme', 'Kanta-Häme', 'Uusimaa', 'Southwest Finland', 'Satakunta', 'Pirkanmaa', 'Central Finland', 'South Ostrobothnia', 'Ostrobothnia', 'Central Ostrobothnia', 'Åland'],
    'Chile': ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Santiago', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'],
    'Malaysia': ['Johor', 'Kedah', 'Kelantan', 'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya'],
    'Czech Republic': ['Prague', 'Central Bohemian', 'South Bohemian', 'Plzen', 'Karlovy Vary', 'Usti nad Labem', 'Liberec', 'Hradec Kralove', 'Pardubice', 'Vysocina', 'South Moravian', 'Olomouc', 'Zlin', 'Moravian-Silesian'],
    'New Zealand': ['Auckland', 'Bay of Plenty', 'Canterbury', 'Gisborne', 'Hawke\'s Bay', 'Manawatu-Wanganui', 'Marlborough', 'Nelson', 'Northland', 'Otago', 'Southland', 'Taranaki', 'Tasman', 'Waikato', 'Wellington', 'West Coast'],
    'Romania': ['Alba', 'Arad', 'Arges', 'Bacau', 'Bihor', 'Bistrita-Nasaud', 'Botosani', 'Braila', 'Brasov', 'Bucharest', 'Buzau', 'Calarasi', 'Caras-Severin', 'Cluj', 'Constanta', 'Covasna', 'Dambovita', 'Dolj', 'Galati', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomita', 'Iasi', 'Ilfov', 'Maramures', 'Mehedinti', 'Mures', 'Neamt', 'Olt', 'Prahova', 'Salaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timis', 'Tulcea', 'Vaslui', 'Valcea', 'Vrancea'],
    'Vietnam': ['An Giang', 'Ba Ria-Vung Tau', 'Bac Giang', 'Bac Kan', 'Bac Lieu', 'Bac Ninh', 'Ben Tre', 'Binh Dinh', 'Binh Duong', 'Binh Phuoc', 'Binh Thuan', 'Ca Mau', 'Cao Bang', 'Dak Lak', 'Dak Nong', 'Dien Bien', 'Dong Nai', 'Dong Thap', 'Gia Lai', 'Ha Giang', 'Ha Nam', 'Ha Tinh', 'Hai Duong', 'Hau Giang', 'Hoa Binh', 'Hung Yen', 'Khanh Hoa', 'Kien Giang', 'Kon Tum', 'Lai Chau', 'Lam Dong', 'Lang Son', 'Lao Cai', 'Long An', 'Nam Dinh', 'Nghe An', 'Ninh Binh', 'Ninh Thuan', 'Phu Tho', 'Phu Yen', 'Quang Binh', 'Quang Nam', 'Quang Ngai', 'Quang Ninh', 'Quang Tri', 'Soc Trang', 'Son La', 'Tay Ninh', 'Thai Binh', 'Thai Nguyen', 'Thanh Hoa', 'Thua Thien Hue', 'Tien Giang', 'Tra Vinh', 'Tuyen Quang', 'Vinh Long', 'Vinh Phuc', 'Yen Bai', 'Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho'],
    'Peru': ['Amazonas', 'Ancash', 'Apurimac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huanuco', 'Ica', 'Junin', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martin', 'Tacna', 'Tumbes', 'Ucayali'],
    'Greece': ['Attica', 'Central Greece', 'Central Macedonia', 'Crete', 'Eastern Macedonia and Thrace', 'Epirus', 'Ionian Islands', 'North Aegean', 'Peloponnese', 'South Aegean', 'Thessaly', 'Western Greece', 'Western Macedonia'],
    'Portugal': ['Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Azores', 'Madeira'],
    'Iraq': ['Baghdad', 'Basra', 'Maysan', 'Dhi Qar', 'Muthanna', 'Qadisiyyah', 'Babylon', 'Karbala', 'Najaf', 'Wasit', 'Saladin', 'Anbar', 'Nineveh', 'Dohuk', 'Erbil', 'Sulaymaniyah', 'Kirkuk', 'Diyala'],
    'Algeria': ['Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Algiers', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane'],
    'Kazakhstan': ['Almaty', 'Almaty Region', 'Aqmola', 'Aqtobe', 'Atyrau', 'East Kazakhstan', 'Mangystau', 'North Kazakhstan', 'Pavlodar', 'Qaraghandy', 'Qostanay', 'Qyzylorda', 'Shymkent', 'South Kazakhstan', 'Turkistan', 'West Kazakhstan', 'Zhambyl', 'Nur-Sultan'],
    'Qatar': ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Khor', 'Al Wakrah', 'Al Daayen', 'Madinat ash Shamal', 'Al Shahaniya'],
    'Kuwait': ['Ahmadi', 'Farwaniya', 'Hawalli', 'Jahra', 'Kuwait City', 'Mubarak Al-Kabeer'],
    'Ukraine': ['Cherkasy', 'Chernihiv', 'Chernivtsi', 'Dnipropetrovsk', 'Donetsk', 'Ivano-Frankivsk', 'Kharkiv', 'Kherson', 'Khmelnytskyi', 'Kiev', 'Kirovohrad', 'Luhansk', 'Lviv', 'Mykolaiv', 'Odessa', 'Poltava', 'Rivne', 'Sumy', 'Ternopil', 'Vinnytsia', 'Volyn', 'Zakarpattia', 'Zaporizhzhia', 'Zhytomyr', 'Crimea'],
    'Morocco': ['Tanger-Tetouan-Al Hoceima', 'Oriental', 'Fès-Meknès', 'Rabat-Salé-Kénitra', 'Béni Mellal-Khénifra', 'Casablanca-Settat', 'Marrakech-Safi', 'Drâa-Tafilalet', 'Souss-Massa', 'Guelmim-Oued Noun', 'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab'],
    'Ecuador': ['Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'],
    'Angola': ['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire']
  };

  const citiesByState = {
    // United States
    'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
    'Alaska': ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
    'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
    'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'],
    'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
    'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
    'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'St. Petersburg', 'Hialeah', 'Fort Lauderdale', 'Pembroke Pines', 'Cape Coral'],
    'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah'],
    'Hawaii': ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu'],
    'Idaho': ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
    'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville'],
    'Indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
    'Iowa': ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Waterloo'],
    'Kansas': ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe'],
    'Kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
    'Louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
    'Maine': ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
    'Maryland': ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie'],
    'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge'],
    'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing'],
    'Minnesota': ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'],
    'Mississippi': ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
    'Missouri': ['Kansas City', 'Saint Louis', 'Springfield', 'Independence', 'Columbia'],
    'Montana': ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'],
    'Nebraska': ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
    'Nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
    'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester'],
    'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison'],
    'New Mexico': ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica'],
    'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
    'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
    'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
    'Oklahoma': ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton'],
    'Oregon': ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
    'Rhode Island': ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
    'South Carolina': ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill'],
    'South Dakota': ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
    'Tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock'],
    'Utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
    'Vermont': ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland'],
    'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
    'West Virginia': ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown', 'Wheeling'],
    'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
    'Wyoming': ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs'],
    
    // Canada
    'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert'],
    'British Columbia': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford'],
    'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie'],
    'New Brunswick': ['Saint John', 'Moncton', 'Fredericton', 'Dieppe', 'Riverview'],
    'Newfoundland and Labrador': ['St. Johns', 'Mount Pearl', 'Corner Brook', 'Conception Bay South', 'Grand Falls-Windsor'],
    'Northwest Territories': ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchoko'],
    'Nova Scotia': ['Halifax', 'Sydney', 'Dartmouth', 'Truro', 'New Glasgow'],
    'Nunavut': ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Cambridge Bay'],
    'Ontario': ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Windsor', 'Kitchener', 'Mississauga', 'Brampton', 'Markham', 'Vaughan'],
    'Prince Edward Island': ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague'],
    'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Trois-Rivières', 'Terrebonne', 'Saint-Jean-sur-Richelieu'],
    'Saskatchewan': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current'],
    'Yukon': ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction', 'Mayo'],
    
    // United Kingdom
    'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester'],
    'Scotland': ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee', 'Stirling'],
    'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry'],
    'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor'],
    
    // Australia
    'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Maitland', 'Albury'],
    'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton'],
    'Queensland': ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba'],
    'Western Australia': ['Perth', 'Fremantle', 'Rockingham', 'Mandurah', 'Bunbury'],
    'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta'],
    'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Burnie', 'Kingston'],
    'Australian Capital Territory': ['Canberra', 'Gungahlin', 'Tuggeranong', 'Woden', 'Belconnen'],
    'Northern Territory': ['Darwin', 'Alice Springs', 'Palmerston', 'Katherine', 'Nhulunbuy'],
    
    // Germany
    'Baden-Württemberg': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg'],
    'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Würzburg', 'Ingolstadt', 'Fürth', 'Erlangen', 'Bayreuth', 'Bamberg'],
    'Berlin': ['Berlin'],
    'Brandenburg': ['Potsdam', 'Cottbus', 'Brandenburg', 'Frankfurt', 'Oranienburg'],
    'Bremen': ['Bremen', 'Bremerhaven'],
    'Hamburg': ['Hamburg'],
    'Hesse': ['Frankfurt am Main', 'Wiesbaden', 'Kassel', 'Darmstadt', 'Offenbach'],
    'Lower Saxony': ['Hanover', 'Braunschweig', 'Oldenburg', 'Osnabrück', 'Wolfsburg'],
    'Mecklenburg-Vorpommern': ['Rostock', 'Schwerin', 'Neubrandenburg', 'Stralsund', 'Greifswald'],
    'North Rhine-Westphalia': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg'],
    'Rhineland-Palatinate': ['Mainz', 'Ludwigshafen', 'Koblenz', 'Trier', 'Kaiserslautern'],
    'Saarland': ['Saarbrücken', 'Neunkirchen', 'Homburg', 'Völklingen', 'Sankt Ingbert'],
    'Saxony': ['Dresden', 'Leipzig', 'Chemnitz', 'Zwickau', 'Plauen'],
    'Saxony-Anhalt': ['Magdeburg', 'Halle', 'Dessau', 'Wittenberg', 'Stendal'],
    'Schleswig-Holstein': ['Kiel', 'Lübeck', 'Flensburg', 'Neumünster', 'Norderstedt'],
    'Thuringia': ['Erfurt', 'Jena', 'Gera', 'Weimar', 'Gotha'],
    
    // France
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Villeurbanne', 'Clermont-Ferrand'],
    'Bourgogne-Franche-Comté': ['Dijon', 'Besançon', 'Belfort', 'Chalon-sur-Saône', 'Nevers'],
    'Brittany': ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes'],
    'Centre-Val de Loire': ['Orléans', 'Tours', 'Bourges', 'Blois', 'Chartres'],
    'Corsica': ['Ajaccio', 'Bastia', 'Porto-Vecchio', 'Corte', 'Calvi'],
    'Grand Est': ['Strasbourg', 'Reims', 'Metz', 'Nancy', 'Mulhouse'],
    'Hauts-de-France': ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Calais'],
    'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil'],
    'Normandy': ['Le Havre', 'Rouen', 'Caen', 'Cherbourg', 'Évreux'],
    'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'La Rochelle'],
    'Occitanie': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers'],
    'Pays de la Loire': ['Nantes', 'Le Mans', 'Angers', 'Saint-Nazaire', 'Laval'],
    'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Antibes'],
    
    // India
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Jalgaon'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Udaipur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    
    // China
    'Beijing': ['Beijing', 'Chaoyang', 'Haidian', 'Fengtai', 'Shijingshan', 'Mentougou', 'Fangshan', 'Tongzhou', 'Shunyi', 'Changping'],
    'Shanghai': ['Shanghai', 'Pudong', 'Huangpu', 'Xuhui', 'Changning'],
    'Guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan'],
    'Jiangsu': ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou', 'Nantong'],
    'Shandong': ['Jinan', 'Qingdao', 'Yantai', 'Weifang', 'Zibo'],
    
    // Brazil
    'São Paulo': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José dos Campos'],
    'Rio de Janeiro': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói'],
    'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
    'Bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro'],
    'Paraná': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
    
    // Pakistan
    'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang'],
    'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas'],
    'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Dera Ismail Khan'],
    'Balochistan': ['Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Chaman'],
    'Islamabad Capital Territory': ['Islamabad', 'Rawalpindi'],
    
    // Bangladesh
    'Dhaka': ['Dhaka City', 'Gazipur', 'Narayanganj', 'Savar', 'Tongi', 'Keraniganj', 'Dohar', 'Nawabganj', 'Dhamrai', 'Manikganj'],
    'Chittagong': ['Chittagong', 'Coxs Bazar', 'Comilla', 'Brahmanbaria', 'Rangamati'],
    'Rajshahi': ['Rajshahi', 'Rangpur', 'Bogra', 'Pabna', 'Sirajganj'],
    'Khulna': ['Khulna', 'Jessore', 'Kushtia', 'Satkhira', 'Bagerhat'],
    'Barisal': ['Barisal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Jhalokati'],
    'Sylhet': ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
    'Rangpur': ['Rangpur', 'Dinajpur', 'Thakurgaon', 'Panchagarh', 'Nilphamari'],
    // Japan
    'Tokyo': ['Tokyo', 'Shibuya', 'Shinjuku', 'Harajuku', 'Ginza'],
    'Osaka': ['Osaka', 'Sakai', 'Higashiosaka', 'Hirakata', 'Toyonaka'],
    'Kanagawa': ['Yokohama', 'Kawasaki', 'Sagamihara', 'Fujisawa', 'Chigasaki'],
    'Aichi': ['Nagoya', 'Toyota', 'Okazaki', 'Ichinomiya', 'Kasugai'],
    'Hokkaido': ['Sapporo', 'Asahikawa', 'Hakodate', 'Kushiro', 'Tomakomai'],
    
    // Italy
    'Lombardy': ['Milan', 'Bergamo', 'Brescia', 'Monza', 'Como'],
    'Lazio': ['Rome', 'Latina', 'Frosinone', 'Viterbo', 'Rieti'],
    'Campania': ['Naples', 'Salerno', 'Caserta', 'Avellino', 'Benevento'],
    'Sicily': ['Palermo', 'Catania', 'Messina', 'Syracuse', 'Trapani'],
    'Veneto': ['Venice', 'Verona', 'Padua', 'Vicenza', 'Treviso'],
    
    // Spain
    'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés'],
    'Catalonia': ['Barcelona', 'Hospitalet', 'Terrassa', 'Badalona', 'Sabadell'],
    'Andalusia': ['Seville', 'Málaga', 'Córdoba', 'Granada', 'Jerez'],
    'Valencia': ['Valencia', 'Alicante', 'Elche', 'Castellón', 'Torrevieja'],
    'Basque Country': ['Bilbao', 'Vitoria', 'San Sebastián', 'Barakaldo', 'Getxo'],
    
    // South Korea
    'Seoul': ['Seoul', 'Gangnam', 'Gangdong', 'Gangbuk', 'Gangseo'],
    'Busan': ['Busan', 'Haeundae', 'Saha', 'Busanjin', 'Dongnae'],
    'Gyeonggi': ['Suwon', 'Seongnam', 'Goyang', 'Yongin', 'Bucheon'],
    'Incheon': ['Incheon', 'Namdong', 'Bupyeong', 'Seo', 'Yeonsu'],
    'Daegu': ['Daegu', 'Suseong', 'Dalseo', 'Buk', 'Jung'],
    
    // Russia
    'Moscow': ['Moscow', 'Balashikha', 'Khimki', 'Podolsk', 'Mytishchi'],
    'Saint Petersburg': ['Saint Petersburg', 'Kolpino', 'Pushkin', 'Kronstadt', 'Lomonosov'],
    'Novosibirsk': ['Novosibirsk', 'Berdsk', 'Iskitim', 'Ob', 'Krasnoobsk'],
    'Yekaterinburg': ['Yekaterinburg', 'Verkhnyaya Pyshma', 'Pervouralsk', 'Revda', 'Degtyarsk'],
    'Nizhny Novgorod': ['Nizhny Novgorod', 'Dzerzhinsk', 'Arzamas', 'Sarov', 'Bor'],
    
    // Mexico
    'Mexico City': ['Mexico City', 'Ecatepec', 'Guadalajara', 'Puebla', 'Tijuana'],
    'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonala', 'Puerto Vallarta'],
    'Nuevo León': ['Monterrey', 'Guadalupe', 'San Nicolás', 'Apodaca', 'General Escobedo'],
    'Puebla': ['Puebla', 'Tehuacán', 'San Martín Texmelucan', 'Atlixco', 'San Pedro Cholula'],
    'Guanajuato': ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato'],
    
    // Indonesia
    'Jakarta': ['Jakarta', 'Bekasi', 'Tangerang', 'Depok', 'Bogor'],
    'West Java': ['Bandung', 'Bekasi', 'Bogor', 'Cimahi', 'Sukabumi'],
    'East Java': ['Surabaya', 'Malang', 'Madiun', 'Kediri', 'Blitar'],
    'Central Java': ['Semarang', 'Surakarta', 'Salatiga', 'Pekalongan', 'Tegal'],
    'North Sumatra': ['Medan', 'Binjai', 'Tebing Tinggi', 'Pematangsiantar', 'Tanjungbalai'],
    
    // Netherlands
    'North Holland': ['Amsterdam', 'Haarlem', 'Zaanstad', 'Haarlemmermeer', 'Alkmaar'],
    'South Holland': ['The Hague', 'Rotterdam', 'Leiden', 'Zoetermeer', 'Dordrecht'],
    'Utrecht': ['Utrecht', 'Nieuwegein', 'Veenendaal', 'Houten', 'Zeist'],
    'North Brabant': ['Eindhoven', 'Tilburg', 'Breda', 's-Hertogenbosch', 'Helmond'],
    'Gelderland': ['Nijmegen', 'Arnhem', 'Apeldoorn', 'Ede', 'Zutphen'],
    
    // Saudi Arabia
    'Riyadh': ['Riyadh', 'Al Kharj', 'Dawadmi', 'Al Majmaah', 'Al Quwayiyah'],
    'Makkah': ['Mecca', 'Jeddah', 'Taif', 'Rabigh', 'Khulais'],
    'Eastern Province': ['Dammam', 'Al Khobar', 'Dhahran', 'Jubail', 'Al Qatif'],
    'Madinah': ['Medina', 'Yanbu', 'Al Ula', 'Badr', 'Khaybar'],
    'Asir': ['Abha', 'Khamis Mushait', 'Najran', 'Bisha', 'Muhayil'],
    
    // Turkey
    'Istanbul': ['Istanbul', 'Kadıköy', 'Maltepe', 'Pendik', 'Tuzla'],
    'Ankara': ['Ankara', 'Çankaya', 'Kecioren', 'Mamak', 'Sincan'],
    'Izmir': ['Izmir', 'Konak', 'Bornova', 'Buca', 'Karşıyaka'],
    'Bursa': ['Bursa', 'Osmangazi', 'Nilüfer', 'Yıldırım', 'BüyükOrhan'],
    'Antalya': ['Antalya', 'Kepez', 'Muratpaşa', 'Konyaaltı', 'Aksu'],
    
    // Additional major cities for other countries
    'Buenos Aires': ['Buenos Aires', 'La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil'],
    'Dublin': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford'],
    'Central District': ['Tel Aviv', 'Petah Tikva', 'Rishon LeZion', 'Holon', 'Bat Yam'],
    'Bangkok': ['Bangkok', 'Nonthaburi', 'Samut Prakan', 'Pathum Thani', 'Hat Yai'],
    'Lagos': ['Lagos', 'Ikeja', 'Ikorodu', 'Epe', 'Badagry'],
    'Cairo': ['Cairo', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez'],
    'Gauteng': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
    'Metro Manila': ['Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati'],
    'Uusimaa': ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen', 'Kerava'],
    'Santiago': ['Santiago', 'Puente Alto', 'Antofagasta', 'Viña del Mar', 'Valparaíso'],
    'Kuala Lumpur': ['Kuala Lumpur', 'Subang Jaya', 'Klang', 'Ampang', 'Shah Alam'],
    'Prague': ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec'],
    'Auckland': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
    'Bucharest': ['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Iasi', 'Constanta'],
    'Hanoi': ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho'],
    'Lima': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo'],
    'Attica': ['Athens', 'Piraeus', 'Peristeri', 'Kallithea', 'Nikaia'],
    'Lisboa': ['Lisbon', 'Porto', 'Amadora', 'Braga', 'Setubal'],
    'Baghdad': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Sulaymaniyah'],
    'Algiers': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida'],
    'Almaty': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Taraz'],
    'Doha': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Umm Salal', 'Al Khor'],
    'Kuwait City': ['Kuwait City', 'Hawalli', 'Salmiya', 'Sabah Al Salem', 'Jahra'],
    'Kiev': ['Kiev', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk'],
    'Casablanca-Settat': ['Casablanca', 'Rabat', 'Fes', 'Sale', 'Marrakech'],
    'Pichincha': ['Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala'],
    'Luanda': ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito']
  };

  const [loading, setLoading] = useState(false);

  const getStatesForCountry = (country) => statesByCountry[country] || [];
  const zipCodePatterns = {
    'United States': /^\d{5}(-\d{4})?$/,
    'Canada': /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
    'United Kingdom': /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
    'Germany': /^\d{5}$/,
    'France': /^\d{5}$/,
    'Australia': /^\d{4}$/,
    'India': /^\d{6}$/,
    'China': /^\d{6}$/,
    'Brazil': /^\d{5}-\d{3}$/,
    'Pakistan': /^\d{5}$/,
    'Bangladesh': /^\d{4}$/
  };

  const validateZipCode = (zipCode, country) => {
    if (!zipCode) return 'Required';
    const pattern = zipCodePatterns[country];
    if (pattern && !pattern.test(zipCode)) {
      const formats = {
        'United States': '12345 or 12345-6789',
        'Canada': 'A1A 1A1',
        'United Kingdom': 'SW1A 1AA',
        'Germany': '12345',
        'France': '75001',
        'Australia': '2000',
        'India': '110001',
        'China': '100000',
        'Brazil': '01310-100',
        'Pakistan': '44000',
        'Bangladesh': '1000'
      };
      return `Invalid format. Expected: ${formats[country] || 'Valid postal code'}`;
    }
    return '';
  };

  const getCitiesForState = (state) => citiesByState[state] || [];

  const validateUsername = (username) => {
    if (!username) return 'Required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-z0-9_]+$/.test(username)) return 'Username must be lowercase letters, numbers, and underscores only';
    if (/\s/.test(username)) return 'Username cannot contain spaces';
    return '';
  };

  const validateRegistrationId = (regId) => {
    if (!regId) return 'Required';
    if (!/^[A-Z]{2}\d{1,6}$/.test(regId)) return 'Registration ID must be 2 letters followed by up to 6 numbers (e.g. LW123456)';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    if (!/(?=.*[^\da-zA-Z])/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const validateMobileNumber = (number) => {
    if (!number) return 'Required';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) return 'Invalid phone number';
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    if (name === 'username') {
      processedValue = value.toLowerCase().replace(/\s/g, '');
    } else if (name === 'registrationId') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (name === 'mobileNumber') {
      processedValue = value.replace(/\D/g, '');
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : processedValue
      };
      
      // Reset dependent fields when country or state changes
      if (name === 'country') {
        newData.state = '';
        newData.city = '';
      } else if (name === 'state') {
        newData.city = '';
      }
      
      return newData;
    });
    
    if (name === 'password') {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    } else if (name === 'username') {
      const error = validateUsername(processedValue);
      setErrors(prev => ({ ...prev, username: error }));
    } else if (name === 'registrationId') {
      const error = validateRegistrationId(processedValue);
      setErrors(prev => ({ ...prev, registrationId: error }));
    } else if (name === 'zipCode') {
      const error = validateZipCode(processedValue, formData.country);
      setErrors(prev => ({ ...prev, zipCode: error }));
    } else if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = 'Required';
    const usernameError = validateUsername(data.username);
    if (usernameError) newErrors.username = usernameError;
    if (!data.address.trim()) newErrors.address = 'Required';
    if (!data.city.trim()) newErrors.city = 'Required';
    if (!data.state.trim()) newErrors.state = 'Required';
    if (!data.zipCode.trim()) newErrors.zipCode = 'Required';
    else {
      const zipError = validateZipCode(data.zipCode, data.country);
      if (zipError) newErrors.zipCode = zipError;
    }
    if (!data.country.trim()) newErrors.country = 'Required';
    const mobileError = validateMobileNumber(data.mobileNumber);
    if (mobileError) newErrors.mobileNumber = mobileError;
    if (!data.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email';
    const passwordError = validatePassword(data.password);
    if (passwordError) newErrors.password = passwordError;
    if (!data.acceptTerms) newErrors.acceptTerms = 'Required';

    if (userType === 'lawyer') {
      const regIdError = validateRegistrationId(data.registrationId);
      if (regIdError) newErrors.registrationId = regIdError;
      if (!data.firm.trim()) newErrors.firm = 'Required';
      if (!data.specialty.trim()) newErrors.specialty = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥 Button clicked! Current formData (safe):', {
      ...formData,
      password: formData.password ? '***' : '',
    });
    
    const trimmed = {
      ...formData,
      name: formData.name.trim(),
      username: formData.username.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      zipCode: (formData.zipCode || '').toString().trim(),
      mobileNumber: (formData.mobileNumber || '').toString().trim(),
      email: formData.email.trim().toLowerCase(),
    };

    if (validateForm(trimmed)) {
      setLoading(true);
      try {
        const payload = {
          name: trimmed.name,
          username: trimmed.username,
          email: trimmed.email,
          password: formData.password,
          address: trimmed.address,
          zipCode: trimmed.zipCode,
          zip_code: trimmed.zipCode,
          city: trimmed.city,
          state: trimmed.state,
          country: trimmed.country,
          mobileNumber: trimmed.mobileNumber,
          mobile_number: trimmed.mobileNumber,
        };

        if (userType === 'lawyer') {
          payload.registration_id = formData.registrationId?.trim();
          payload.law_firm = formData.firm?.trim();
          payload.speciality = formData.specialty?.trim();
        }

        console.log('📤 Sending request:', {
          ...payload,
          password: '***',
        });

        await api.post('/auth/register', payload);
        showToast.success('Registration successful! Please check your email for verification code.');
        onRegisterSuccess(trimmed.email);
      } catch (error) {
        const data = error?.response?.data;
        if (data?.errors && typeof data.errors === 'object') {
          setErrors(prev => ({ ...prev, ...data.errors }));
        }
        showToast.error(data?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };



  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create Account</h2>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="userType"
              checked={userType === 'user'}
              onChange={() => setUserType('user')}
              className="w-4 h-4 text-[#0EA5E9] focus:ring-[#0EA5E9]"
            />
            <span className="text-sm font-medium text-gray-700">User</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="userType"
              checked={userType === 'lawyer'}
              onChange={() => setUserType('lawyer')}
              className="w-4 h-4 text-[#0EA5E9] focus:ring-[#0EA5E9]"
            />
            <span className="text-sm font-medium text-gray-700">Lawyer</span>
          </label>
        </div>
      </div>

      {userType === 'user' && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">Username</label>
                <input id="username" type="text" name="username" value={formData.username} onChange={handleInputChange}
                  placeholder="e.g. john_doe123"
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">Address</label>
              <input id="address" type="text" name="address" value={formData.address} onChange={handleInputChange}
                className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-900 mb-2">Country</label>
                <select id="country" name="country" value={formData.country} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-2">State</label>
                <select id="state" name="state" value={formData.state} onChange={handleInputChange}
                  disabled={!formData.country}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:opacity-50">
                  <option value="">Select State</option>
                  {getStatesForCountry(formData.country).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">City</label>
                <input id="city" type="text" name="city" value={formData.city} onChange={handleInputChange}
                  placeholder="Enter your city"
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-900 mb-2">Zip Code</label>
                <input id="zipCode" type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-900 mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <select name="countryCode" value={formData.countryCode} onChange={handleInputChange}
                  className="w-32 px-2 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                  {countryCodes.map(c => (
                    <option key={c.code + c.country} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input id="mobileNumber" type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange}
                  placeholder="1234567890"
                  className="flex-1 px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
              </div>
              {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">Email</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="8+ characters"
                  className="w-full px-3 py-2.5 text-sm pr-10 bg-gray-200 border-0 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" name="acceptTerms" checked={formData.acceptTerms} onChange={handleInputChange}
                className="w-4 h-4 mt-0.5 text-[#0EA5E9] focus:ring-[#0EA5E9] rounded"/>
              <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
                Creating an account means you're okay with our Terms of Service, Privacy Policy, and our default Notification Settings.
              </label>
              {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}
            </div>

            <button type="submit" disabled={!formData.acceptTerms || loading}
              className="w-full py-3 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded text-sm transition-all">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {userType === 'lawyer' && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lawyer-name" className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                <input id="lawyer-name" type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="lawyer-username" className="block text-sm font-medium text-gray-900 mb-2">Username</label>
                <input id="lawyer-username" type="text" name="username" value={formData.username} onChange={handleInputChange}
                  placeholder="e.g. john_doe123"
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="lawyer-address" className="block text-sm font-medium text-gray-900 mb-2">Address</label>
              <input id="lawyer-address" type="text" name="address" value={formData.address} onChange={handleInputChange}
                className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lawyer-country" className="block text-sm font-medium text-gray-900 mb-2">Country</label>
                <select id="lawyer-country" name="country" value={formData.country} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
              <div>
                <label htmlFor="lawyer-state" className="block text-sm font-medium text-gray-900 mb-2">State</label>
                <select id="lawyer-state" name="state" value={formData.state} onChange={handleInputChange}
                  disabled={!formData.country}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:opacity-50">
                  <option value="">Select State</option>
                  {getStatesForCountry(formData.country).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lawyer-city" className="block text-sm font-medium text-gray-900 mb-2">City</label>
                <input id="lawyer-city" type="text" name="city" value={formData.city} onChange={handleInputChange}
                  placeholder="Enter your city"
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="lawyer-zipCode" className="block text-sm font-medium text-gray-900 mb-2">Zip Code</label>
                <input id="lawyer-zipCode" type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1.5fr] gap-4">
              <div>
                <label htmlFor="lawyer-mobileNumber" className="block text-sm font-medium text-gray-900 mb-2">Mobile Number</label>
                <div className="flex gap-2">
                  <select name="countryCode" value={formData.countryCode} onChange={handleInputChange}
                    className="w-24 px-1 py-2.5 text-xs bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                    {countryCodes.map(c => (
                      <option key={c.code + c.country} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input id="lawyer-mobileNumber" type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange}
                    placeholder="1234567890"
                    className="flex-1 px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                </div>
                {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
              </div>
              <div>
                <label htmlFor="registrationId" className="block text-sm font-medium text-gray-900 mb-2">Registration ID</label>
                <input id="registrationId" type="text" name="registrationId" value={formData.registrationId} onChange={handleInputChange}
                  placeholder="LW123456"
                  maxLength="8"
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.registrationId && <p className="text-red-500 text-xs mt-1">{errors.registrationId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1.5fr] gap-4">
              <div>
                <label htmlFor="lawyer-email" className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                <input id="lawyer-email" type="email" name="email" value={formData.email} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="firm" className="block text-sm font-medium text-gray-900 mb-2">Law Firm</label>
                <select id="firm" name="firm" value={formData.firm} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                  <option value="">Select Law Firm</option>
                  {lawFirms.map(firm => (
                    <option key={firm} value={firm}>{firm}</option>
                  ))}
                </select>
                {errors.firm && <p className="text-red-500 text-xs mt-1">{errors.firm}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1.5fr] gap-4">
              <div>
                <label htmlFor="lawyer-password" className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="lawyer-password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="8+ characters"
                    className="w-full px-3 py-2.5 text-sm pr-10 bg-gray-200 border-0 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-900 mb-2">Specialty</label>
                <select id="specialty" name="specialty" value={formData.specialty} onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-gray-200 border-0 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                  <option value="">Select Specialty</option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
                {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}
              </div>
            </div>
          </div>

            <div className="mt-5 space-y-4">
            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms-lawyer" name="acceptTerms" checked={formData.acceptTerms} onChange={handleInputChange}
                className="w-4 h-4 mt-0.5 text-[#0EA5E9] focus:ring-[#0EA5E9] rounded"/>
              <label htmlFor="terms-lawyer" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
                Creating an account means you're okay with our Terms of Service, Privacy Policy, and our default Notification Settings.
              </label>
              {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}
            </div>

            <button type="submit" disabled={!formData.acceptTerms || loading}
              className="w-full py-3 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded text-sm transition-all">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-400 font-medium">OR</span>
        </div>
      </div>

      {/* Google OAuth Button */}
      <div className="space-y-3">
        <GoogleLogin 
          role={userType}
          className="w-full py-3 px-4 border-2 border-gray-300 rounded-md flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
        >
          Continue with Google as {userType === 'lawyer' ? 'Lawyer' : 'User'}
        </GoogleLogin>
      </div>

      {/* Sign In Link */}
      <div className="text-center pt-4">
        <p className="text-gray-600 text-sm">
          Already a member?{' '}
          <button
            onClick={onSwitchToLogin}
            type="button"
            className="text-[#0EA5E9] font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
