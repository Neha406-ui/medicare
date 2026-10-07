import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ClipboardList, HeartPulse } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const roleRedirects = {
  administrator: '/admin/dashboard',
  caretaker: '/caretaker/dashboard',
  resident: '/resident/dashboard',
};

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [role, setRole] = useState('CARETAKER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(() => (
    searchParams.get('session') === 'expired' ? 'Your session has expired. Please log in again.' : ''
  ));
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        username,
        password,
        role,
      });

      login({ access_token: data.access_token, user: data.user });
      navigate(roleRedirects[String(data.user.role).toLowerCase()] || '/login');
    } catch (apiError) {
      const message = apiError.response?.data?.detail || 'Unable to sign in. Please verify your credentials.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] p-4 lg:p-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-[#E5E9E7] bg-white shadow-[0_22px_60px_rgba(17,24,39,0.06)] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative overflow-hidden bg-[#F2F7F5] p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,138,139,0.13),transparent_35%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F2] text-[#4F8A8B]">
                <HeartPulse size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#263238]">MediCare Home</p>
                <p className="text-xs text-[#667085]">Safer medication. Better care.</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <div className="rounded-3xl border border-[#DEE7E5] bg-white/80 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F3F2] text-[#4F8A8B]">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#7D8B92]">Care support</p>
                    <p className="text-lg font-semibold text-[#263238]">Medication management</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#F7FBFA] p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#5F9E7A]">✓</div>
                    <div>
                      <p className="text-sm font-medium text-[#263238]">Daily schedules</p>
                      <p className="text-xs text-[#667085]">Resident and caregiver visibility</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[#F7FBFA] p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF4F8] text-[#668BA4]">✓</div>
                    <div>
                      <p className="text-sm font-medium text-[#263238]">Medication tracking</p>
                      <p className="text-xs text-[#667085]">Acknowledge, miss, and review each dose</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 max-w-md">
              <h2 className="text-3xl font-semibold leading-tight text-[#263238]">A simple and reliable way to manage medications, schedules, and daily care for residents.</h2>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-10">
          <div className="mb-7">
            <p className="text-sm font-medium text-[#4F8A8B]">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#263238]">Welcome to MediCare Home</h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-[#263238]">Select your role</label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-3 text-base text-[#263238] focus:border-[#4F8A8B] focus:outline-none"
              >
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="CARETAKER">Caretaker</option>
                <option value="RESIDENT">Resident</option>
              </select>
            </div>

            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-[#263238]">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-3 text-sm text-[#263238] placeholder:text-[#8B97A2] focus:border-[#4F8A8B] focus:outline-none"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#263238]">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#DDE7E5] bg-[#F9FBFB] px-3 py-3 text-sm text-[#263238] focus:border-[#4F8A8B] focus:outline-none"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full rounded-xl py-3.5 text-base" disabled={isSubmitting}>
              <span className="flex items-center gap-2">
                {isSubmitting ? 'Signing in...' : `Login as ${roleLabel}`}
                <ArrowRight size={18} />
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
