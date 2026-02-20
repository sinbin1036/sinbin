'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '../../components/Profile';
import { Logo } from '../../components/Logo';
import { LocationSelector } from '../../components/LocationSelector';
import { Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useBackground } from '../../lib/useBackground';
import { BackgroundSelection } from '../../components/BackgroundSelector';
import framesvgPaths from '../../imports/svg-wrlpobapsl';

interface DashboardProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onShowAuth: (mode?: 'login' | 'signup') => void;
  locationRefreshTrigger?: number;
  onLocationRefresh?: () => void;
}

interface WeatherData {
  temp: number;
  condition: string;
  location?: string;
  humidity?: number;
  windSpeed?: number;
}

const WEATHER_API_KEY = 'b93e335c0d074c2ca9874431250506';

export function Dashboard({ isAuthenticated, onLogout, onShowAuth, locationRefreshTrigger, onLocationRefresh }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: 78, condition: 'Clear' });
  const [showProfile, setShowProfile] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isHoveringWidget, setIsHoveringWidget] = useState(false);
  const [guestLocation, setGuestLocation] = useState<string>('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [useFahrenheit, setUseFahrenheit] = useState(true);

  const { background } = useBackground(isAuthenticated);

  useEffect(() => {
    const body = document.body;
    if (background) {
      if (background.type === 'photo') {
        const existingVideo = document.querySelector('.background-video');
        if (existingVideo) existingVideo.remove();
        body.style.setProperty('--custom-bg-url', `url(${background.url})`);
        body.classList.add('custom-background');
      } else if (background.type === 'video') {
        let existingVideo = document.querySelector('.background-video') as HTMLVideoElement;
        if (!existingVideo) {
          existingVideo = document.createElement('video');
          existingVideo.className = 'background-video';
          existingVideo.autoplay = true;
          existingVideo.muted = true;
          existingVideo.loop = true;
          existingVideo.playsInline = true;
          document.body.appendChild(existingVideo);
        }
        existingVideo.src = background.url;
        body.classList.add('custom-background');
      }
    } else {
      body.classList.remove('custom-background');
      body.style.removeProperty('--custom-bg-url');
      const existingVideo = document.querySelector('.background-video');
      if (existingVideo) existingVideo.remove();
    }

    return () => {
      if (!background) {
        body.classList.remove('custom-background');
        body.style.removeProperty('--custom-bg-url');
        const existingVideo = document.querySelector('.background-video');
        if (existingVideo) existingVideo.remove();
      }
    };
  }, [background]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const fetchUserProfile = async () => {
    if (!isAuthenticated) {
      setProfilePhotoUrl('');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
          setCurrentLocation((profile as Record<string, unknown>)?.location as string || '');
          setProfilePhotoUrl((profile as Record<string, unknown>)?.profile_photo_url as string || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [isAuthenticated]);

  useEffect(() => {
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
            if (profile?.use_fahrenheit != null) setUseFahrenheit(profile.use_fahrenheit);
          }
        } catch (error) {
          console.error('Error loading temperature preference:', error);
        }
      } else {
        const saved = localStorage.getItem('useFahrenheit');
        if (saved !== null) setUseFahrenheit(saved === 'true');
      }
    };

    loadTemperaturePreference();

    const handleTemperatureUnitChange = (event: CustomEvent) => {
      setUseFahrenheit(event.detail);
    };
    window.addEventListener('temperatureUnitChanged', handleTemperatureUnitChange as EventListener);
    return () => window.removeEventListener('temperatureUnitChanged', handleTemperatureUnitChange as EventListener);
  }, [isAuthenticated]);

  useEffect(() => {
    if (locationRefreshTrigger && locationRefreshTrigger > 0 && isAuthenticated) {
      fetchUserProfile();
    }
  }, [locationRefreshTrigger, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;

    const getGuestLocation = () => {
      const savedGuestLocation = localStorage.getItem('guestLocation');
      if (savedGuestLocation) {
        setGuestLocation(savedGuestLocation);
        return;
      }

      if (!navigator.geolocation) {
        setGuestLocation('New York');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
            );
            if (response.ok) {
              const data = await response.json();
              setGuestLocation(data.location.name);
            } else {
              setGuestLocation('New York');
            }
          } catch {
            setGuestLocation('New York');
          }
        },
        () => setGuestLocation('New York'),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    };

    getGuestLocation();

    const handleGuestLocationUpdate = (event: CustomEvent) => {
      setGuestLocation(event.detail);
    };
    window.addEventListener('guestLocationUpdate', handleGuestLocationUpdate as EventListener);
    return () => window.removeEventListener('guestLocationUpdate', handleGuestLocationUpdate as EventListener);
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const locationToUse = isAuthenticated ? currentLocation : guestLocation;
        if (locationToUse) {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(locationToUse)}&aqi=no`
          );
          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
              condition: data.current.condition.text,
              location: data.location.name,
              humidity: data.current.humidity,
              windSpeed: Math.round(useFahrenheit ? data.current.wind_mph : data.current.wind_kph)
            });
          } else {
            throw new Error('Weather API request failed');
          }
        } else {
          const temperatures = [72, 74, 76, 78, 80, 82];
          const conditions = ['Clear', 'Partly Cloudy', 'Sunny', 'Cloudy'];
          setWeather({
            temp: temperatures[Math.floor(Math.random() * temperatures.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)]
          });
        }
      } catch {
        const temperatures = [72, 74, 76, 78, 80, 82];
        const conditions = ['Clear', 'Partly Cloudy', 'Sunny', 'Cloudy'];
        setWeather({
          temp: temperatures[Math.floor(Math.random() * temperatures.length)],
          condition: conditions[Math.floor(Math.random() * conditions.length)]
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    const locationToUse = isAuthenticated ? currentLocation : guestLocation;
    if (locationToUse || !isAuthenticated) fetchWeather();

    const weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(weatherTimer);
  }, [isAuthenticated, currentLocation, guestLocation, useFahrenheit]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleProfileClick = () => setShowProfile(true);

  const handleCloseProfile = () => {
    setShowProfile(false);
    if (onLocationRefresh && isAuthenticated) onLocationRefresh();
  };

  const handleLogoutFromProfile = () => {
    setShowProfile(false);
    onLogout();
  };

  const handleWidgetClick = () => setShowLocationSelector(true);

  const handleLocationSave = async (cityName: string) => {
    if (isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { error } = await supabase
          .from('profiles')
          .update({ location: cityName })
          .eq('id', user.id);
        if (error) throw error;

        setCurrentLocation(cityName);
        setWeatherLoading(true);
        try {
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`
          );
          if (response.ok) {
            const data = await response.json();
            setWeather({
              temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
              condition: data.current.condition.text,
              location: data.location.name,
              humidity: data.current.humidity,
              windSpeed: Math.round(useFahrenheit ? data.current.wind_mph : data.current.wind_kph)
            });
          }
        } catch {
          console.error('Error fetching weather after location update');
        } finally {
          setWeatherLoading(false);
        }
      } catch (error) {
        console.error('Error saving location:', error);
        toast.error('Failed to save location. Please try again.');
      }
    } else {
      localStorage.setItem('guestLocation', cityName);
      setGuestLocation(cityName);

      setWeatherLoading(true);
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`
        );
        if (response.ok) {
          const data = await response.json();
          setWeather({
            temp: Math.round(useFahrenheit ? data.current.temp_f : data.current.temp_c),
            condition: data.current.condition.text,
            location: data.location.name,
            humidity: data.current.humidity,
            windSpeed: Math.round(useFahrenheit ? data.current.wind_mph : data.current.wind_kph)
          });
        }
      } catch {
        console.error('Error fetching weather after location update');
      } finally {
        setWeatherLoading(false);
      }

      toast.success(`Location updated to ${cityName}`);
    }
  };

  if (showProfile) {
    return (
      <Profile
        isAuthenticated={isAuthenticated}
        onLogout={handleLogoutFromProfile}
        onBack={handleCloseProfile}
        onShowAuth={onShowAuth}
      />
    );
  }

  const displayLocation = isAuthenticated ? currentLocation : guestLocation;

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <Logo />
      </div>

      <div
        className="absolute time-container translate-x-[-50%] translate-y-[-50%] w-[85vw] max-w-none"
        style={{ top: 'calc(50% + 0.5px)', left: 'calc(50% + 0.5px)' }}
      >
        <div className="flex flex-row justify-center items-center">
          <div
            className="box-border content-stretch flex flex-col sm:flex-row font-['Roboto:Light',_sans-serif] font-light gap-4 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-20 items-center justify-center leading-[0] p-[8px] relative text-[#ffffff] text-left text-nowrap tracking-[-0.25px] cursor-pointer transition-all duration-200"
            onClick={handleWidgetClick}
            onMouseEnter={() => setIsHoveringWidget(true)}
            onMouseLeave={() => setIsHoveringWidget(false)}
            title="Click to customize location"
          >
            <div
              className={`absolute -top-6 -right-6 z-10 transition-all duration-200 ${
                isHoveringWidget ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30 shadow-lg">
                <Edit3 className="h-4 w-4 text-white" />
              </div>
            </div>

            <div
              style={{ fontVariationSettings: "'wdth' 100" }}
              className={`flex flex-col justify-center items-center relative shrink-0 ${
                isHoveringWidget ? 'scale-105' : ''
              } transition-transform duration-200`}
            >
              <p
                className="block leading-[normal] text-nowrap whitespace-pre text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[10vw] xl:text-[200px]"
                style={{
                  textShadow: '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                  fontWeight: '300'
                }}
              >
                {formatTime(currentTime)}
              </p>
              {displayLocation && (
                <p
                  className="block leading-[normal] text-nowrap whitespace-pre text-[6vw] sm:text-[2.5vw] md:text-[2vw] lg:text-[1.5vw] xl:text-[24px] text-center mt-2 opacity-80"
                  style={{ textShadow: '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)' }}
                >
                  {displayLocation}
                </p>
              )}
            </div>

            <div
              style={{ fontVariationSettings: "'wdth' 100" }}
              className="flex flex-col justify-center relative shrink-0"
            >
              <p
                className="block leading-[normal] text-nowrap whitespace-pre text-[11vw] sm:text-[10vw] md:text-[8vw] lg:text-[6vw] xl:text-[100px]"
                style={{
                  textShadow: '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                  fontWeight: '300'
                }}
              >
                •
              </p>
            </div>

            <div
              style={{ fontVariationSettings: "'wdth' 100" }}
              className={`flex flex-col justify-center items-center relative shrink-0 ${
                isHoveringWidget ? 'scale-105' : ''
              } transition-transform duration-200`}
            >
              <p
                className="block leading-[normal] text-nowrap whitespace-pre text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[10vw] xl:text-[200px]"
                style={{
                  textShadow: '0px 0px 40px rgba(0, 0, 0, 0.5), 0px 0px 20px rgba(0, 0, 0, 0.4), 0px 0px 10px rgba(0, 0, 0, 0.3)',
                  fontWeight: '300'
                }}
              >
                {weatherLoading ? '--' : weather.temp}°
              </p>
              <p
                className="block leading-[normal] text-nowrap whitespace-pre text-[6vw] sm:text-[2.5vw] md:text-[2vw] lg:text-[1.5vw] xl:text-[24px] text-center mt-2 opacity-80"
                style={{ textShadow: '0px 0px 20px rgba(0, 0, 0, 0.5), 0px 0px 10px rgba(0, 0, 0, 0.4)' }}
              >
                {weatherLoading ? 'Loading...' : weather.condition}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Launcher - Profile Button */}
      <div className="absolute bottom-24 sm:bottom-16 left-1/2 translate-x-[-50%]">
        <div className="bg-background border border-border relative rounded-xl h-16 w-20 shadow-lg">
          <div className="flex flex-row items-center justify-center size-full">
            <button
              onClick={handleProfileClick}
              className="relative shrink-0 size-10 hover:opacity-70 transition-opacity"
              title={isAuthenticated ? 'Profile' : 'Profile & Settings'}
            >
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 40 40"
              >
                <g clipPath="url(#clip0_149_608)">
                  <mask
                    height="40"
                    id="mask0_149_608"
                    maskUnits="userSpaceOnUse"
                    style={{ maskType: 'alpha' }}
                    width="40"
                    x="0"
                    y="0"
                  >
                    <rect fill="#D9D9D9" height="40" width="40" />
                  </mask>
                  <g mask="url(#mask0_149_608)">
                    <path d={framesvgPaths.p2a914900} fill="currentColor" className="text-foreground" />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_149_608">
                    <rect fill="white" height="40" width="40" />
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
          {isAuthenticated && profilePhotoUrl && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-background bg-background overflow-hidden z-10">
              <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSave={handleLocationSave}
        currentLocation={displayLocation}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
