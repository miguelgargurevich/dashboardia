"use client";
// Si tienes un hook de protección, adáptalo aquí
// import { useAuth } from '../../hooks/useAuth';
// import LogoutButton from '../../components/LogoutButton';

export default function Dashboard() {
  // useAuth(); // Descomenta si tienes el hook
  return (
    <div className="min-h-screen bg-primary text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">Bienvenido al Dashboard IA</h1>
      {/* <LogoutButton /> */}
      <button
        className="mt-4 px-6 py-2 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
        onClick={() => {
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 50);
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
