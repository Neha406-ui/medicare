import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './pages/auth/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Residents } from './pages/admin/Residents';
import { ResidentDetails } from './pages/admin/ResidentDetails';
import { Medications } from './pages/admin/Medications';
import { ScheduleManagement } from './pages/admin/ScheduleManagement';
import { Inventory } from './pages/admin/Inventory';
import { CareTakers } from './pages/admin/CareTakers';
import { Reports } from './pages/admin/Reports';
import { NotificationsPage } from './pages/admin/Notifications';
import { Settings } from './pages/admin/Settings';
import { AuditLogs } from './pages/admin/AuditLogs';
import { CareTakerDashboard } from './pages/careTaker/CareTakerDashboard';
import { TodaySchedule } from './pages/careTaker/TodaySchedule';
import { CareTakerResidents } from './pages/careTaker/CareTakerResidents';
import { MedicationHistory } from './pages/careTaker/MedicationHistory';
import { CareTakerNotifications } from './pages/careTaker/CareTakerNotifications';
import { CareTakerProfile } from './pages/careTaker/CareTakerProfile';
import { ResidentDashboard } from './pages/resident/ResidentDashboard';
import { MyMedicines } from './pages/resident/MyMedicines';
import { ResidentSchedule } from './pages/resident/ResidentSchedule';
import { ResidentHistory } from './pages/resident/ResidentHistory';
import { ResidentProfile } from './pages/resident/ResidentProfile';
import { ResidentNotifications } from './pages/resident/ResidentNotifications';
import { Help } from './pages/resident/Help';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const ROLE_REDIRECTS = {
  administrator: '/admin/dashboard',
  caretaker: '/caretaker/dashboard',
  resident: '/resident/dashboard',
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROLE_REDIRECTS[user?.role] || '/login'} replace />} />
        <Route path="/login" element={user ? <Navigate to={ROLE_REDIRECTS[user.role] || '/login'} replace /> : <Login />} />

        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/residents"
          element={<ProtectedRoute allowedRoles={['administrator']}><Residents /></ProtectedRoute>}
        />
        <Route
          path="/admin/residents/:residentId"
          element={<ProtectedRoute allowedRoles={['administrator']}><ResidentDetails /></ProtectedRoute>}
        />
        <Route
          path="/admin/medications"
          element={<ProtectedRoute allowedRoles={['administrator']}><Medications /></ProtectedRoute>}
        />
        <Route
          path="/admin/schedule"
          element={<ProtectedRoute allowedRoles={['administrator']}><ScheduleManagement /></ProtectedRoute>}
        />
        <Route
          path="/admin/caretakers"
          element={<ProtectedRoute allowedRoles={['administrator']}><CareTakers /></ProtectedRoute>}
        />
        <Route
          path="/admin/inventory"
          element={<ProtectedRoute allowedRoles={['administrator']}><Inventory /></ProtectedRoute>}
        />
        <Route
          path="/admin/reports"
          element={<ProtectedRoute allowedRoles={['administrator']}><Reports /></ProtectedRoute>}
        />
        <Route
          path="/admin/notifications"
          element={<ProtectedRoute allowedRoles={['administrator']}><NotificationsPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/settings"
          element={<ProtectedRoute allowedRoles={['administrator']}><Settings /></ProtectedRoute>}
        />
        <Route
          path="/admin/audit-logs"
          element={<ProtectedRoute allowedRoles={['administrator']}><AuditLogs /></ProtectedRoute>}
        />

        <Route
          path="/caretaker/dashboard"
          element={<ProtectedRoute allowedRoles={['caretaker']}><CareTakerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/caretaker/schedule"
          element={<ProtectedRoute allowedRoles={['caretaker']}><TodaySchedule /></ProtectedRoute>}
        />
        <Route
          path="/caretaker/residents"
          element={<ProtectedRoute allowedRoles={['caretaker']}><CareTakerResidents /></ProtectedRoute>}
        />
        <Route
          path="/caretaker/medications"
          element={<ProtectedRoute allowedRoles={['caretaker']}><MedicationHistory /></ProtectedRoute>}
        />
        <Route
          path="/caretaker/history"
          element={<ProtectedRoute allowedRoles={['caretaker']}><MedicationHistory /></ProtectedRoute>}
        />
        <Route
          path="/caretaker/notifications"
          element={<ProtectedRoute allowedRoles={['caretaker']}><CareTakerNotifications /></ProtectedRoute>}
        />
        <Route
          path="/caretaker/profile"
          element={<ProtectedRoute allowedRoles={['caretaker']}><CareTakerProfile /></ProtectedRoute>}
        />

        <Route path="/care-taker/dashboard" element={<Navigate to="/caretaker/dashboard" replace />} />
        <Route path="/care-taker/schedule" element={<Navigate to="/caretaker/schedule" replace />} />
        <Route path="/care-taker/residents" element={<Navigate to="/caretaker/residents" replace />} />
        <Route path="/care-taker/medications" element={<Navigate to="/caretaker/medications" replace />} />
        <Route path="/care-taker/history" element={<Navigate to="/caretaker/history" replace />} />
        <Route path="/care-taker/notifications" element={<Navigate to="/caretaker/notifications" replace />} />
        <Route path="/care-taker/profile" element={<Navigate to="/caretaker/profile" replace />} />

        <Route
          path="/resident/dashboard"
          element={<ProtectedRoute allowedRoles={['resident']}><ResidentDashboard /></ProtectedRoute>}
        />
        <Route
          path="/resident/medicines"
          element={<ProtectedRoute allowedRoles={['resident']}><MyMedicines /></ProtectedRoute>}
        />
        <Route
          path="/resident/schedule"
          element={<ProtectedRoute allowedRoles={['resident']}><ResidentSchedule /></ProtectedRoute>}
        />
        <Route
          path="/resident/history"
          element={<ProtectedRoute allowedRoles={['resident']}><ResidentHistory /></ProtectedRoute>}
        />
        <Route
          path="/resident/profile"
          element={<ProtectedRoute allowedRoles={['resident']}><ResidentProfile /></ProtectedRoute>}
        />
        <Route
          path="/resident/notifications"
          element={<ProtectedRoute allowedRoles={['resident']}><ResidentNotifications /></ProtectedRoute>}
        />
        <Route
          path="/resident/help"
          element={<ProtectedRoute allowedRoles={['resident']}><Help /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to={ROLE_REDIRECTS[user?.role] || '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;