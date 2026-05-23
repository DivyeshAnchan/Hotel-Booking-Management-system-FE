const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    phoneNumber: "+1-555-0101",
    numberOfBookings: 5,
    joinedDate: /* @__PURE__ */ new Date("2023-01-15"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-20")
  },
  {
    id: 2,
    name: "Jane Smith",
    phoneNumber: "+1-555-0102",
    numberOfBookings: 12,
    joinedDate: /* @__PURE__ */ new Date("2023-03-22"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-22")
  },
  {
    id: 3,
    name: "Michael Johnson",
    phoneNumber: "+1-555-0103",
    numberOfBookings: 3,
    joinedDate: /* @__PURE__ */ new Date("2024-06-10"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-18")
  },
  {
    id: 4,
    name: "Emily Davis",
    phoneNumber: "+1-555-0104",
    numberOfBookings: 8,
    joinedDate: /* @__PURE__ */ new Date("2023-09-05"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-23")
  },
  {
    id: 5,
    name: "David Wilson",
    phoneNumber: "+1-555-0105",
    numberOfBookings: 15,
    joinedDate: /* @__PURE__ */ new Date("2023-02-18"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-21")
  },
  {
    id: 6,
    name: "Sarah Brown",
    phoneNumber: "+1-555-0106",
    numberOfBookings: 7,
    joinedDate: /* @__PURE__ */ new Date("2024-01-12"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-19")
  },
  {
    id: 7,
    name: "James Taylor",
    phoneNumber: "+1-555-0107",
    numberOfBookings: 4,
    joinedDate: /* @__PURE__ */ new Date("2024-08-25"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-17")
  },
  {
    id: 8,
    name: "Jessica Martinez",
    phoneNumber: "+1-555-0108",
    numberOfBookings: 10,
    joinedDate: /* @__PURE__ */ new Date("2023-07-14"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-22")
  },
  {
    id: 9,
    name: "Christopher Anderson",
    phoneNumber: "+1-555-0109",
    numberOfBookings: 6,
    joinedDate: /* @__PURE__ */ new Date("2024-03-30"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-20")
  },
  {
    id: 10,
    name: "Amanda Thomas",
    phoneNumber: "+1-555-0110",
    numberOfBookings: 9,
    joinedDate: /* @__PURE__ */ new Date("2023-11-08"),
    lastLoggedIn: /* @__PURE__ */ new Date("2026-05-23")
  }
];
const mockHotels = [
  {
    id: 1,
    name: "Grand Plaza Hotel",
    phoneNumber: "+1-555-1001",
    joinedDate: /* @__PURE__ */ new Date("2022-01-10"),
    rating: 4.5,
    totalBooked: 245,
    state: "California",
    city: "Los Angeles",
    roomTypes: ["Standard", "Deluxe", "Suite"],
    availableRooms: 25
  },
  {
    id: 2,
    name: "Sunset Beach Resort",
    phoneNumber: "+1-555-1002",
    joinedDate: /* @__PURE__ */ new Date("2022-03-15"),
    rating: 4.8,
    totalBooked: 320,
    state: "Florida",
    city: "Miami",
    roomTypes: ["Standard", "Ocean View", "Presidential Suite"],
    availableRooms: 18
  },
  {
    id: 3,
    name: "Mountain View Lodge",
    phoneNumber: "+1-555-1003",
    joinedDate: /* @__PURE__ */ new Date("2022-06-20"),
    rating: 4.2,
    totalBooked: 156,
    state: "Colorado",
    city: "Denver",
    roomTypes: ["Standard", "Deluxe"],
    availableRooms: 32
  },
  {
    id: 4,
    name: "City Center Inn",
    phoneNumber: "+1-555-1004",
    joinedDate: /* @__PURE__ */ new Date("2022-08-05"),
    rating: 4,
    totalBooked: 198,
    state: "New York",
    city: "New York City",
    roomTypes: ["Standard", "Executive", "Suite"],
    availableRooms: 15
  },
  {
    id: 5,
    name: "Lakeside Paradise Hotel",
    phoneNumber: "+1-555-1005",
    joinedDate: /* @__PURE__ */ new Date("2022-10-12"),
    rating: 4.6,
    totalBooked: 287,
    state: "Michigan",
    city: "Detroit",
    roomTypes: ["Standard", "Lakefront", "Penthouse"],
    availableRooms: 22
  },
  {
    id: 6,
    name: "Desert Oasis Resort",
    phoneNumber: "+1-555-1006",
    joinedDate: /* @__PURE__ */ new Date("2023-01-18"),
    rating: 4.4,
    totalBooked: 210,
    state: "Arizona",
    city: "Phoenix",
    roomTypes: ["Standard", "Deluxe", "Villa"],
    availableRooms: 28
  },
  {
    id: 7,
    name: "Harbor View Hotel",
    phoneNumber: "+1-555-1007",
    joinedDate: /* @__PURE__ */ new Date("2023-03-25"),
    rating: 4.7,
    totalBooked: 301,
    state: "Washington",
    city: "Seattle",
    roomTypes: ["Standard", "Harbor View", "Suite"],
    availableRooms: 12
  },
  {
    id: 8,
    name: "Royal Palace Hotel",
    phoneNumber: "+1-555-1008",
    joinedDate: /* @__PURE__ */ new Date("2023-05-30"),
    rating: 4.9,
    totalBooked: 425,
    state: "California",
    city: "San Francisco",
    roomTypes: ["Standard", "Deluxe", "Royal Suite", "Presidential"],
    availableRooms: 8
  },
  {
    id: 9,
    name: "Green Valley Inn",
    phoneNumber: "+1-555-1009",
    joinedDate: /* @__PURE__ */ new Date("2023-07-14"),
    rating: 4.1,
    totalBooked: 142,
    state: "Oregon",
    city: "Portland",
    roomTypes: ["Standard", "Garden View"],
    availableRooms: 35
  },
  {
    id: 10,
    name: "Skyline Tower Hotel",
    phoneNumber: "+1-555-1010",
    joinedDate: /* @__PURE__ */ new Date("2023-09-22"),
    rating: 4.5,
    totalBooked: 267,
    state: "Illinois",
    city: "Chicago",
    roomTypes: ["Standard", "Skyline View", "Executive Suite"],
    availableRooms: 20
  }
];
const mockBookings = [
  {
    id: 1,
    hotelId: 1,
    hotelName: "Grand Plaza Hotel",
    userId: 1,
    userName: "John Doe",
    checkInDate: /* @__PURE__ */ new Date("2026-06-01"),
    checkOutDate: /* @__PURE__ */ new Date("2026-06-05"),
    numberOfGuests: 2,
    roomType: "Deluxe",
    totalAmount: 800,
    paid: true
  },
  {
    id: 2,
    hotelId: 2,
    hotelName: "Sunset Beach Resort",
    userId: 2,
    userName: "Jane Smith",
    checkInDate: /* @__PURE__ */ new Date("2026-06-10"),
    checkOutDate: /* @__PURE__ */ new Date("2026-06-15"),
    numberOfGuests: 4,
    roomType: "Ocean View",
    totalAmount: 1500,
    paid: true
  },
  {
    id: 3,
    hotelId: 3,
    hotelName: "Mountain View Lodge",
    userId: 3,
    userName: "Michael Johnson",
    checkInDate: /* @__PURE__ */ new Date("2026-05-25"),
    checkOutDate: /* @__PURE__ */ new Date("2026-05-28"),
    numberOfGuests: 2,
    roomType: "Standard",
    totalAmount: 450,
    paid: false
  },
  {
    id: 4,
    hotelId: 8,
    hotelName: "Royal Palace Hotel",
    userId: 5,
    userName: "David Wilson",
    checkInDate: /* @__PURE__ */ new Date("2026-07-01"),
    checkOutDate: /* @__PURE__ */ new Date("2026-07-07"),
    numberOfGuests: 2,
    roomType: "Royal Suite",
    totalAmount: 2400,
    paid: true
  },
  {
    id: 5,
    hotelId: 5,
    hotelName: "Lakeside Paradise Hotel",
    userId: 8,
    userName: "Jessica Martinez",
    checkInDate: /* @__PURE__ */ new Date("2026-06-20"),
    checkOutDate: /* @__PURE__ */ new Date("2026-06-23"),
    numberOfGuests: 3,
    roomType: "Lakefront",
    totalAmount: 900,
    paid: true
  },
  {
    id: 6,
    hotelId: 4,
    hotelName: "City Center Inn",
    userId: 4,
    userName: "Emily Davis",
    checkInDate: /* @__PURE__ */ new Date("2026-05-28"),
    checkOutDate: /* @__PURE__ */ new Date("2026-05-30"),
    numberOfGuests: 1,
    roomType: "Executive",
    totalAmount: 350,
    paid: true
  },
  {
    id: 7,
    hotelId: 7,
    hotelName: "Harbor View Hotel",
    userId: 10,
    userName: "Amanda Thomas",
    checkInDate: /* @__PURE__ */ new Date("2026-08-05"),
    checkOutDate: /* @__PURE__ */ new Date("2026-08-10"),
    numberOfGuests: 2,
    roomType: "Harbor View",
    totalAmount: 1100,
    paid: false
  },
  {
    id: 8,
    hotelId: 6,
    hotelName: "Desert Oasis Resort",
    userId: 6,
    userName: "Sarah Brown",
    checkInDate: /* @__PURE__ */ new Date("2026-07-15"),
    checkOutDate: /* @__PURE__ */ new Date("2026-07-20"),
    numberOfGuests: 4,
    roomType: "Villa",
    totalAmount: 1800,
    paid: true
  }
];
export {
  mockBookings,
  mockHotels,
  mockUsers
};
