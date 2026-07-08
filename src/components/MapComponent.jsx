import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from 'react-leaflet'

import L from 'leaflet'

import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

import {
    useEffect,
    useRef,
    useState
} from 'react'

import { useTranslation } from 'react-i18next'

import './Marker.css'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: '',
    iconUrl: '',
    shadowUrl: ''
})

const customIcon = L.divIcon({

    className: 'custom-marker',

    html: `
        <div class="pin-wrapper">

            <div class="pin"></div>

            <div class="pulse"></div>

        </div>
    `,

    iconSize: [60, 60],

    iconAnchor: [30, 55]
})

function Routing({ selected }) {

    const map = useMap()

    const routingRef = useRef(null)

    useEffect(() => {

        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition((position) => {

            const userLat = position.coords.latitude
            const userLng = position.coords.longitude

            if (routingRef.current) {

                map.removeControl(routingRef.current)

                routingRef.current = null
            }

            const routing = L.Routing.control({

                waypoints: [
                    L.latLng(userLat, userLng),
                    L.latLng(selected.lat, selected.lng)
                ],

                routeWhileDragging: false,

                addWaypoints: false,

                draggableWaypoints: false,

                fitSelectedRoutes: true,

                show: false,

                createMarker: () => null,

                lineOptions: {
                    styles: [
                        {
                            color: '#703bf7',
                            weight: 6,
                            opacity: 1
                        }
                    ]
                }

            }).addTo(map)

            routingRef.current = routing

        })

        return () => {

            if (routingRef.current) {

                map.removeControl(routingRef.current)

                routingRef.current = null
            }
        }

    }, [selected, map])

    return null
}

function ChangeMapView({ selected }) {

    const map = useMap()

    useEffect(() => {

        map.flyTo(
            [selected.lat, selected.lng],
            13,
            {
                duration: 1.5
            }
        )

    }, [selected, map])

    return null
}

const MapComponent = ({ selected }) => {

    const { t } = useTranslation()

    const [userPosition, setUserPosition] = useState(null)

    useEffect(() => {

        navigator.geolocation.getCurrentPosition((position) => {

            setUserPosition([
                position.coords.latitude,
                position.coords.longitude
            ])

        })

    }, [])

    return (

        <MapContainer
            center={[selected.lat, selected.lng]}
            zoom={13}
            style={{
                width: '100%',
                height: '500px',
                borderRadius: '24px'
            }}
        >

            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ChangeMapView selected={selected} />

            <Marker
                position={[selected.lat, selected.lng]}
                icon={customIcon}
            >

                <Popup>
                    {selected.title}
                </Popup>

            </Marker>

            {userPosition && (

                <Marker
                    position={userPosition}
                    icon={customIcon}
                >

                    <Popup>
                        {t("yourLocation")}
                    </Popup>

                </Marker>

            )}

            <Routing selected={selected} />

        </MapContainer>
    )
}

export default MapComponent