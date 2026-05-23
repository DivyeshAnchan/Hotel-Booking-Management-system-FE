import { useEffect, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { UsersModule } from "./components/UsersModule";
import { HotelsModule } from "./components/HotelsModule";
import { BookingsModule } from "./components/BookingsModule";

const THEME_STORAGE_KEY = "hotel-dashboard-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme still applies for the current session if storage is unavailable.
    }
  }, [isDarkMode, theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand-block">
            <div className="app-brand-icon">
              <i className="pi pi-building text-xl" />
            </div>
            <div className="app-brand-copy">
              <h1 className="app-title">Hotel Booking Management</h1>
              <p className="app-subtitle">
                Admin dashboard for managing users, hotels, and bookings
              </p>
            </div>
          </div>

          <button
            type="button"
            className="theme-toggle-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
          >
            <i className={isDarkMode ? "pi pi-sun" : "pi pi-moon"} />
            <span>{isDarkMode ? "Light" : "Dark"}</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <TabView className="dashboard-tabs">
          <TabPanel header="Users" leftIcon="pi pi-users mr-2">
            <UsersModule />
          </TabPanel>
          <TabPanel header="Hotels" leftIcon="pi pi-building mr-2">
            <HotelsModule />
          </TabPanel>
          <TabPanel header="Bookings" leftIcon="pi pi-calendar mr-2">
            <BookingsModule />
          </TabPanel>
        </TabView>
      </main>
    </div>
  );
}

export default App;
