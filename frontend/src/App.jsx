import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EditorDashboard from './pages/EditorDashboard';
import MemberDashboard from './pages/MemberDashboard';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Reports />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/editor/*" 
          element={
            <ProtectedRoute allowedRoles={['Editor']}>
              <EditorDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/editor/reports" 
          element={
            <ProtectedRoute allowedRoles={['Editor']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/member/*" 
          element={
            <ProtectedRoute allowedRoles={['Member']}>
              <MemberDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

