import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { MapPin, Navigation, Footprints, Bike, Car, Loader2, ArrowRight } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

// Custom markers
const kostIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41]
})

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow,
  shadowSize: [41, 41]
})

// Speed constants for travel time calculation (km/h)
const TRAVEL_SPEEDS = {
  walking: 5,
  motorcycle: 30,
  car: 40
}

// Haversine formula to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Format distance
function formatDistance(km) {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`
  }
  return `${km.toFixed(1)} km`
}

// Format duration
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} mnt`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} jam ${mins} mnt`
}

// Component to fit bounds
function MapBounds({ userLocation, kostPosition }) {
  const map = useMap()
  
  useEffect(() => {
    if (userLocation) {
      const bounds = L.latLngBounds([userLocation, kostPosition])
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, userLocation, kostPosition])
  
  return null
}

export default function GoogleMapDirections({ 
  kostLat, 
  kostLng, 
  kostName,
  kostAddress 
}) {
  const kostPosition = useMemo(() => ({
    lat: parseFloat(kostLat),
    lng: parseFloat(kostLng)
  }), [kostLat, kostLng])

  const [userLocation, setUserLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [alternateRoutes, setAlternateRoutes] = useState([])

  // Calculate routes based on distance
  const calculateRoutes = (userLat, userLng) => {
    const distance = calculateDistance(userLat, userLng, kostPosition.lat, kostPosition.lng)
    
    const routes = [
      {
        mode: 'driving',
        label: 'Mobil',
        icon: Car,
        color: '#6366f1',
        distance: formatDistance(distance),
        distanceValue: distance,
        duration: formatDuration(Math.round((distance / TRAVEL_SPEEDS.car) * 60)),
        durationValue: Math.round((distance / TRAVEL_SPEEDS.car) * 60)
      },
      {
        mode: 'bicycling',
        label: 'Motor',
        icon: Bike,
        color: '#10b981',
        distance: formatDistance(distance),
        distanceValue: distance,
        duration: formatDuration(Math.round((distance / TRAVEL_SPEEDS.motorcycle) * 60)),
        durationValue: Math.round((distance / TRAVEL_SPEEDS.motorcycle) * 60)
      },
      {
        mode: 'walking',
        label: 'Jalan Kaki',
        icon: Footprints,
        color: '#f59e0b',
        distance: formatDistance(distance),
        distanceValue: distance,
        duration: formatDuration(Math.round((distance / TRAVEL_SPEEDS.walking) * 60)),
        durationValue: Math.round((distance / TRAVEL_SPEEDS.walking) * 60)
      }
    ]
    
    setAlternateRoutes(routes)
    setRouteInfo(routes[0])
  }

  // Get user location
  const handleGetLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung geolocation')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(loc)
        calculateRoutes(loc.lat, loc.lng)
        setIsLoadingLocation(false)
      },
      (error) => {
        let errorMsg = 'Gagal mendapatkan lokasi'
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Izin lokasi ditolak. Mohon izinkan akses lokasi di browser.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Informasi lokasi tidak tersedia'
            break
          case error.TIMEOUT:
            errorMsg = 'Waktu permintaan lokasi habis'
            break
        }
        setLocationError(errorMsg)
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Select route
  const selectRoute = (route) => {
    setRouteInfo(route)
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '500px' }}>
      {/* Left Panel - Route Options */}
      <div style={{ 
        width: '380px', 
        background: '#fff', 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            Rute ke {kostName}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {kostAddress}
          </p>
        </div>

        {/* Location Button or Location Info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {!userLocation ? (
            <button
              onClick={handleGetLocation}
              disabled={isLoadingLocation}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '14px 20px',
                background: isLoadingLocation ? '#94a3b8' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: isLoadingLocation ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isLoadingLocation ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Navigation size={20} />
              )}
              {isLoadingLocation ? 'Mendeteksi Lokasi...' : 'Gunakan Lokasi Saya'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={20} color="#3b82f6" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  Lokasi Anda
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              </div>
              <button
                onClick={handleGetLocation}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Update
              </button>
            </div>
          )}
          
          {locationError && (
            <p style={{ marginTop: 12, fontSize: 12, color: '#ef4444', fontWeight: 500, textAlign: 'center' }}>
              {locationError}
            </p>
          )}
        </div>

        {/* Route Options */}
        {alternateRoutes.length > 0 && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '16px 20px 8px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pilihan Rute
              </p>
            </div>
            
            {alternateRoutes.map((route) => {
              const IconComponent = route.icon
              const isSelected = routeInfo?.mode === route.mode
              
              return (
                <div
                  key={route.mode}
                  onClick={() => selectRoute(route)}
                  style={{
                    margin: '0 16px 12px',
                    padding: '16px',
                    background: isSelected ? '#eff6ff' : '#fff',
                    border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 12, 
                      background: route.color + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={22} color={route.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {route.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        {route.distance}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800, color: isSelected ? '#3b82f6' : '#0f172a' }}>
                        {route.duration}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                        ~{TRAVEL_SPEEDS[route.mode === 'bicycling' ? 'motorcycle' : route.mode === 'driving' ? 'car' : 'walking']} km/j
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!userLocation && (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 40,
            textAlign: 'center'
          }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 20, 
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <MapPin size={36} color="#94a3b8" />
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#475569' }}>
              Aktifkan Lokasi
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
              Klik &quot;Gunakan Lokasi Saya&quot; untuk melihat rute dari posisi Anda ke kost ini
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
            * Estimasi waktu berdasarkan kecepatan rata-rata
          </p>
        </div>
      </div>

      {/* Right Side - Leaflet Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[kostPosition.lat, kostPosition.lng]}
          zoom={15}
          style={{ width: '100%', height: '100%', minHeight: '500px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Kost Marker */}
          <Marker position={[kostPosition.lat, kostPosition.lng]} icon={kostIcon}>
            <Popup>{kostName}</Popup>
          </Marker>
          
          {/* User Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>Lokasi Anda</Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          {userLocation && (
            <Polyline
              positions={[[userLocation.lat, userLocation.lng], [kostPosition.lat, kostPosition.lng]]}
              color="#3b82f6"
              weight={5}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}
          
          {/* Fit bounds */}
          <MapBounds userLocation={userLocation} kostPosition={kostPosition} />
        </MapContainer>
        
        {/* Map Controls */}
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 8
        }}>
          <button
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${kostPosition.lat},${kostPosition.lng}`, '_blank')}
            style={{
              padding: '10px 14px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Navigation size={14} />
            Navigasi
          </button>
        </div>
      </div>
    </div>
  )
}
