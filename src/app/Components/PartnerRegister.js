"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Wrench,
  User,
  MapPin,
  Briefcase,
  Camera,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Star,
  Clock,
  Award,
  AlertCircle,
  Loader2,
  Home,
  Building2,
  Globe,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Wind,
  Wrench as Tool,
  Search
} from 'lucide-react';

const PartnerRegister = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    photo: null,
    
    // Step 2: Professional Info
    category: '',
    profession: '',
    experience: '',
    dailyRate: '',
    skills: [],
    description: '',
    certificates: [],
    
    // Step 3: Service Areas
    serviceAreas: [],
    city: '',
    district: '',
    maxDistance: '30',
    emergencyAvailable: false,
    
    // Step 4: Verification
    nicFront: null,
    nicBack: null,
    policeReport: null,
    insurance: false,
    terms: false
  });

  // Auto-fill from Google session
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        email: prev.email || session.user.email,
        fullName: prev.fullName || session.user?.name || ''
      }));
    }
  }, [session]);

  const [skillInput, setSkillInput] = useState('');
  const [areaInput, setAreaInput] = useState('');

  // Categories
  const categories = [
    { id: 'electrician', name: 'Electrician', icon: <Zap />, count: 124 },
    { id: 'plumber', name: 'Plumber', icon: <Droplets />, count: 98 },
    { id: 'mason', name: 'Mason', icon: <Hammer />, count: 87 },
    { id: 'carpenter', name: 'Carpenter', icon: <Tool />, count: 76 },
    { id: 'painter', name: 'Painter', icon: <Paintbrush />, count: 65 },
    { id: 'ac', name: 'AC Technician', icon: <Wind />, count: 43 }
  ];

  // Districts and Cities Data
  const districtCityData = {
    'Colombo': [
      'Colombo 01', 'Colombo 02', 'Colombo 03', 'Colombo 04', 'Colombo 05', 
      'Colombo 06', 'Colombo 07', 'Colombo 08', 'Colombo 09', 'Colombo 10',
      'Colombo 11', 'Colombo 12', 'Colombo 13', 'Colombo 14', 'Colombo 15',
      'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Kesbewa', 'Maharagama',
      'Boralesgamuwa', 'Piliyandala', 'Kotte', 'Nugegoda', 'Rajagiriya',
      'Battaramulla', 'Thalawathugoda', 'Pannipitiya', 'Kohuwala', 'Wellawatta',
      'Bambalapitiya', 'Kollupitiya', 'Havelock Town', 'Kirulapona', 'Dematagoda'
    ],
    'Gampaha': [
      'Gampaha', 'Negombo', 'Kadawatha', 'Kiribathgoda', 'Wattala', 'Ja-Ela',
      'Kandana', 'Ragama', 'Kelaniya', 'Mabole', 'Hendala', 'Welisara',
      'Seeduwa', 'Katunayake', 'Divulapitiya', 'Minuwangoda', 'Veyangoda',
      'Nittambuwa', 'Yakkala', 'Pasyala', 'Mirigama', 'Ganemulla', 'Bopitiya'
    ],
    'Kalutara': [
      'Kalutara', 'Panadura', 'Horana', 'Bandaragama', 'Aluthgama', 'Beruwala',
      'Matugama', 'Wadduwa', 'Waskaduwa', 'Pinwatta', 'Katukurunda', 'Moronthuduwa',
      'Payagala', 'Maggona', 'Agalawatta', 'Baduraliya', 'Bulathsinhala', 'Palindanuwara'
    ],
    'Kandy': [
      'Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Nawalapitiya',
      'Wattegama', 'Teldeniya', 'Kundasale', 'Mahanuwara', 'Akurana',
      'Matale', 'Galagedara', 'Harispattuwa', 'Pathadumbara', 'Udadumbara',
      'Medadumbara', 'Yatinuwara', 'Udunuwara', 'Doluwa', 'Pujapitiya'
    ],
    'Matale': [
      'Matale', 'Dambulla', 'Sigiriya', 'Naula', 'Galewela',
      'Rattota', 'Wilgamuwa', 'Ukuwela', 'Pallepola', 'Yatawatta',
      'Ambanganga', 'Laggala', 'Pallegama'
    ],
    'Nuwara Eliya': [
      'Nuwara Eliya', 'Hatton', 'Talawakele', 'Maskeliya', 'Nanu Oya',
      'Lindula', 'Dickoya', 'Norwood', 'Bogawantalawa', 'Kotagala',
      'Ginigathena', 'Rikillagaskada', 'Hanguranketha', 'Walapane'
    ],
    'Galle': [
      'Galle', 'Ambalangoda', 'Hikkaduwa', 'Unawatuna', 'Bentota',
      'Ahungalla', 'Kosgoda', 'Induruwa', 'Mihiripenna', 'Thalpe',
      'Baddegama', 'Elpitiya', 'Neluwa', 'Nagoda', 'Habaraduwa',
      'Yakkalamulla', 'Karandeniya', 'Balapitiya'
    ],
    'Matara': [
      'Matara', 'Weligama', 'Mirissa', 'Dickwella', 'Tangalle',
      'Hakmana', 'Kamburupitiya', 'Akuressa', 'Deniyaya', 'Pasgoda',
      'Pitabeddara', 'Thihagoda', 'Malimbada', 'Kotapola'
    ],
    'Hambantota': [
      'Hambantota', 'Tangalle', 'Ambalantota', 'Tissamaharama', 'Beliatta',
      'Weeraketiya', 'Katuwana', 'Lunugamvehera', 'Sooriyawewa', 'Angunukolapelessa'
    ],
    'Jaffna': [
      'Jaffna', 'Nallur', 'Chavakachcheri', 'Point Pedro', 'Kayts',
      'Karainagar', 'Velanai', 'Tellippalai', 'Kopay', 'Uduvil',
      'Chankanai', 'Mallakam', 'Vaddukoddai', 'Pungudutivu'
    ],
    'Kilinochchi': [
      'Kilinochchi', 'Paranthan', 'Poonakary', 'Kandavalai', 'Karachchi',
      'Pallai', 'Iranamadu'
    ],
    'Mannar': [
      'Mannar', 'Madhu', 'Nanattan', 'Pesalai', 'Silawathura',
      'Adampan', 'Murunkan', 'Tharapuram'
    ],
    'Vavuniya': [
      'Vavuniya', 'Nedunkeni', 'Cheddikulam', 'Vavuniya South', 'Vavuniya North',
      'Palamoddai', 'Mulliyan', 'Omanthai'
    ],
    'Mullaitivu': [
      'Mullaitivu', 'Puthukkudiyiruppu', 'Oddusuddan', 'Welioya', 'Visvamadu',
      'Mankulam', 'Kokkilai'
    ],
    'Batticaloa': [
      'Batticaloa', 'Kattankudy', 'Eravur', 'Chenkalady', 'Valaichchenai',
      'Vavunathivu', 'Oddamavadi', 'Paddiruppu', 'Kaluwanchikudy', 'Kiran'
    ],
    'Ampara': [
      'Ampara', 'Kalmunai', 'Sainthamaruthu', 'Karaitivu', 'Nintavur',
      'Addalaichenai', 'Pottuvil', 'Akkaraipattu', 'Samanthurai', 'Damana',
      'Dehiattakandiya', 'Mahaoya', 'Uhana'
    ],
    'Trincomalee': [
      'Trincomalee', 'Kinniya', 'Muttur', 'Kantalai', 'Gomarankadawala',
      'Nilaveli', 'Uppuveli', 'Sampur', 'Eachchilampattu', 'Pulmoddai'
    ],
    'Kurunegala': [
      'Kurunegala', 'Kuliyapitiya', 'Puttalam', 'Chilaw', 'Narammala',
      'Mawathagama', 'Polgahawela', 'Wariyapola', 'Nikaweratiya', 'Hettipola',
      'Ibbagamuwa', 'Alawwa', 'Giriulla', 'Dandagamuwa', 'Bingiriya'
    ],
    'Puttalam': [
      'Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Madampe',
      'Nattandiya', 'Dankotuwa', 'Lunuwila', 'Anamaduwa', 'Nawagattegama',
      'Karuwalagaswewa', 'Kalpitiya', 'Mampuri'
    ],
    'Anuradhapura': [
      'Anuradhapura', 'Mihintale', 'Kekirawa', 'Tambuttegama', 'Eppawala',
      'Galenbindunuwewa', 'Rambewa', 'Medawachchiya', 'Padaviya', 'Kahatagasdigiliya',
      'Nochchiyagama', 'Thalawa', 'Ipalogama', 'Palugaswewa'
    ],
    'Polonnaruwa': [
      'Polonnaruwa', 'Kaduruwela', 'Hingurakgoda', 'Medirigiriya', 'Aralaganwila',
      'Dimbulagala', 'Lankapura', 'Welikanda', 'Pulasthigama', 'Sevanapitiya'
    ],
    'Badulla': [
      'Badulla', 'Bandarawela', 'Haputale', 'Welimada', 'Ella',
      'Passara', 'Mahiyanganaya', 'Diyatalawa', 'Lunugala', 'Meegahakiula',
      'Hali-Ela', 'Spring Valley', 'Demodara', 'Kendagolla'
    ],
    'Moneragala': [
      'Moneragala', 'Bibile', 'Wellawaya', 'Buttala', 'Kataragama',
      'Siyambalanduwa', 'Madulla', 'Medagama', 'Thanamalvila', 'Ethimale'
    ],
    'Ratnapura': [
      'Ratnapura', 'Embilipitiya', 'Balangoda', 'Eheliyagoda', 'Kuruwita',
      'Pelmadulla', 'Kahawatta', 'Ayagama', 'Nivitigala', 'Kalawana',
      'Opanayake', 'Godakawela', 'Weligepola', 'Imbulpe'
    ],
    'Kegalle': [
      'Kegalle', 'Mawanella', 'Rambukkana', 'Warakapola', 'Aranayaka',
      'Yatiyantota', 'Deraniyagala', 'Galigamuwa', 'Hemmathagama', 'Ruwanwella',
      'Bulathkohupitiya', 'Dehiowita', 'Karawanella'
    ]
  };

  // Get cities for selected district
  const getCitiesForDistrict = () => {
    if (!formData.district) return [];
    return districtCityData[formData.district] || [];
  };

  // Filter cities based on search
  const getFilteredCities = () => {
    const cities = getCitiesForDistrict();
    if (!citySearch.trim()) return cities;
    return cities.filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase())
    );
  };

  // Experience levels
  const experienceLevels = [
    'Less than 1 year',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10-15 years',
    '15+ years'
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear city when district changes
    if (name === 'district') {
      setFormData(prev => ({ ...prev, city: '' }));
      setCitySearch('');
    }
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySearch(city);
    setShowCitySuggestions(false);
  };

  // Handle file uploads
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
      
      // Set upload progress (simulated)
      setUploadProgress(prev => ({
        ...prev,
        [field]: 100
      }));
    }
  };

  // Handle multiple file uploads for certificates
  const handleCertificatesUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      alert('Some files exceed 5MB limit and were not added');
    }
    
    setFormData(prev => ({
      ...prev,
      certificates: [...prev.certificates, ...validFiles]
    }));
  };

  // Remove certificate
  const removeCertificate = (index) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  // Add skill
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  // Remove skill
  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Add service area
  const addServiceArea = () => {
    if (areaInput.trim() && !formData.serviceAreas.includes(areaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, areaInput.trim()]
      }));
      setAreaInput('');
    }
  };

  // Remove service area
  const removeServiceArea = (area) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(a => a !== area)
    }));
  };

  // Validate current step
  const validateStep = () => {
    switch(currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.phone && 
               formData.password && formData.password === formData.confirmPassword &&
               formData.password.length >= 6;
      case 2:
        return formData.category && formData.profession && formData.experience && 
               formData.dailyRate && formData.skills.length > 0;
      case 3:
        return formData.serviceAreas.length > 0 && formData.city && formData.district;
      case 4:
        return formData.nicFront && formData.nicBack && formData.terms;
      default:
        return true;
    }
  };

  // Handle next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo(0, 0);
    }
  };

  // Handle previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Step 1: Personal Info
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('password', formData.password);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }
      
      // Step 2: Professional Info
      formDataToSend.append('category', formData.category);
      formDataToSend.append('profession', formData.profession);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('dailyRate', formData.dailyRate);
      formDataToSend.append('skills', JSON.stringify(formData.skills));
      formDataToSend.append('description', formData.description || '');
      
      // Append certificates
      if (formData.certificates && formData.certificates.length > 0) {
        formData.certificates.forEach(file => {
          formDataToSend.append('certificates', file);
        });
      }
      
      // Step 3: Service Areas
      formDataToSend.append('serviceAreas', JSON.stringify(formData.serviceAreas));
      formDataToSend.append('city', formData.city);
      formDataToSend.append('district', formData.district);
      formDataToSend.append('maxDistance', formData.maxDistance);
      formDataToSend.append('emergencyAvailable', formData.emergencyAvailable);
      
      // Step 4: Verification
      if (formData.nicFront) {
        formDataToSend.append('nicFront', formData.nicFront);
      }
      if (formData.nicBack) {
        formDataToSend.append('nicBack', formData.nicBack);
      }
      if (formData.policeReport) {
        formDataToSend.append('policeReport', formData.policeReport);
      }
      formDataToSend.append('insurance', formData.insurance);
      
      // Send to API
      const response = await fetch('/api/partner/register', {
        method: 'POST',
        body: formDataToSend,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store provider ID in session storage for success page
        sessionStorage.setItem('providerId', data.providerId);
        router.push('/partner/success');
      } else {
        alert(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Progress percentage
  const progressPercentage = (currentStep / 4) * 100;

  // Render step indicators
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Personal Info', icon: <User size={18} /> },
      { number: 2, title: 'Professional', icon: <Briefcase size={18} /> },
      { number: 3, title: 'Service Areas', icon: <MapPin size={18} /> },
      { number: 4, title: 'Verification', icon: <ShieldCheck size={18} /> }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex-1 text-center relative">
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all ${
                currentStep > step.number 
                  ? 'bg-green-500 text-white'
                  : currentStep === step.number
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.number ? <CheckCircle2 size={20} /> : step.icon}
              </div>
              <div className="text-xs mt-2 font-medium hidden sm:block text-gray-600">
                {step.title}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Render Step 1: Personal Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-950 mb-6">Personal Information</h2>
      
      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          placeholder="As per NIC"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      
      {/* Email and Phone */}
      {/* Email and Phone */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              readOnly={!!session?.user?.email}
              placeholder="e.g. yourname@gmail.com"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                session?.user?.email ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
              }`}
            />
          </div>
          {session?.user?.email ? (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={12} /> Google account email use karanawa
            </p>
          ) : (
            <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1">
              💡 <span>Use <span className="font-mono bg-blue-50 px-1 rounded">yourname+service@gmail.com</span> to register multiple services with one Gmail</span>
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="07X XXX XXXX"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>
      
      {/* Password and Confirm Password */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
          )}
        </div>
      </div>
      
      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            {formData.photo ? (
              <img src={URL.createObjectURL(formData.photo)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Camera size={24} className="text-gray-400" />
            )}
          </div>
          <div>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'photo')}
              className="hidden"
            />
            <label
              htmlFor="photo"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl cursor-pointer transition"
            >
              <Upload size={18} />
              Upload Photo
            </label>
            <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 5MB</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 2: Professional Info
  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-950 mb-6">Professional Information</h2>
      
      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Service Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
              className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition ${
                formData.category === cat.id
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className={formData.category === cat.id ? 'text-orange-600' : 'text-gray-500'}>
                {cat.icon}
              </div>
              <span className="text-sm font-medium">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat.count} active</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Profession Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Profession Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="profession"
          value={formData.profession}
          onChange={handleInputChange}
          placeholder="e.g., Master Electrician, Plumbing Expert"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      
      {/* Experience and Rate */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <select
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select experience</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Daily Rate (LKR) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="dailyRate"
            value={formData.dailyRate}
            onChange={handleInputChange}
            placeholder="e.g., 2500"
            min="500"
            step="100"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
      
      {/* Skills */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Skills <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add a skill (e.g., Wiring)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={addSkill}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-xl transition"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[60px] bg-gray-50 p-3 rounded-xl">
          {formData.skills.length > 0 ? (
            formData.skills.map((skill) => (
              <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-red-500">
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400 w-full text-center py-2">Add at least one skill</p>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Professional Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows="4"
          placeholder="Tell customers about your experience, specializations, and what makes you unique..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        ></textarea>
      </div>
      
      {/* Certificates */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Professional Certificates (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <input
            type="file"
            id="certificates"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleCertificatesUpload}
            className="hidden"
          />
          <label htmlFor="certificates" className="cursor-pointer">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload certificates</p>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB each)</p>
          </label>
          
          {formData.certificates.length > 0 && (
            <div className="mt-4 text-left space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Uploaded:</p>
              {formData.certificates.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-600 truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <button onClick={() => removeCertificate(idx)} className="text-red-500 hover:text-red-700">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Step 3: Service Areas
  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-950 mb-6">Service Areas</h2>
      
      {/* District and City with Search */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            District <span className="text-red-500">*</span>
          </label>
          <select
            name="district"
            value={formData.district}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select district</option>
            {Object.keys(districtCityData).sort().map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City/Town <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCitySuggestions(true);
                if (!e.target.value) {
                  setFormData(prev => ({ ...prev, city: '' }));
                }
              }}
              onFocus={() => setShowCitySuggestions(true)}
              placeholder={formData.district ? "Type to search cities..." : "Select a district first"}
              disabled={!formData.district}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          {/* City Suggestions Dropdown */}
          {showCitySuggestions && formData.district && getFilteredCities().length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {getFilteredCities().map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full text-left px-4 py-2 hover:bg-orange-50 transition flex items-center gap-2"
                >
                  <MapPin size={14} className="text-gray-400" />
                  <span>{city}</span>
                </button>
              ))}
            </div>
          )}
          
          {formData.city && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Selected: {formData.city}
            </p>
          )}
        </div>
      </div>
      
      {/* Service Areas */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Areas You Serve <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
            placeholder="Add an area (e.g., Colombo 03, Dehiwala)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={addServiceArea}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-xl transition"
          >
            Add
          </button>
        </div>
        
        {/* Suggested Areas based on District */}
        {formData.district && formData.city && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Suggested areas in {formData.district}:</p>
            <div className="flex flex-wrap gap-2">
              {getCitiesForDistrict().slice(0, 5).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    if (!formData.serviceAreas.includes(city)) {
                      setFormData(prev => ({
                        ...prev,
                        serviceAreas: [...prev.serviceAreas, city]
                      }));
                    }
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition"
                >
                  + {city}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 min-h-[100px] bg-gray-50 p-4 rounded-xl">
          {formData.serviceAreas.length > 0 ? (
            formData.serviceAreas.map((area) => (
              <span key={area} className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-1">
                <MapPin size={12} />
                {area}
                <button onClick={() => removeServiceArea(area)} className="hover:text-red-500">
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-400 w-full text-center py-4">
              Add the areas where you provide services
            </p>
          )}
        </div>
      </div>
      
      {/* Maximum Distance */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Maximum Travel Distance
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            name="maxDistance"
            min="5"
            max="100"
            step="5"
            value={formData.maxDistance}
            onChange={handleInputChange}
            className="flex-1"
          />
          <span className="bg-gray-100 px-4 py-2 rounded-lg font-medium">{formData.maxDistance} km</span>
        </div>
      </div>
      
      {/* Emergency Service */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="emergencyAvailable"
            checked={formData.emergencyAvailable}
            onChange={handleInputChange}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
          />
          <div>
            <span className="font-semibold text-gray-900">Available for 24/7 Emergency Services</span>
            <p className="text-sm text-gray-600">Check this if you can respond to emergency calls outside regular hours</p>
          </div>
        </label>
      </div>
    </div>
  );

  // Render Step 4: Verification
  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-950 mb-6">Verification Documents</h2>
      
      {/* NIC Front */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          NIC Front (Image) <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <input
            type="file"
            id="nicFront"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'nicFront')}
            className="hidden"
          />
          <label htmlFor="nicFront" className="cursor-pointer">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {formData.nicFront ? formData.nicFront.name : 'Click to upload NIC front side'}
            </p>
          </label>
          {formData.nicFront && (
            <p className="text-xs text-green-600 mt-2">✓ File selected</p>
          )}
        </div>
      </div>
      
      {/* NIC Back */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          NIC Back (Image) <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <input
            type="file"
            id="nicBack"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'nicBack')}
            className="hidden"
          />
          <label htmlFor="nicBack" className="cursor-pointer">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {formData.nicBack ? formData.nicBack.name : 'Click to upload NIC back side'}
            </p>
          </label>
          {formData.nicBack && (
            <p className="text-xs text-green-600 mt-2">✓ File selected</p>
          )}
        </div>
      </div>
      
      {/* Police Report (Optional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Police Report (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <input
            type="file"
            id="policeReport"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(e, 'policeReport')}
            className="hidden"
          />
          <label htmlFor="policeReport" className="cursor-pointer">
            <ShieldCheck size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {formData.policeReport ? formData.policeReport.name : 'Upload police report for extra trust badge'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Recommended for "Top Rated" badge</p>
          </label>
        </div>
      </div>
      
      {/* Insurance */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="insurance"
            checked={formData.insurance}
            onChange={handleInputChange}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
          />
          <div>
            <span className="font-semibold text-gray-900">I have professional insurance</span>
            <p className="text-sm text-gray-600">Check this if you have liability insurance (gets you priority visibility)</p>
          </div>
        </label>
      </div>
      
      {/* Terms */}
      <div className="bg-orange-50 p-6 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleInputChange}
            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 mt-1"
          />
          <div>
            <span className="font-semibold text-gray-900">I agree to the Terms & Conditions <span className="text-red-500">*</span></span>
            <p className="text-sm text-gray-600 mt-1">
              I confirm that the information provided is accurate and I understand that false information may lead to account suspension.
            </p>
          </div>
        </label>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Verification takes 24-48 hours</p>
          <p>Our team will review your documents and verify your profile. You'll receive an email once your profile is live.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Wrench size={20} />
            </div>
            <span className="text-xl font-extrabold text-blue-900">
              HelpNow <span className="text-orange-500">SL</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              disabled={currentStep === 1}
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!validateStep()}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition ${
                  validateStep()
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !validateStep()}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition ${
                  validateStep()
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>
    </div>
  );
};

export default PartnerRegister;