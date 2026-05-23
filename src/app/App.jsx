import { useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { UsersModule } from "./components/UsersModule";
import { HotelsModule } from "./components/HotelsModule";
import { BookingsModule } from "./components/BookingsModule";
import { mockUsers, mockHotels, mockBookings } from "./data/mockData";

function App() {
  const [bookings, setBookings] = useState(mockBookings);

  const handleBookingCreated = (newBooking) => {
    setBookings((currentBookings) => [...currentBookings, newBooking]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1800px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <i className="pi pi-building text-xl" />
          </div>
          <div className="min-w-0">
            <h1 className="m-0 truncate text-2xl font-semibold text-slate-950">
              Hotel Booking Management
            </h1>
            <p className="m-0 mt-1 text-sm text-slate-500">
              Admin dashboard for managing users, hotels, and bookings
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8">
        <TabView className="dashboard-tabs">
          <TabPanel header="Users" leftIcon="pi pi-users mr-2">
            <UsersModule users={mockUsers} />
          </TabPanel>
          <TabPanel header="Hotels" leftIcon="pi pi-building mr-2">
            <HotelsModule hotels={mockHotels} />
          </TabPanel>
          <TabPanel header="Bookings" leftIcon="pi pi-calendar mr-2">
            <BookingsModule
              bookings={bookings}
              onBookingCreated={handleBookingCreated}
            />
          </TabPanel>
        </TabView>
      </main>
    </div>
  );
}

export default App;
