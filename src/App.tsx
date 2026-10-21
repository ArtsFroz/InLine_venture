import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import { PhoneFrame } from './components/PhoneFrame'
import { DemoControls } from './components/DemoControls'
import { HomeScreen } from './screens/HomeScreen'
import { ResultsScreen } from './screens/ResultsScreen'
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

export function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <PhoneFrame>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/hasil" element={<ResultsScreen />} />
            <Route path="/tempat/:id" element={<PlaceDetailScreen />} />
            <Route path="/antrean" element={<QueueScreen />} />
            <Route path="/joki/:placeId" element={<JokiScreen />} />
            <Route path="/titip/:placeId" element={<TitipScreen />} />
            <Route path="/bayar/:orderId" element={<PaymentScreen />} />
            <Route path="/lacak/:orderId" element={<TrackScreen />} />
            <Route path="/selesai/:orderId" element={<OrderDoneScreen />} />
            <Route path="/disimpan" element={<SavedScreen />} />
            <Route path="/profil" element={<ProfileScreen />} />
            <Route path="/buddy" element={<BuddyModeScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <DemoControls />
        </PhoneFrame>
      </AppStateProvider>
    </BrowserRouter>
  )
}
