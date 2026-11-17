import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Client } from '@stomp/stompjs'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './DeliveryTracking.css'

const icon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const api = async (path, options = {}) => {
  const response = await fetch(path, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.error || `Request failed (${response.status})`)
  return data
}

function MapUpdater({ position }) {
  const map = useMap()
  useEffect(() => { if (position) map.setView(position, 15) }, [map, position])
  return null
}

export default function DeliveryTracking({ orderId, token, user }) {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState('Waiting for a real location update')
  const [agentEmail, setAgentEmail] = useState('')
  const [agentPassword, setAgentPassword] = useState('')
  const [agentToken, setAgentToken] = useState(() => localStorage.getItem('deliveryAgentToken') || '')
  const [agentOrderId, setAgentOrderId] = useState('')
  const [sharing, setSharing] = useState(false)
  const agentClient = useRef(null)

  useEffect(() => {
    if (!orderId || !token) return undefined
    let active = true
    const client = new Client({
      webSocketFactory: () => new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws-native`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        if (!active) return
        setStatus('Connected; waiting for the delivery agent')
        client.subscribe(`/topic/location/${orderId}`, (message) => {
          try {
            const point = JSON.parse(message.body)
            const lat = Number(point.latitude)
            const lng = Number(point.longitude)
            if (Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180) {
              setPosition([lat, lng])
              setStatus(`Live update received at ${new Date(point.updatedAt || Date.now()).toLocaleTimeString()}`)
            }
          } catch { setStatus('Invalid location update received') }
        })
      },
      onStompError: () => setStatus('Tracking access denied or server error'),
      onWebSocketError: () => setStatus('Could not connect to tracking server'),
      onWebSocketClose: () => { if (active) setStatus('Tracking connection disconnected. Reconnecting...') },
      onDisconnect: () => { if (active) setStatus('Tracking connection disconnected. Reconnecting...') }
    })
    client.activate()
    return () => { active = false; client.deactivate() }
  }, [orderId, token])

  useEffect(() => () => {
    const client = agentClient.current
    if (client?.__watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(client.__watchId)
    client?.deactivate()
  }, [])

  async function loginAgent(event) {
    event.preventDefault()
    try {
      const data = await api('/api/auth/delivery-agent/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: agentEmail, password: agentPassword })
      })
      setAgentToken(data.token)
      localStorage.setItem('deliveryAgentToken', data.token)
      setStatus('Delivery agent signed in')
    } catch (error) { setStatus(error.message) }
  }

  function startSharing() {
    const id = Number(agentOrderId)
    if (!Number.isSafeInteger(id) || id <= 0) { setStatus('Enter a valid order ID'); return }
    if (!navigator.geolocation) { setStatus('This browser does not support GPS location'); return }
    const client = new Client({
      webSocketFactory: () => new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws-native`),
      connectHeaders: { Authorization: `Bearer ${agentToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('Connected; requesting browser GPS permission')
        const watchId = navigator.geolocation.watchPosition(
          (location) => client.publish({ destination: `/app/location/${id}`, body: JSON.stringify({ latitude: location.coords.latitude, longitude: location.coords.longitude }) }),
          (error) => setStatus(`GPS unavailable: ${error.message}`),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        )
        client.__watchId = watchId
        setSharing(true)
        setStatus('Sharing actual browser GPS coordinates')
      },
      onStompError: () => setStatus('Server rejected this order or delivery-agent account'),
      onWebSocketError: () => setStatus('Could not connect to tracking server'),
      onWebSocketClose: () => setStatus('Connection lost. GPS sharing will resume after reconnecting.'),
      onDisconnect: () => setStatus('Connection lost. GPS sharing will resume after reconnecting.')
    })
    client.activate()
    agentClient.current?.deactivate()
    agentClient.current = client
  }

  function stopSharing() {
    const client = agentClient.current
    if (client?.__watchId != null) navigator.geolocation.clearWatch(client.__watchId)
    client?.deactivate()
    agentClient.current = null
    setSharing(false)
    setStatus('Location sharing stopped')
  }

  return (
    <section className="delivery-tracking">
      <div className="tracking-heading">
        <div><span className="tracking-label">{orderId ? `ORDER #${orderId}` : user ? 'DELIVERY TRACKING' : 'DELIVERY AGENT ACCESS'}</span><h2>{!user && !orderId ? 'Share Delivery GPS' : 'Live Delivery Tracking'}</h2><p>{!user && !orderId ? 'Sign in as the assigned delivery agent and share your device GPS for a real order.' : 'Map updates only after a delivery agent shares a real GPS position.'}</p></div>
        <span className="tracking-status">{status}</span>
      </div>
      {orderId ? <>{position ? <div className="tracking-map"><MapContainer center={position} zoom={15} scrollWheelZoom style={{ height: 400, width: '100%' }}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapUpdater position={position} /><Marker position={position} icon={icon}><Popup>Delivery agent GPS location</Popup></Marker></MapContainer></div> : <p className="tracking-hint">No GPS location has been received for this order yet. The map will appear when the delivery agent shares a real location.</p>}</> : user ? <p className="tracking-hint">Select an eligible order to view live tracking.</p> : null}
      {user && <p className="tracking-updated">Signed in as {user.name}. Order access is checked by the server.</p>}
      <details className="agent-panel"><summary>Delivery agent GPS sharing</summary>
        {!agentToken ? <form className="agent-login" onSubmit={loginAgent}><label>Email<input type="email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} required /></label><label>Password<input type="password" value={agentPassword} onChange={(e) => setAgentPassword(e.target.value)} required /></label><button type="submit">Agent sign in</button></form> : <div className="agent-login"><label>Real order ID<input type="number" min="1" value={agentOrderId} onChange={(e) => setAgentOrderId(e.target.value)} required /></label>{sharing ? <button type="button" onClick={stopSharing}>Stop sharing</button> : <button type="button" onClick={startSharing}>Allow GPS and share</button>}<button type="button" onClick={() => { stopSharing(); setAgentToken(''); localStorage.removeItem('deliveryAgentToken') }}>Sign out</button></div>}
      </details>
    </section>
  )
}
