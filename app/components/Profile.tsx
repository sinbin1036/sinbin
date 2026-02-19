'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import {
  ArrowLeft, User, MapPin, Moon, Sun, Edit2, Upload, X, Camera, Image,
  Search, Navigation, Loader2, AlertCircle, Thermometer, LogIn, UserPlus
} from 'lucide-react';
import { BackgroundSelector, BackgroundSelection } from './BackgroundSelector';
import { useBackground } from '../lib/useBackground';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface WeatherAPICity {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}

const WEATHER_API_KEY = 'b93e335c0d074c2ca9874431250506';

interface ProfileProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onBack: () => void;
  onShowAuth: (mode?: 'login' | 'signup') => void;
}

export function Profile({ isAuthenticated, onLogout, onBack, onShowAuth }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'background' | 'location' | 'profile'>('background');
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [guestLocation, setGuestLocation] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WeatherAPICity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  const [originalUseFahrenheit, setOriginalUseFahrenheit] = useState(true);
  const [hasLocationChanged, setHasLocationChanged] = useState(false);
  const [hasTemperatureChanged, setHasTemperatureChanged] = useState(false);

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string>('');

  const { background, saveBackground, clearBackground } = useBackground(isAuthenticated);

  const displayLocation = isAuthenticated ? location : guestLocation;

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const savedGuestLocation = localStorage.getItem('guestLocation');
      if (savedGuestLocation) setGuestLocation(savedGuestLocation);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            setUserProfile(profile || { id: user.id, email: user.email });
            setEmail(user.email || '');
            setUsername((profile as Record<string, unknown>)?.username as string || '');
            setPhoneNumber((profile as Record<string, unknown>)?.phone as string || '');
            setLocation((profile as Record<string, unknown>)?.location as string || '');
            setCurrentProfilePhotoUrl((profile as Record<string, unknown>)?.profile_photo_url as string || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile');
        }
      };
      fetchProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'location') {
      const loadTemperaturePreference = async () => {
        if (isAuthenticated) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('use_fahrenheit')
                .eq('id', user.id)
                .single();
              if (profile?.use_fahrenheit != null) {
                setUseFahrenheit(profile.use_fahrenheit);
                setOriginalUseFahrenheit(profile.use_fahrenheit);
              }
            }
          } catch (error) {
            console.error('Error loading temperature preference:', error);
          }
        } else {
          const saved = localStorage.getItem('useFahrenheit');
          if (saved !== null) {
            const savedValue = saved === 'true';
            setUseFahrenheit(savedValue);
            setOriginalUseFahrenheit(savedValue);
          }
        }
      };
      loadTemperaturePreference();
      setHasLocationChanged(false);
      setHasTemperatureChanged(false);
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data: WeatherAPICity[] = await response.json();
          setSearchResults(data.slice(0, 10));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleDarkModeToggle = async (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    if (isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            is_dark_mode: checked,
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error saving dark mode preference:', error);
      }
    }
  };

  const handleBackgroundSelect = async (selection: BackgroundSelection) => {
    const success = await saveBackground(selection);
    if (success) {
      toast.success('Background updated successfully');
    } else {
      toast.error('Failed to save background');
    }
  };

  const handleBackgroundClear = async () => {
    await clearBackground();
    toast.success('Background reset to default');
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview('');
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    setHasLocationChanged(true);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }
    setIsGettingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
          );
          if (response.ok) {
            const data = await response.json();
            const cityName = data.location.name;
            setSearchQuery(cityName);
            setSelectedCity(cityName);
            setHasLocationChanged(true);
            toast.success(`Location detected: ${cityName}, ${data.location.country}`);
          } else {
            throw new Error('Failed to get location details');
          }
        } catch {
          setLocationError('Failed to get location details. Please try manual search.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions or search manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable. Please search manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again or search manually.');
            break;
          default:
            setLocationError('Failed to get your location. Please search manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleTemperatureUnitToggle = async (checked: boolean) => {
    setUseFahrenheit(checked);
    setHasTemperatureChanged(checked !== originalUseFahrenheit);
    if (isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            use_fahrenheit: checked,
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error saving temperature preference:', error);
      }
    } else {
      localStorage.setItem('useFahrenheit', checked.toString());
    }
    window.dispatchEvent(new CustomEvent('temperatureUnitChanged', { detail: checked }));
  };

  const handleLocationSave = async () => {
    if (!hasLocationChanged && !hasTemperatureChanged) {
      toast.error('No changes to save');
      return;
    }
    if (hasLocationChanged && !selectedCity) {
      toast.error('Please select a city');
      return;
    }
    try {
      if (hasLocationChanged) {
        if (isAuthenticated) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user found');
          const { error } = await supabase.from('profiles').update({ location: selectedCity }).eq('id', user.id);
          if (error) throw error;
          setLocation(selectedCity);
        } else {
          localStorage.setItem('guestLocation', selectedCity);
          setGuestLocation(selectedCity);
          window.dispatchEvent(new CustomEvent('guestLocationUpdate', { detail: selectedCity }));
        }
      }
      setHasLocationChanged(false);
      setHasTemperatureChanged(false);
      setSelectedCity('');
      setSearchQuery('');
      setSearchResults([]);
      setLocationError('');

      if (hasLocationChanged && hasTemperatureChanged) {
        toast.success('Location and temperature settings updated');
      } else if (hasLocationChanged) {
        toast.success(`Location updated to ${selectedCity}`);
      } else if (hasTemperatureChanged) {
        toast.success('Temperature unit updated');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location. Please try again.');
    }
  };

  const formatCityDisplay = (city: WeatherAPICity) => {
    if (city.region && city.region !== city.name) {
      return `${city.name}, ${city.region}, ${city.country}`;
    }
    return `${city.name}, ${city.country}`;
  };

  const uploadProfilePhoto = async (userId: string): Promise<string | null> => {
    if (!profilePhoto) return null;
    try {
      const fileExt = profilePhoto.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, profilePhoto, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return;
    setIsLoading(true);
    try {
      let photoUrl = currentProfilePhotoUrl;
      if (profilePhoto) {
        try {
          photoUrl = await uploadProfilePhoto(userProfile.id as string) || photoUrl;
        } catch {
          toast.error('Failed to upload profile photo. Other changes will still be saved.');
        }
      }
      const { error } = await supabase.from('profiles').upsert({
        id: userProfile.id,
        username: username || null,
        phone: phoneNumber || null,
        email,
        location: location || null,
        profile_photo_url: photoUrl || null,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setUserProfile({ ...userProfile, username, phone: phoneNumber, email, location, profile_photo_url: photoUrl });
      setCurrentProfilePhotoUrl(photoUrl || '');
      setProfilePhoto(null);
      setProfilePhotoPreview('');
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername((userProfile?.username as string) || '');
    setPhoneNumber((userProfile?.phone as string) || '');
    setEmail((userProfile?.email as string) || '');
    setLocation((userProfile?.location as string) || '');
    setProfilePhoto(null);
    setProfilePhotoPreview('');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const avatarImageSrc = profilePhotoPreview || currentProfilePhotoUrl;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-auto hover:bg-background/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-background">
                    <AvatarImage src={avatarImageSrc} className="object-cover" />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {isAuthenticated
                        ? (userProfile?.username as string)?.charAt(0)?.toUpperCase() ||
                          (userProfile?.email as string)?.charAt(0)?.toUpperCase() || 'U'
                        : 'G'}
                    </AvatarFallback>
                  </Avatar>
                  {isAuthenticated && isEditing && (
                    <div
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                      onClick={() => document.getElementById('profilePhotoEdit')?.click()}
                    >
                      <Camera className="h-6 w-6 text-white" />
                      <Input
                        id="profilePhotoEdit"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-foreground">
                    {isAuthenticated
                      ? (userProfile?.username ? `@${userProfile.username}` : 'Profile')
                      : 'Settings'}
                  </h1>
                  <p className="text-muted-foreground">
                    {isAuthenticated ? (userProfile?.email as string) : 'Guest User'}
                  </p>
                </div>

                {isAuthenticated && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} className="p-2 h-auto hover:bg-background/50">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Segmented Control */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex bg-muted rounded-lg p-1 w-full">
              <button
                onClick={() => setActiveTab('background')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'background' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Image className="h-4 w-4 inline mr-1.5" />
                Background
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'location' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="h-4 w-4 inline mr-1.5" />
                Time & location
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'profile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4 inline mr-1.5" />
                Profile
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Background Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize your homepage background with photos or videos from Pexels.
                  </p>
                </div>

                {background && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={background.thumbnail}
                            alt={background.alt || 'Background'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {background.type === 'photo' ? 'Photo' : 'Video'} Background
                          </p>
                          <p className="text-sm text-muted-foreground">by {background.photographer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={() => setShowBackgroundSelector(true)} className="w-full">
                  <Image className="h-4 w-4 mr-2" />
                  {background ? 'Change Background' : 'Choose Background'}
                </Button>

                {!background && (
                  <div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No custom background set</p>
                    <p className="text-sm text-muted-foreground mt-1">Using default theme background</p>
                  </div>
                )}

                <Card>
                  <CardContent className="p-[24px]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Use dark theme for better viewing in low light
                        </p>
                      </div>
                      <Switch checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Time & Location Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize your location to get accurate weather information.
                  </p>
                </div>

                {displayLocation && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{displayLocation}</p>
                          <p className="text-sm text-muted-foreground">Current location</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button variant="outline" onClick={handleUseCurrentLocation} disabled={isGettingLocation} className="w-full">
                  {isGettingLocation ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting location...</>
                  ) : (
                    <><Navigation className="h-4 w-4 mr-2" />Use Current Location</>
                  )}
                </Button>

                {locationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-200">{locationError}</p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or search manually</span>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Searching cities...</span>
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => handleCitySelect(city.name)}
                            className={`w-full p-3 text-left rounded-lg border transition-colors hover:bg-muted ${
                              selectedCity === city.name ? 'bg-primary/10 border-primary' : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{city.name}</div>
                                <div className="text-sm text-muted-foreground">{formatCityDisplay(city)}</div>
                              </div>
                              {selectedCity === city.name && <div className="w-2 h-2 bg-primary rounded-full" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No cities found</p>
                        <p className="text-xs">Try a different search term</p>
                      </div>
                    )
                  ) : searchQuery.length > 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Type at least 2 characters to search</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Use your current location or search for a city</p>
                    </div>
                  )}
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          Temperature Unit
                        </Label>
                        <p className="text-sm text-muted-foreground">Choose between Fahrenheit and Celsius</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!useFahrenheit ? 'text-foreground' : 'text-muted-foreground'}`}>°C</span>
                        <Switch checked={useFahrenheit} onCheckedChange={handleTemperatureUnitToggle} />
                        <span className={`text-sm ${useFahrenheit ? 'text-foreground' : 'text-muted-foreground'}`}>°F</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(hasLocationChanged || hasTemperatureChanged) && (
                  <Button onClick={handleLocationSave} className="w-full">Save</Button>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {isAuthenticated ? (
                  <>
                    {isEditing && profilePhotoPreview && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">New Profile Photo</CardTitle>
                          <CardDescription>Preview of your new profile photo</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={profilePhotoPreview} className="object-cover" />
                              <AvatarFallback>
                                {username?.charAt(0)?.toUpperCase() || (userProfile?.email as string)?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{profilePhoto?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {profilePhoto && `${(profilePhoto.size / 1024).toFixed(1)} KB`}
                              </p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={removeProfilePhoto} className="p-1 h-8 w-8">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!isEditing} placeholder="Enter a username" className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={!isEditing} placeholder="Enter your phone number" className="bg-background" />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex gap-3">
                        <Button onClick={handleSaveProfile} disabled={isLoading} className="flex-1">
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} className="flex-1">Cancel</Button>
                      </div>
                    )}

                    <Button variant="secondary" onClick={handleLogout} className="w-full">Sign Out</Button>
                  </>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Create an Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign up to save your preferences, customize your profile, and sync your settings across devices.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => onShowAuth('signup')} className="w-full" size="lg">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </Button>
                      <Button onClick={() => onShowAuth('login')} variant="outline" className="w-full">
                        <LogIn className="h-4 w-4 mr-2" />
                        Log In
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelect={handleBackgroundSelect}
          currentBackground={background}
        />
      </div>
    </div>
  );
}
