import { LayoutDashboard, Calendar, FileText, Bell, Settings, LogOut, CreditCard, Briefcase, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoLinkplay from "@/assets/logo-linkplay.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Calendario", url: "/calendario", icon: Calendar },
  { title: "Contrataciones", url: "/contrataciones", icon: Briefcase },
  { title: "Facturación", url: "/facturacion", icon: FileText },
  { title: "Notificaciones", url: "/notificaciones", icon: Bell },
  { title: "Suscripción", url: "/suscripcion", icon: CreditCard },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTipoUsuarioLabel = (tipo: string) => {
    switch (tipo) {
      case "artista_individual":
        return "Artista individual";
      case "representante_agencia":
        return "Representante / Agencia";
      case "venue":
        return "Venue";
      default:
        return tipo;
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-6 pb-8">
        <div className="flex flex-col items-center gap-1">
          <img src={logoLinkplay} alt="Link&Play" className="h-14 w-auto" />
          <span className="text-sm italic text-sidebar-foreground">Artists</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, index) => (
                <>
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-11">
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {index === 0 && localStorage.getItem("tipo_usuario_demo") === "representante_agencia" && (
                    <SidebarMenuItem key="artistas-representados">
                      <SidebarMenuButton asChild className="h-11">
                        <NavLink
                          to="/artistas"
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <Users className="h-5 w-5" />
                          <span>Artistas representados</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-11">
              <NavLink
                to="/configuracion"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Separator className="my-3 bg-sidebar-border" />

        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.foto_url || undefined} alt={profile?.nombre} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
              {profile ? getInitials(profile.nombre) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.nombre || "Usuario"}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {profile ? getTipoUsuarioLabel(profile.tipo_usuario) : ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}