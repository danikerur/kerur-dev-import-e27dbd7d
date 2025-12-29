import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img
            src="https://jthvcbeoblgvgettmehi.supabase.co/storage/v1/object/public/products/logo/logosys.png"
            alt="קירור דן"
            className="h-16 sm:h-24 w-auto mb-4"
          />
          <p className="text-gray-600 text-center text-sm sm:text-base">
            התחבר למערכת איתור מוצרים ולקוחות
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              אימייל
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="your@email.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  );
}
