import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import { AuthProvider, useAuth } from './state/Auth'
import { AuthScreen } from './screens/AuthScreen'
import { PhoneFrame } from './components/PhoneFrame'
import { DemoControls } from './components/DemoControls'
import { HomeScreen } from './screens/HomeScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { ChatScreen } from './screens/ChatScreen'
import { PlaceDetailScreen } from './screens/PlaceDetailScreen'
import { QueueScreen } from './screens/QueueScreen'
import { JokiScreen } from './screens/JokiScreen'
import { TitipScreen } from './screens/TitipScreen'
import { PaymentScreen } from './screens/PaymentScreen'
import { TrackScreen } from './screens/TrackScreen'
import { OrderDoneScreen } from './screens/OrderDoneScreen'
import { SavedScreen } from './screens/SavedScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { BuddyModeScreen } from './screens/BuddyModeScreen'
import { BuddyApplyScreen } from './screens/BuddyApplyScreen'
import { AdminReviewScreen } from './screens/AdminReviewScreen'
import { canUseBuddyMode, useBuddyAccess } from './state/useBuddy'
import { ROUTES } from './routes'

/** Mode Buddy only for approved buddies; everyone else goes to Jadi Buddy. */
function BuddyGate() {
  const access = useBuddyAccess()
  if (access.kind === 'loading') return <div role="status" aria-label="Memuat" className="flex-1" />
  return canUseBuddyMode(access) ? <BuddyModeScreen /> : <Navigate to={ROUTES.buddyApply} replace />
}

/** Shows Masuk / Daftar until the user is signed in. */
function AppRoutes() {
  const { status } = useAuth()
  if (status === 'loading') return <div role="status" aria-label="Memuat" className="flex-1" />
  if (status === 'signedOut') return <AuthScreen />
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/hasil" element={<ResultsScreen />} />
      <Route path="/chat" element={<ChatScreen />} />
      <Route path="/tempat/:id" element={<PlaceDetailScreen />} />
      <Route path="/antrean" element={<QueueScreen />} />
      <Route path="/joki/:placeId" element={<JokiScreen />} />
      <Route path="/titip/:placeId" element={<TitipScreen />} />
      <Route path="/bayar/:orderId" element={<PaymentScreen />} />
      <Route path="/lacak/:orderId" element={<TrackScreen />} />
      <Route path="/selesai/:orderId" element={<OrderDoneScreen />} />
      <Route path="/disimpan" element={<SavedScreen />} />
      <Route path="/profil" element={<ProfileScreen />} />
      <Route path="/buddy" element={<BuddyGate />} />
      <Route path="/buddy/daftar" element={<BuddyApplyScreen />} />
      <Route path="/admin" element={<AdminReviewScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <PhoneFrame>
            <AppRoutes />
            <DemoControls />
          </PhoneFrame>
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
