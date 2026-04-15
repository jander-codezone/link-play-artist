import Artistas from "./pages/Artistas";
import ExplorarArtistas from "./pages/ExplorarArtistas";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Calendario from "./pages/Calendario";
import Contrataciones from "./pages/Contrataciones";
import Facturacion from "./pages/Facturacion";
import Notificaciones from "./pages/Notificaciones";
import Configuracion from "./pages/Configuracion";
import Suscripciones from "./pages/Suscripciones";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
	    <Route
 	       path="/artistas"
 	       element={
    	         <ProtectedRoute>
                   <Artistas />
    		 </ProtectedRoute>
  	      }
	    />
            <Route
              path="/explorar-artistas"
              element={
                <ProtectedRoute>
                  <ExplorarArtistas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <Calendario />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contrataciones"
              element={
                <ProtectedRoute>
                  <Contrataciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facturacion"
              element={
                <ProtectedRoute>
                  <Facturacion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notificaciones"
              element={
                <ProtectedRoute>
                  <Notificaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suscripciones"
              element={
                <ProtectedRoute>
                  <Suscripciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suscripcion"
              element={
                <ProtectedRoute>
                  <Suscripciones />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
